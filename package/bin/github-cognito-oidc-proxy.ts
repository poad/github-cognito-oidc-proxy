#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { GithubCognitoOidcProxyStack } from '../lib/github-cognito-oidc-proxy-stack';

const app = new cdk.App();
const env = app.node.tryGetContext('env');

const envPrefix = env ? `${env}-` : '';

// eslint-disable-next-line no-new
new GithubCognitoOidcProxyStack(app, `${envPrefix}github-cognito-oidc-proxy-stack`, {
  environment: env,
});
