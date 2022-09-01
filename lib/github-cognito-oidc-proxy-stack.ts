import * as cdk from 'aws-cdk-lib';
import { RemovalPolicy } from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import {
  Role, ServicePrincipal, PolicyDocument, PolicyStatement, Effect,
} from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, SourceMapMode } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface GithubCognitoOidcProxyStackProps extends cdk.StackProps {
  environment: string
}

export class GithubCognitoOidcProxyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: GithubCognitoOidcProxyStackProps) {
    super(scope, id, props);

    const { environment } = props;

    const jwksFunctionName = `${environment}-github-cognito-openid-proxy-jwks`;
    const jwksLogs = new LogGroup(this, 'GithubCognitoOidcProxyJwksFunctionLogGroup', {
      logGroupName: `/aws/lambda/${jwksFunctionName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_DAY,
    });
    const jwks = new NodejsFunction(this, 'GithubCognitoOidcProxyJwksFunction', {
      runtime: Runtime.NODEJS_16_X,
      entry: './lambda/jwks/index.ts',
      functionName: jwksFunctionName,
      retryAttempts: 0,
      bundling: {
        minify: true,
        sourceMap: true,
        sourceMapMode: SourceMapMode.BOTH,
        sourcesContent: true,
        keepNames: true,
        commandHooks: {
          beforeInstall(): string[] {
            return [''];
          },
          beforeBundling(): string[] {
            return [''];
          },
          afterBundling(inputDir: string, outputDir: string): string[] {
            return [
              // private key を追加
              `cp ${inputDir}/jwtRS256.private.pem ${outputDir}`,
              // public key を追加
              `cp ${inputDir}/jwtRS256.public.pem ${outputDir}`,
            ];
          },
        },
      },
      role: new Role(this, 'GithubCognitoOidcProxyJwksFunctionExecutionRole', {
        assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
        inlinePolicies: {
          'logs-policy': new PolicyDocument({
            statements: [
              new PolicyStatement({
                effect: Effect.ALLOW,
                actions: [
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                ],
                resources: [`${jwksLogs.logGroupArn}:*`],
              }),
            ],
          }),
        },
      }),
    });

    const userInfoFunctionName = `${environment}-github-cognito-openid-proxy-user-info`;
    const userInfoLogs = new LogGroup(this, 'GithubCognitoOidcProxyUserInfoFunctionLogGroup', {
      logGroupName: `/aws/lambda/${userInfoFunctionName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_DAY,
    });
    const userInfo = new NodejsFunction(this, 'GithubCognitoOidcProxyUserInfoFunction', {
      runtime: Runtime.NODEJS_16_X,
      entry: './lambda/userinfo/index.ts',
      functionName: userInfoFunctionName,
      retryAttempts: 0,
      bundling: {
        minify: true,
        sourceMap: true,
        sourceMapMode: SourceMapMode.BOTH,
        sourcesContent: true,
        keepNames: true,
      },
      role: new Role(this, 'GithubCognitoOidcProxyUserInfoFunctionExecutionRole', {
        assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
        inlinePolicies: {
          'logs-policy': new PolicyDocument({
            statements: [
              new PolicyStatement({
                effect: Effect.ALLOW,
                actions: [
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                ],
                resources: [`${userInfoLogs.logGroupArn}:*`],
              }),
            ],
          }),
        },
      }),
    });

    const authorizeFunctionName = `${environment}-github-cognito-openid-proxy-authorize`;
    const authorizeLogs = new LogGroup(this, 'GithubCognitoOidcProxyAuthorizeFunctionLogGroup', {
      logGroupName: `/aws/lambda/${authorizeFunctionName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_DAY,
    });
    const authorize = new NodejsFunction(this, 'GithubCognitoOidcProxyAuthorizeFunction', {
      runtime: Runtime.NODEJS_16_X,
      entry: './lambda/authorize/index.ts',
      functionName: authorizeFunctionName,
      retryAttempts: 0,
      bundling: {
        minify: true,
        sourceMap: true,
        sourceMapMode: SourceMapMode.BOTH,
        sourcesContent: true,
        keepNames: true,
      },
      role: new Role(this, 'GithubCognitoOidcProxyAuthorizeFunctionExecutionRole', {
        assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
        inlinePolicies: {
          'logs-policy': new PolicyDocument({
            statements: [
              new PolicyStatement({
                effect: Effect.ALLOW,
                actions: [
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                ],
                resources: [`${authorizeLogs.logGroupArn}:*`],
              }),
            ],
          }),
        },
      }),
    });

    const tokenFunctionName = `${environment}-github-cognito-openid-proxy-token`;
    const tokenLogs = new LogGroup(this, 'GithubCognitoOidcProxyTokenFunctionLogGroup', {
      logGroupName: `/aws/lambda/${tokenFunctionName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_DAY,
    });
    const token = new NodejsFunction(this, 'GithubCognitoOidcProxyTokenFunction', {
      runtime: Runtime.NODEJS_16_X,
      entry: './lambda/token/index.ts',
      functionName: tokenFunctionName,
      retryAttempts: 0,
      bundling: {
        minify: true,
        sourceMap: true,
        sourceMapMode: SourceMapMode.BOTH,
        sourcesContent: true,
        keepNames: true,
      },
      role: new Role(this, 'GithubCognitoOidcProxyTokenFunctionExecutionRole', {
        assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
        inlinePolicies: {
          'logs-policy': new PolicyDocument({
            statements: [
              new PolicyStatement({
                effect: Effect.ALLOW,
                actions: [
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                ],
                resources: [`${tokenLogs.logGroupArn}:*`],
              }),
            ],
          }),
        },
      }),
    });

    const api = new RestApi(this, `GitHub Cognito OpenID Connect Proxy API (${environment})`, {
      description: `GitHub Cognito OpenID Connect Proxy API (${environment})`,
    });
    api.root.addResource('.well-known').addResource('jwks.json').addMethod('GET', new LambdaIntegration(jwks));

    const userInfoApi = api.root.addResource('userinfo');
    userInfoApi.addMethod('GET', new LambdaIntegration(userInfo));
    userInfoApi.addMethod('POST', new LambdaIntegration(userInfo));

    const authorizeApi = api.root.addResource('authorize');
    authorizeApi.addMethod('GET', new LambdaIntegration(authorize));
    authorizeApi.addMethod('POST', new LambdaIntegration(authorize));

    const tokenApi = api.root.addResource('token');
    tokenApi.addMethod('GET', new LambdaIntegration(token));
    tokenApi.addMethod('POST', new LambdaIntegration(token));
  }
}
