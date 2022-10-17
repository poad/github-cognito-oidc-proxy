import {
  Handler,
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import fetch from 'cross-fetch';
import { left, right, isRight } from 'fp-ts/Either';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger();

const eventToRequest = (bodyString: string) => {
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
    return right(
      () =>
        `token request body [${invalidParams}] in [${paramNames}]. body: ${JSON.stringify(
          body,
        )}`,
    );
  }

  return left(() => ({
    // grant_type: body.get('grant_type')!,
    redirect_uri: body.get('redirect_uri')!,
    client_id: body.get('client_id')!,
    client_secret: body.get('client_secret')!,
    code: body.get('code')!,
    ...(body.has('state') ? { state: body.get('state') } : {}),
  }));
};

export const handler: Handler<
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2 | void
> = async (event, _context, callback) => {
  if (!event.body) {
    logger.warn('body is undefined');
    callback(null, {
      statusCode: 400,
    });
    return;
  }
  const result = eventToRequest(event.body);
  if (isRight(result)) {
    const message = result.right();
    logger.warn(
      `cannot convert event to request. reson: ${message}, request: ${JSON.stringify(
        event,
      )}`,
    );
    callback(null, {
      statusCode: 400,
      body: result.right(),
    });
    return;
  }
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(result.left()),
  });
  callback(null, {
    statusCode: response.status,
    body: JSON.stringify(await response.json()),
  });
};
