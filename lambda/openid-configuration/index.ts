import {
  Handler,
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger();

export const handler: Handler<
APIGatewayProxyEventV2,
APIGatewayProxyResultV2 | void
> = async (event, _context, callback) => {
  const host = event.headers.Host!;
  const body = JSON.stringify({
    issuer: `https://${host}`,
    authorization_endpoint: `https://${host}/authorize`,
    token_endpoint: `https://${host}/token`,
    token_endpoint_auth_methods_supported: [
      'client_secret_basic',
      'private_key_jwt',
    ],
    token_endpoint_auth_signing_alg_values_supported: ['RS256'],
    userinfo_endpoint: `https://${host}/userinfo`,
    jwks_uri: `https://${host}/.well-known/jwks.json`,
    scopes_supported: ['openid', 'read:user', 'user:email'],
    response_types_supported: [
      'code',
      'code id_token',
      'id_token',
      'token id_token',
    ],
    subject_types_supported: ['public'],
    userinfo_signing_alg_values_supported: ['none'],
    id_token_signing_alg_values_supported: ['RS256'],
    request_object_signing_alg_values_supported: ['none'],
    display_values_supported: ['page', 'popup'],
    claims_supported: [
      'sub',
      'name',
      'preferred_username',
      'profile',
      'picture',
      'website',
      'email',
      'email_verified',
      'updated_at',
      'iss',
      'aud',
    ],
  });

  logger.info(`Response ${body}`);

  callback(null, {
    statusCode: 200,
    body,
  });
};
