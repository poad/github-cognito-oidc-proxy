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
  const {
    client_id, scope, state, response_type, redirect_uri,
  } = event.queryStringParameters || {};
  const redirectUri = `https://github.com/login/oauth/authorize?client_id=${client_id}&scope=${encodeURIComponent(
    scope!,
  )}${state ? `&state=${state}` : ''}&response_type=${response_type}${redirect_uri ? `&redirect_uri=${encodeURIComponent(redirect_uri)}` : ''}`;

  logger.info(`Redirect to ${redirectUri}`);

  callback(null, {
    statusCode: 302,
    headers: {
      Location: redirectUri,
    },
  });
};
