#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {
  GitHubOidcProxyExampleCognitoStack,
  GitHubOidcProxyExampleCognitoConfig,
} from '../lib/github-oidc-proxy-example-cognito-stack';
import { nextJsExport } from '../lib/process/setup';

const app = new cdk.App();

const env = app.node.tryGetContext('env') as string;

const config = app.node.tryGetContext(
  env,
) as GitHubOidcProxyExampleCognitoConfig;

nextJsExport({
  endpoint: `https://${config.domainPrefix}.auth.us-west-2.amazoncognito.com/`,
});

 
new GitHubOidcProxyExampleCognitoStack(
  app,
  `${env}-github-oidc-proxy-example-stack`,
  {
    environment: env,
    ...config,
  },
);
