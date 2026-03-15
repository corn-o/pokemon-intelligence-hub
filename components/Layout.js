import Link from 'next/link'

/**
 * Simple layout component that wraps each page. It renders a top
 * navigation bar with links to the main sections and the page content.
 */
export default function Layout({ children }) {
  return (
    <div>
      <nav>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link href="/">
            <span style={{ fontWeight: 'bold', marginRight: '1rem' }}>
              PokéHub
            </span>
          </Link>
          <Link href="/sets">Sets</Link>
          <Link href="/cards">Cards</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/booster-ev">Booster EV</Link>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  )
}