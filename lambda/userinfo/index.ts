import {
  Handler,
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import fetch from 'cross-fetch';
import {
  left, right, isRight, Either,
} from 'fp-ts/Either';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger();

interface Email {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility?: 'private' | 'public';
}

const getUser = async (token: string): Promise<Either<{
  id: number;
  name: string,
  login: string,
  html_url: string,
  avatar_url: string,
  blog: string,
  updated_at: string
}, string>> => {
  const response = await fetch('https://api.github.com/user', {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (response.status !== 200) {
    return right(
      `Cannot get user ID. status: ${response.statusText}. ${response.text()}`,
    );
  }

  const user = (await response.json()) as {
    id: number;
    name: string,
    login: string,
    html_url: string,
    avatar_url: string,
    blog: string,
    updated_at: string
  };

  return left({
    id: user.id,
    name: user.name,
    login: user.login,
    html_url: user.html_url,
    avatar_url: user.avatar_url,
    blog: user.blog,
    updated_at: user.updated_at,
  });
};

const getValidEmail = async (token: string): Promise<Either<Email, string>> => {
  const response = await fetch('https://api.github.com/user/emails', {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (response.status !== 200) {
    return right(
      `Cannot get mails. status: ${response.statusText}. ${response.text()}`,
    );
  }
  const emails = (await response.json()) as {
    email: string;
    primary: boolean;
    verified: boolean;
    visibility?: 'private' | 'public';
  }[];

  logger.info(JSON.stringify(emails));

  const email = emails.find(
    (it) => it.primary
      && it.verified
      && !it.email.trim().endsWith('noreply.github.com'),
  );
  return email ? left(email) : right('/user/emails returned no valid emails');
};

export const handler: Handler<
APIGatewayProxyEventV2,
APIGatewayProxyResultV2 | void
> = async (event, _context, callback) => {
  const { headers } = event;
  const authHeader = headers.authorization || headers.Authorization;
  if (!authHeader) {
    logger.warn('/userinfo request contained no accessToken');
    callback(null, {
      statusCode: 400,
      body: '/userinfo request contained no accessToken',
    });
    return;
  }
  const authHeaderPrefix = authHeader.slice(0, 'bearer '.length);
  if (authHeaderPrefix.toLowerCase() !== 'bearer ') {
    logger.warn('authorization header does not contain bearer token');
    callback(null, {
      statusCode: 400,
      body: 'authorization header does not contain bearer token',
    });
    return;
  }
  const token = authHeader.slice('bearer '.length).trim();
  if (!token) {
    logger.warn('authorization header does not contain bearer token');
    callback(null, {
      statusCode: 400,
      body: 'authorization header does not contain bearer token',
    });
  }

  const [userResult, emailResult] = await Promise.all([
    getUser(token),
    getValidEmail(token),
  ]);
  if (isRight(userResult)) {
    logger.warn(userResult.right);
    callback(null, {
      statusCode: 400,
      body: `/userinfo ${userResult.right}`,
    });
    return;
  }
  if (isRight(emailResult)) {
    logger.warn(emailResult.right);
    callback(null, {
      statusCode: 400,
      body: `/userinfo ${emailResult.right}`,
    });
    return;
  }

  const user = userResult.left;
  const email = emailResult.left;
  const body = JSON.stringify({
    sub: user.id.toString(),
    name: user.name,
    preferred_username: user.login,
    profile: user.html_url,
    picture: user.avatar_url,
    website: user.blog,
    updated_at: new Date(Date.parse(user.updated_at)).getTime() / 1000,
    email: email.email,
    email_verified: email.verified,
  });

  logger.info(body);

  callback(null, {
    statusCode: 200,
    body,
  });
};
