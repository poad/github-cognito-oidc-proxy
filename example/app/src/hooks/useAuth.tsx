import { useEffect, useState } from 'react';
import { Buffer } from 'buffer';

const endpoint = process.env.NEXT_PUBLIC_COGNITO_ENDPOINT;
const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
const clientSecret = process.env.NEXT_PUBLIC_COGNITO_CLIENT_SECRET;

const tokenEndpointUrl = `${endpoint}oauth2/token`;

interface AccessTokenResp {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
}

export interface AccessToken {
  accessToken: string;
  idToken: string;
  tokenType: string;
  expiresIn: number;
}

const useAuth = () => {
  const [token, setToken] = useState<AccessToken>();

  const location =
    typeof window !== 'undefined' ? new URL(window.location.href) : undefined;
  const params = location?.searchParams;
  const code = params?.has('code') ? params.get('code') : undefined;

  useEffect(() => {
    const fetchToken = async () => {
      const clientSecretBasic = Buffer.from(
        `${clientId}:${clientSecret}`,
      ).toString('base64');
      const data = {
        grant_type: 'authorization_code',
        client_id: clientId,
        code,
        redirect_uri: location?.toString().replaceAll(location?.search, ''),
      };
      const body = Object.entries(data)
        .map((entry) =>
          entry[1]
            ? `${encodeURIComponent(entry[0])}=${encodeURIComponent(entry[1])}`
            : '',
        )
        .reduce((acc, cur) => `${acc}&${cur}`);
      const resp = await fetch(tokenEndpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          Authorization: `Basic ${clientSecretBasic}`,
        },
        body,
      });
      if (resp.status === 200) {
        const resToken = (await resp.json()) as AccessTokenResp;

        setToken({
          accessToken: resToken.access_token,
          idToken: resToken.id_token,
          tokenType: resToken.token_type,
          expiresIn: resToken.expires_in,
        });
      }
    };
    fetchToken();
  }, [code]);

  return { code, token };
};

export default useAuth;
