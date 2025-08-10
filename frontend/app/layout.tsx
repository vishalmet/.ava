import type { Metadata } from 'next'
import './globals.css'
import PageLoader from '@/components/page-loader'
import NavigationLoader from '@/components/navigation-loader'

export const metadata: Metadata = {
  title: '.ava - Simple Programming Language for Everyone',
  description: 'Write simple code that automatically converts to multiple languages with built-in verification.',
  keywords: ['Programming Language', 'Code Conversion', 'Smart Contracts', 'Blockchain', 'Web3', 'DeFi', 'Multi-language'],
  authors: [{ name: '.ava Team' }],
  creator: '.ava',
  publisher: '.ava',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    title: '.ava - Simple Programming Language for Everyone',
    description: 'Write simple code that automatically converts to multiple languages with built-in verification.',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/icon.png',
        width: 512,
        height: 512,
        alt: '.ava Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: '.ava - Simple Programming Language for Everyone',
    description: 'Write simple code that automatically converts to multiple languages with built-in verification.',
    images: ['/icon.png'],
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
