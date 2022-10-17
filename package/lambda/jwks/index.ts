import {
  Handler,
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import { pem2jwk } from 'pem-jwk';
import * as fs from 'fs';

export const handler: Handler<
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2 | void
> = async (_event, _context, callback) => {
  const pem = fs.readFileSync('/var/task/jwtRS256.private.pem', 'ascii');
  const jwk = pem2jwk(pem, {
    alg: 'RS256',
    kid: 'jwtRS256',
  });

  callback(null, {
    statusCode: 200,
    body: JSON.stringify(jwk),
  });
};
