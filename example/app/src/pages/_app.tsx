import '../styles/globals.css';
import NoSSR from 'react-no-ssr';
import type { AppProps } from 'next/app';

const App = ({ Component, pageProps }: AppProps) => {
  
  return <NoSSR><Component {...pageProps} /></NoSSR>;
};

export default App;
