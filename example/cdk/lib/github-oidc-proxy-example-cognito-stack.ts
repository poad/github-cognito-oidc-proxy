/* eslint-disable no-new */
import * as crypto from 'crypto';
import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import * as origin from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as deployment from 'aws-cdk-lib/aws-s3-deployment';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface GitHubOidcProxyExampleCognitoConfig {
  domainPrefix: string;
  identityProviderClientId: string;
  identityProviderClientSecret: string;
  identityProviderRequestMethod: string;
  identityProviderIssuerURL: string;
  identityProviderAuthorizeScopes: string;
}

interface GitHubOidcProxyExampleCognitoStackProps extends GitHubOidcProxyExampleCognitoConfig, cdk.StackProps {
  environment: string;
}

export class GitHubOidcProxyExampleCognitoStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: GitHubOidcProxyExampleCognitoStackProps,
  ) {
    super(scope, id, props);

    const { account, region } = this;

    const {
      environment,
      domainPrefix,
      identityProviderClientId,
      identityProviderClientSecret,
      identityProviderRequestMethod,
      identityProviderIssuerURL,
      identityProviderAuthorizeScopes,
    } = props;

    const hash = crypto
      .createHash('md5')
      .update(new Date().getTime().toString())
      .digest('hex');

    const s3BucketName = `${environment}-github-oidc-proxy-example-static-stite`;

    const distribution = new cloudfront.Distribution(this, 'CloudFront', {
      comment: 'example for github-cognito-oidc-proxy',
      defaultBehavior: {
        origin: new origin.HttpOrigin(
          `${s3BucketName}.s3-website-${region}.amazonaws.com`,
          {
            customHeaders: {
              Referer: hash,
            },
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          },
        ),
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      },
      enableIpv6: false,
      defaultRootObject: 'index.html',
    });

    const s3bucket = new s3.Bucket(this, 'S3Bucket', {
      bucketName: s3BucketName,
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      accessControl: s3.BucketAccessControl.PRIVATE,
      publicReadAccess: false,
      websiteIndexDocument: 'index.html',
    });

    const deployRole = new iam.Role(this, 'DeployWebsiteRole', {
      roleName: `${environment}-github-oidc-proxy-deploy-role`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        's3-policy': new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:*'],
              resources: [`${s3bucket.bucketArn}/`, `${s3bucket.bucketArn}/*`],
            }),
          ],
        }),
      },
    });

    s3bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        actions: ['s3:*'],
        principals: [new iam.StarPrincipal()],
        resources: [`${s3bucket.bucketArn}/*`],
        conditions: {
          StringNotLike: {
            'aws:Referer': hash,
          },
          StringNotEquals: {
            's3:ResourceAccount': account,
            'aws:PrincipalArn': new iam.ArnPrincipal(deployRole.roleArn).arn,
          },
        },
      }),
    );
    s3bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject'],
        principals: [new iam.StarPrincipal()],
        resources: [`${s3bucket.bucketArn}/*`],
        conditions: {
          StringLike: {
            'aws:Referer': hash,
          },
        },
      }),
    );
    s3bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:*'],
        principals: [new iam.AccountPrincipal(account)],
        resources: [`${s3bucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            's3:ResourceAccount': account,
          },
        },
      }),
    );

    new deployment.BucketDeployment(this, 'DeployWebsite', {
      sources: [deployment.Source.asset(`${process.cwd()}/../app/out`)],
      destinationBucket: s3bucket,
      destinationKeyPrefix: '/',
      exclude: ['.DS_Store', '*/.DS_Store'],
      prune: true,
      retainOnDelete: false,
      role: deployRole,
    });

    const userPool = new cognito.UserPool(this, 'CognitoUserPool', {
      userPoolName: `${environment}-github-oidc-proxy-user-pool`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
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
      mfa: cognito.Mfa.OFF,
      passwordPolicy: {
        minLength: 8,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
    });

    userPool.addDomain('UserPoolDomain', {
      cognitoDomain: {
        domainPrefix,
      },
    });

    const idpName = identityProviderIssuerURL
      ? new cognito.CfnUserPoolIdentityProvider(this, 'CfnCognitoIdPGitHub', {
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
      }).providerName
      : undefined;

    if (idpName) {
      userPool.registerIdentityProvider(
        cognito.UserPoolIdentityProvider.fromProviderName(
          this,
          'CognitoIdPGitHub',
          idpName,
        ),
      );
      cognito.UserPoolClientIdentityProvider.custom(idpName);
    }

    const client = new cognito.UserPoolClient(this, 'CognitoAppClient', {
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
          `https://${distribution.distributionDomainName}/`,
          'http://localhost:3000/',
        ],
        logoutUrls: [
          `https://${distribution.distributionDomainName}/`,
          'http://localhost:3000/',
        ],
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.COGNITO_ADMIN,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
      },
      readAttributes: new cognito.ClientAttributes().withStandardAttributes({
        email: true,
        familyName: true,
        givenName: true,
        fullname: true,
        preferredUsername: true,
        emailVerified: true,
        profilePage: true,
      }),
      writeAttributes: new cognito.ClientAttributes().withStandardAttributes({
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
    const identityPool = new cognito.CfnIdentityPool(this, 'CognitoIdPool', {
      allowUnauthenticatedIdentities: false,
      allowClassicFlow: true,
      cognitoIdentityProviders: [identityPoolProvider],
      identityPoolName: `${environment} Cognito GitHub OIDC Proxy idp`,
    });

    const unauthenticatedRole = new iam.Role(
      this,
      'CognitoDefaultUnauthenticatedRole',
      {
        roleName: `${environment}-github-oidc-proxy-example-cognito-unauth-role`,
        assumedBy: new iam.FederatedPrincipal(
          'cognito-identity.amazonaws.com',
          {
            StringEquals: {
              'cognito-identity.amazonaws.com:aud': identityPool.ref,
            },
            'ForAnyValue:StringLike': {
              'cognito-identity.amazonaws.com:amr': 'unauthenticated',
            },
          },
          'sts:AssumeRoleWithWebIdentity',
        ),
        maxSessionDuration: cdk.Duration.hours(12),
        inlinePolicies: {
          'cognito-policy': new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['cognito-sync:*', 'cognito-identity:*'],
                resources: ['*'],
              }),
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['sts:*'],
                resources: ['*'],
              }),
            ],
          }),
        },
      },
    );

    const authenticatedRole = new iam.Role(
      this,
      'CognitoDefaultAuthenticatedRole',
      {
        roleName: `${environment}-github-oidc-proxy-example-cognito-auth-role`,
        assumedBy: new iam.FederatedPrincipal(
          'cognito-identity.amazonaws.com',
          {
            StringEquals: {
              'cognito-identity.amazonaws.com:aud': identityPool.ref,
            },
            'ForAnyValue:StringLike': {
              'cognito-identity.amazonaws.com:amr': 'authenticated',
            },
          },
          'sts:AssumeRoleWithWebIdentity',
        ).withSessionTags(),
        maxSessionDuration: cdk.Duration.hours(12),
        inlinePolicies: {
          'cognito-policy': new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['cognito-sync:*', 'cognito-identity:*'],
                resources: ['*'],
              }),
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['sts:*'],
                resources: ['*'],
              }),
            ],
          }),
        },
      },
    );

    new cognito.CfnIdentityPoolRoleAttachment(this, 'CognitoIdPoolRoleAttachment', {
      identityPoolId: identityPool.ref,
      roles: {
        authenticated: authenticatedRole.roleArn,
        unauthenticated: unauthenticatedRole.roleArn,
      },
    });
  }
}
