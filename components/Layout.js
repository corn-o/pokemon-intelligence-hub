import Link from 'next/link'
import { useRouter } from 'next/router'

const links = [
  { href: '/', label: 'Home' },
  { href: '/sets', label: 'Sets' },
  { href: '/home', label: 'Home Dashboard' },
  { href: '/booster-ev', label: 'Booster EV' },
]

export default function Layout({ children }) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-lg font-black tracking-wide text-cyan-300">
            PokéHub
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-sm sm:gap-3">
            {links.map((link) => {
              const active = router.pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3 py-1.5 transition ${
                    active
                      ? 'bg-cyan-400/20 text-cyan-200'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
