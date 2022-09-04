# GitHub OAuth 2.0 OpenID Connect Proxy for AWS Cognito

<p align='center'>
  [![Build and Test](https://github.com/poad/github-cognito-oidc-proxy/actions/workflows/test.yml/badge.svg)](https://github.com/poad/github-cognito-oidc-proxy/actions/workflows/test.yml)
  [![Deploy](https://github.com/poad/github-cognito-oidc-proxy/actions/workflows/deploy.yml/badge.svg)](https://github.com/poad/github-cognito-oidc-proxy/actions/workflows/deploy.yml)
</p>

Connect to AWS Cognito using API Gateway and Lambda Function as a proxy for GitHub OAuth applications and as an Identity Provider via OpenID Connect.

## How to use?

### requirement

- Node.js 14+
- AWS CDK
- yarn 1.x

### Deploy AWS Resources

```sh
cd api
yarn install
cdk deploy
```

#### context parameter

| key | description | require |
|:----|:------------|:--------|
| env | The CloudFormation Sack to be built and the prefix name to be set for the AWS resource. | No |

### Configure the AWS Cognito user pool

Now that API Gateway v1 (Rest API) is built, set the GitHub OAuth application and API Gateway endpoint to "Federated identity provider sign-in" in the Cognito user pool.

<https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-oidc-idp.html>

| Name | Description of the value to be set |
| Client ID | A client ID of Your GitHub OAuth 2.0 application. |
| Client secret | A client secret of Your GitHub OAuth 2.0 application. |
| Authorized scopes | `openid read:user user:email` |
| Attribute request method | GET |
| Setup method | Auto fill through issuer URL |
| Issuer URL | The endpoint URL for the `default` stage of your API Gateway. |

#### Issuer URL

The stage name of the deployed API Gateway is default.

The value to be set for the Issue URL is as follows:

https://~{API ID}~.execute-api.~{AWS Region}~.amazonaws.com/default

### Attributes Mapping

