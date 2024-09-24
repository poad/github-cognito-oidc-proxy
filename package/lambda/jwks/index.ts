import * as fs from 'fs';
import {
  Handler,
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import { pem2jwk } from 'pem-jwk';

export const handler: Handler<
  APIGatewayProxyEventV2,
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
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
