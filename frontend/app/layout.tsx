import type { Metadata } from "next"
import Link from "next/link"
import { Inter, Playfair_Display } from "next/font/google"
import Providers from "./providers"
import StockSearch from "@/components/StockSearch"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })
const playfair = Playfair_Display({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Ara-Hunter",
  description: "IHSG stock screener for ARA potential",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <Providers>
          <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-border">
            <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
              <Link href="/" className={`${playfair.className} text-xl font-bold text-accent`}>
                Ara-Hunter
              </Link>
              <div className="flex items-center gap-8">
                <Link
                  href="/"
                  className="text-sm text-text-muted hover:text-accent transition duration-200"
                >
                  Dashboard
                </Link>
                <Link
                  href="/history"
                  className="text-sm text-text-muted hover:text-accent transition duration-200"
                >
                  History
                </Link>
                <StockSearch />
              </div>
            </div>
          </nav>
          <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
