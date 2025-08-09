import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SparkDapp - No-Code dApp Builder for Avalanche',
  description: 'Build and launch decentralized applications on Avalanche from a simple prompt. No coding required - generate UI, smart contracts, and deploy to mainnet in minutes.',
  keywords: ['dApp', 'Avalanche', 'No-code', 'Smart contracts', 'Blockchain', 'Web3', 'DeFi'],
  authors: [{ name: 'SparkDapp Team' }],
  creator: 'SparkDapp',
  publisher: 'SparkDapp',
  openGraph: {
    title: 'SparkDapp - No-Code dApp Builder for Avalanche',
    description: 'Build and launch decentralized applications on Avalanche from a simple prompt. No coding required.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SparkDapp - No-Code dApp Builder for Avalanche',
    description: 'Build and launch decentralized applications on Avalanche from a simple prompt. No coding required.',
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
      <body>{children}</body>
    </html>
  )
}
