import fetch from 'cross-fetch';
import { useEffect, useState } from 'react';

const endpoint = process.env.NEXT_PUBLIC_COGNITO_ENDPOINT;

const tokenEndpointUrl = `${endpoint}oauth2/userInfo`;

interface UserInfoResp {
  sub: string,
  username?: string,
  given_name?: string,
  family_name?: string,
  preferred_username?: string,
  email: string,
}

export interface UserInfo {
  sub: string,
  username?: string,
  givenName?: string,
  familyName?: string,
  preferredUsername?: string,
  email: string,
}

const useUserInfo = (accessToken?: string) => {
  const [userInfo, setUserInfo] = useState<UserInfo>();

  useEffect(() => {
    const fetchUserInfo = async () => {
      const resp = await fetch(`${tokenEndpointUrl}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (resp.status === 200) {
        const resToken = (await resp.json()) as UserInfoResp;

        setUserInfo({
          sub: resToken.sub,
          username: resToken.username,
          givenName: resToken.given_name,
          familyName: resToken.family_name,
          preferredUsername: resToken.preferred_username,
          email: resToken.email,
        });
      }
    };
    if (accessToken) {
      fetchUserInfo();
    }
  }, [accessToken]);

  return userInfo;
};

export default useUserInfo;
