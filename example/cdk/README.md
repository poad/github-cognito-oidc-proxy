# example for GitHub OAuth 2.0 OpenID Connect Proxy for AWS Cognito

Here is an example of deploying a Cognito user pool, S3 bucket, CloudFront distribution, and running the Next.js sample app.

## Prerequisite

The [package](../package/) must have been deployed.

## configure and deploy

Describe the settings necessary to deploy Cognito in cdk.json.
Follow the steps described in [package/README.md](. /package/README.md), the steps after "Configure AWS Cognito User Pool" will be executed automatically.

1. copy example-cdk.json to cdk.json
2. edit the cdk.json
3. deploy the Cognito\
```
cd example
yarn install
# S3 buckets, CloudFront distribution and Next.js apps will also be deployed
cdk deploy -c env=dev
```
4. copy app/.env.local-example to app/.env.local
5. edit the app/.env.local\
Configure information about the deployed Cognito user pool.
6. deploy the Next.js app\
```
yarn install
# Deploy the Next.js app again.
cdk deploy -c env=dev
```

