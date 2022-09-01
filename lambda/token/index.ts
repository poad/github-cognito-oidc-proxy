import {
  Handler,
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import fetch from 'cross-fetch';
import { left, right, isRight } from 'fp-ts/Either';

const eventToRequest = (source: string) => {
  const bodyString = Buffer.from(source, 'base64').toString('ascii');
  const body = new URLSearchParams(bodyString);
  const paramNames = [
    'grant_type',
    'redirect_uri',
    'client_id',
    'client_secret',
    'code',
  ];

  const invalidParams = paramNames.filter((name) => !body.has(name));
  if (invalidParams.length > 0) {
    return right(() => `token request body ${invalidParams}`);
  }

  return left(() => ({
    grant_type: body.get('grant_type')!,
    redirect_uri: body.get('redirect_uri')!,
    client_id: body.get('client_id')!,
    client_secret: body.get('client_secret')!,
    code: body.get('code')!,
    state: body.get('state') ?? undefined,
  }));
};

export const handler: Handler<
APIGatewayProxyEventV2,
APIGatewayProxyResultV2 | void
> = async (event, _context, callback) => {
  if (!event.body) {
    callback(null, {
      statusCode: 400,
    });
    return;
  }
  const result = eventToRequest(event.body);
  if (isRight(result)) {
    callback(null, {
      statusCode: 400,
      body: result.right(),
    });
    return;
  }
  const body = JSON.stringify(result.left());
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      Accept: 'application/json',
    },
    body,
  });
  callback(null, {
    statusCode: 200,
    body: JSON.stringify(await response.json()),
  });
};
