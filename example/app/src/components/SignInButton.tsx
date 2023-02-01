import React from 'react';
import styles from '../styles/Home.module.css';

const authEndpoint = process.env.NEXT_PUBLIC_COGNITO_ENDPOINT;
const clirenId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

const endpointUrl = `${authEndpoint}oauth2/authorize?response_type=code&client_id=${clirenId}&scope=openid+email`;

const onClick = () =>
  (window.location.href = `${endpointUrl}&redirect_uri=${encodeURIComponent(
    window.location.href,
  )}`);
const SignInButton = () => {
  return (
    <>
      <p className={styles.card}>
        <p>
          <textarea>
            {typeof window !== 'undefined' ? window.location.href : ''}
          </textarea>
        </p>        
        <button onClick={onClick}>SignIn</button>
      </p>
    </>
  );
};

export default SignInButton;
