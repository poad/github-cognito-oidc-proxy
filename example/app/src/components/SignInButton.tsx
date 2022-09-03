import React from 'react';

const authEndpoint = process.env.NEXT_PUBLIC_COGNITO_ENDPOINT;
const clirenId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

const endpointUrl = `${authEndpoint}oauth2/authorize?response_type=code&client_id=${clirenId}&scope=openid+email`;

const onClick = () => window.location.href = `${endpointUrl}&redirect_uri=${encodeURIComponent(window.location.href)}`;
const SignInButton = () => {
  return (
    <>
      <p>
        <button onClick={onClick}>SignIn</button>
      </p>
      <p>
        <textarea>{typeof window !== 'undefined' ? window.location.href : ''}</textarea>
      </p>
    </>
  );
};

export default SignInButton;
