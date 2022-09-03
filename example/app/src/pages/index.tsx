import type { NextPage } from 'next';
import Head from 'next/head';
import SignInButton from '../components/SignInButton';
import useAuth from '../hooks/useAuth';
import styles from '../../styles/Home.module.css';
import useUserInfo from '../hooks/useUserInfo';

const Home: NextPage = () => {  
  const token = useAuth();
  const userInfo = useUserInfo(token.token?.accessToken);

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <a href="https://nextjs.org">Next.js!</a>
        </h1>

        <div className={styles.grid}>
          {
            !token.code && !token.token ? (<SignInButton />) : (<></>)
          }
          {
            userInfo ? (
              <>
                <table>
                  <tbody>
                    <tr>
                      <td>{userInfo.email}</td>
                    </tr>
                    <tr>
                      <td>{userInfo.username}</td>
                    </tr>
                    <tr>
                      <td>{userInfo.preferredUsername}</td>
                    </tr>
                  </tbody>
                </table>
              </>
            ) : (<></>)
          }
        </div>
      </main>

      <footer className={styles.footer}>
      </footer>
    </div>
  );
};

export default Home;
