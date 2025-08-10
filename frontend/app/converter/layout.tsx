"use client"

import { WalletProvider } from "@/contexts/wallet-context"

export default function ConverterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WalletProvider>
      {children}
    </WalletProvider>
  )
}
