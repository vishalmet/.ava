import type { Metadata } from 'next'
import './globals.css'
import PageLoader from '@/components/page-loader'
import NavigationLoader from '@/components/navigation-loader'

export const metadata: Metadata = {
  title: '.ava - Exclusive Programming Language for Avalanche',
  description: 'Write once, verify everywhere — with built-in Proof of Execution.',
  keywords: ['dApp', 'Avalanche', 'No-code', 'Smart contracts', 'Blockchain', 'Web3', 'DeFi'],
  authors: [{ name: '.ava Team' }],
  creator: '.ava',
  publisher: '.ava',
  openGraph: {
    title: '.ava - Exclusive Programming Language for Avalanche',
    description: 'Write once, verify everywhere — with built-in Proof of Execution.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: '.ava - Exclusive Programming Language for Avalanche',
    description: 'Write once, verify everywhere — with built-in Proof of Execution.',
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <PageLoader />
        <NavigationLoader />
        {children}
      </body>
    </html>
  )
}
