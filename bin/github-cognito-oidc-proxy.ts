#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { GithubCognitoOidcProxyStack } from '../lib/github-cognito-oidc-proxy-stack';
import { EnvironmentFile } from 'aws-cdk-lib/aws-ecs';

const app = new cdk.App();
const env = app.node.tryGetContext('env') as string;

new GithubCognitoOidcProxyStack(app, `${env}-github-cognito-oidc-proxy-stack`, {
  environment: env
});
