import {
  Handler,
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';

export const handler: Handler<
APIGatewayProxyEventV2,
APIGatewayProxyResultV2
> = async (event, _context, _callback) => {
  const {
    client_id, scope, state, response_type,
  } = event.queryStringParameters || {};
  const redirectUri = `https://github.com?client_id=${client_id}&scope=${encodeURIComponent(
    scope!,
  )}&state=${state}&response_type=${response_type}`;

  return {
    cookies: [],
    statusCode: 200,
    headers: { Location: redirectUri },
  };
};
