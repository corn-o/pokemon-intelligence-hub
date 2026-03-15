import Layout from '../components/Layout'
import '../styles/globals.css'

/**
 * Custom App component used by Next.js to initialize pages. It wraps each
 * page in a Layout component that provides a consistent navigation bar
 * and imports global CSS styles.
 */
function MyApp({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  )
}

export default MyApp