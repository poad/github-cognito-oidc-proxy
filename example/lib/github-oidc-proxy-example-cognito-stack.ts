/* eslint-disable no-new */
import * as cdk from 'aws-cdk-lib';
import {
  UserPool, Mfa, AccountRecovery, CfnUserPoolIdentityProvider, UserPoolIdentityProvider,
  UserPoolClientIdentityProvider, UserPoolClient, OAuthScope, ClientAttributes,
  CfnIdentityPool, CfnIdentityPoolRoleAttachment,
} from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { HttpOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Distribution, CachePolicy, OriginProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import * as crypto from 'crypto';
import { Bucket, BucketAccessControl } from 'aws-cdk-lib/aws-s3';
import {
  AccountPrincipal,
  AccountRootPrincipal,
  ArnPrincipal,
  Effect, FederatedPrincipal, PolicyDocument, PolicyStatement, Role, ServicePrincipal, StarPrincipal,
} from 'aws-cdk-lib/aws-iam';

interface GitHubOidcProxyExampleCognitoStackProps extends cdk.StackProps {
  environment: string,
  domainPrefix: string,
  identityProviderClientId: string,
  identityProviderClientSecret: string,
  identityProviderRequestMethod: string,
  identityProviderIssuerURL: string,
  identityProviderAuthorizeScopes: string,
}

export class GitHubOidcProxyExampleCognitoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: GitHubOidcProxyExampleCognitoStackProps) {
    super(scope, id, props);

    const {
      environment, domainPrefix, identityProviderClientId, identityProviderClientSecret, identityProviderRequestMethod,
      identityProviderIssuerURL, identityProviderAuthorizeScopes,
    } = props;

    const hash = crypto.createHash('md5').update(new Date().getTime().toString()).digest('hex');

    const s3BucketName = `${environment}-github-oidc-proxy-example-static-stite`;

    const cloudfront = new Distribution(this, 'CloudFront', {
      defaultBehavior: {
        origin: new HttpOrigin(`${s3BucketName}.s3-website-${this.region}.amazonaws.com`, {
          customHeaders: {
            Referer: hash,
          },
          protocolPolicy: OriginProtocolPolicy.HTTP_ONLY,
        }),
        cachePolicy: CachePolicy.CACHING_DISABLED,
      },
      enableIpv6: false,
      defaultRootObject: 'index.html',
    });

    const s3bucket = new Bucket(this, 'S3Bucket', {
      bucketName: s3BucketName,
      versioned: false,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      accessControl: BucketAccessControl.PRIVATE,
      publicReadAccess: false,
      websiteIndexDocument: 'index.html',
    });

    const deployRole = new Role(this, 'DeployWebsiteRole', {
      roleName: `${environment}-github-oidc-proxy-deploy-role`,
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        's3-policy': new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                's3:*',
              ],
              resources: [
                `${s3bucket.bucketArn}/`,
                `${s3bucket.bucketArn}/*`,
              ],
            }),
          ],
        }),
      },
    });

    s3bucket.addToResourcePolicy(new PolicyStatement({
      effect: Effect.DENY,
      actions: ['s3:*'],
      principals: [
        new StarPrincipal(),
      ],
      resources: [`${s3bucket.bucketArn}/*`],
      conditions: {
        StringNotLike: {
          'aws:Referer': hash,
        },
        StringNotEquals: {
          's3:ResourceAccount': this.account,
          'aws:PrincipalArn': new ArnPrincipal(deployRole.roleArn).arn,
        },
      },
    }));
    s3bucket.addToResourcePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['s3:GetObject'],
      principals: [new StarPrincipal()],
      resources: [`${s3bucket.bucketArn}/*`],
      conditions: {
        StringLike: {
          'aws:Referer': hash,
        },
      },
    }));
    s3bucket.addToResourcePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['s3:*'],
      principals: [new AccountPrincipal(this.account)],
      resources: [`${s3bucket.bucketArn}/*`],
      conditions: {
        StringEquals: {
          's3:ResourceAccount': this.account,
        },
      },
    }));

    new BucketDeployment(this, 'DeployWebsite', {
      sources: [Source.asset(`${process.cwd()}/app/out`)],
      destinationBucket: s3bucket,
      destinationKeyPrefix: '/',
      exclude: ['.DS_Store', '*/.DS_Store'],
      prune: true,
      retainOnDelete: false,
      role: deployRole,
    });

    const userPool = new UserPool(this, 'CognitoUserPool', {
      userPoolName: `${environment}-github-oidc-proxy-user-pool`,
      removalPolicy: RemovalPolicy.DESTROY,
      signInAliases: {
        username: false,
        email: true,
        preferredUsername: false,
        phone: false,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
        },
        preferredUsername: {
          required: false,
        },
        phoneNumber: {
          required: false,
        },
      },
      mfa: Mfa.OFF,
      passwordPolicy: {
        minLength: 8,
      },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
    });

    userPool.addDomain('UserPoolDomain', {
      cognitoDomain: {
        domainPrefix,
      },
    });

    const idpName = identityProviderIssuerURL
      ? new CfnUserPoolIdentityProvider(this, 'CfnCognitoIdPGitHub', {
        providerName: 'GitHub',
        providerDetails: {
          client_id: identityProviderClientId,
          client_secret: identityProviderClientSecret,
          attributes_request_method: identityProviderRequestMethod,
          oidc_issuer: identityProviderIssuerURL,
          authorize_scopes: identityProviderAuthorizeScopes,
        },
        providerType: 'OIDC',
        attributeMapping: {
          email: 'email',
          email_verified: 'email_verified',
          username: 'sub',
          preferredUsername: 'preferred_username',
        },
        userPoolId: userPool.userPoolId,
      }).providerName : undefined;

    if (idpName) {
      userPool.registerIdentityProvider(
        UserPoolIdentityProvider.fromProviderName(this, 'CognitoIdPGitHub', idpName),
      );
      UserPoolClientIdentityProvider.custom(idpName);
    }

    const client = new UserPoolClient(this, 'CognitoAppClient', {
      userPool,
      userPoolClientName: 'GitHub',
      generateSecret: true,
      authFlows: {
        adminUserPassword: true,
        userSrp: true,
        userPassword: true,
      },
      oAuth: {
        callbackUrls: [
          `https://${cloudfront.distributionDomainName}/`,
          'http://localhost:3000/',
        ],
        logoutUrls: [
          `https://${cloudfront.distributionDomainName}/`,
          'http://localhost:3000/',
        ],
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true,
        },
        scopes: [
          OAuthScope.COGNITO_ADMIN,
          OAuthScope.EMAIL,
          OAuthScope.OPENID,
          OAuthScope.PROFILE,
        ],
      },
      readAttributes: new ClientAttributes().withStandardAttributes({
        email: true,
        familyName: true,
        givenName: true,
        fullname: true,
        preferredUsername: true,
        emailVerified: true,
        profilePage: true,
      }),
      writeAttributes: new ClientAttributes().withStandardAttributes({
        email: true,
        familyName: true,
        givenName: true,
        fullname: true,
        preferredUsername: true,
        profilePage: true,
      }),
    });

    const identityPoolProvider = {
      clientId: client.userPoolClientId,
      providerName: userPool.userPoolProviderName,
    };
    const identityPool = new CfnIdentityPool(this, 'CognitoIdPool', {
      allowUnauthenticatedIdentities: false,
      allowClassicFlow: true,
      cognitoIdentityProviders: [
        identityPoolProvider,
      ],
      identityPoolName: `${environment} Cognito GitHub OIDC Proxy idp`,
    });

    const unauthenticatedRole = new Role(this, 'CognitoDefaultUnauthenticatedRole', {
      roleName: `${environment}-github-oidc-proxy-example-cognito-unauth-role`,
      assumedBy: new FederatedPrincipal('cognito-identity.amazonaws.com', {
        StringEquals: {
          'cognito-identity.amazonaws.com:aud': identityPool.ref,
        },
        'ForAnyValue:StringLike': {
          'cognito-identity.amazonaws.com:amr': 'unauthenticated',
        },
      }, 'sts:AssumeRoleWithWebIdentity'),
      maxSessionDuration: Duration.hours(12),
      inlinePolicies: {
        'cognito-policy': new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'cognito-sync:*',
                'cognito-identity:*',
              ],
              resources: ['*'],
            }),
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'sts:*',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    const authenticatedRole = new Role(this, 'CognitoDefaultAuthenticatedRole', {
      roleName: `${environment}-github-oidc-proxy-example-cognito-auth-role`,
      assumedBy: new FederatedPrincipal('cognito-identity.amazonaws.com', {
        StringEquals: {
          'cognito-identity.amazonaws.com:aud': identityPool.ref,
        },
        'ForAnyValue:StringLike': {
          'cognito-identity.amazonaws.com:amr': 'authenticated',
        },
      }, 'sts:AssumeRoleWithWebIdentity')
        .withSessionTags(),
      maxSessionDuration: Duration.hours(12),
      inlinePolicies: {
        'cognito-policy': new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'cognito-sync:*',
                'cognito-identity:*',
              ],
              resources: ['*'],
            }),
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'sts:*',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    new CfnIdentityPoolRoleAttachment(this, 'CognitoIdPoolRoleAttachment', {
      identityPoolId: identityPool.ref,
      roles: {
        authenticated: authenticatedRole.roleArn,
        unauthenticated: unauthenticatedRole.roleArn,
      },
    });
  }
}
