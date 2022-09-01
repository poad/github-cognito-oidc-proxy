import {
  Handler,
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import fetch from 'cross-fetch';
import {
  left, right, isRight, Either,
} from 'fp-ts/Either';

interface Email {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility?: 'private' | 'public';
}

const getUserId = async (token: string): Promise<Either<number, string>> => {
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
  const { id } = (await response.json()) as {
    id: number;
  };

  return left(id);
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

  const email = emails.find(
    (it) => it.primary
      && it.verified
      && it.email.trim().endsWith('noreply.github.com'),
  );
  return email ? left(email) : right('/user/emails returned no valid emails');
};

export const handler: Handler<
APIGatewayProxyEventV2,
APIGatewayProxyResultV2
> = async (event, _context, _callback) => {
  const { headers } = event;
  const authHeader = headers.authorization || headers.Authorization;
  if (!authHeader) {
    return {
      cookies: [],
      statusCode: 400,
      body: '/userinfo request contained no accessToken',
    };
  }
  const authHeaderPrefix = authHeader.slice(0, 'bearer '.length);
  if (authHeaderPrefix.toLowerCase() !== 'bearer ') {
    return {
      cookies: [],
      statusCode: 400,
      body: 'authorization header does not contain bearer token',
    };
  }
  const token = authHeader.slice('bearer '.length).trim();
  if (!token) {
    return {
      cookies: [],
      statusCode: 400,
      body: 'authorization header does not contain bearer token',
    };
  }

  const [idResult, emailResult] = await Promise.all([
    getUserId(token),
    getValidEmail(token),
  ]);
  if (isRight(idResult)) {
    return {
      cookies: [],
      statusCode: 400,
      body: `/userinfo ${idResult.right}`,
    };
  }
  if (isRight(emailResult)) {
    return {
      cookies: [],
      statusCode: 400,
      body: `/userinfo ${emailResult.right}`,
    };
  }

  const id = idResult.left;
  const email = emailResult.left;
  return {
    cookies: [],
    statusCode: 200,
    body: JSON.stringify({
      sub: id.toString(),
      email: email.email,
      email_verified: email.verified,
    }),
  };
};
