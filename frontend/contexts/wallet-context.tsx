'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface WalletContextType {
  isConnected: boolean
  address: string
  network: string
  balance: string
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

interface WalletProviderProps {
  children: ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState('')
  const [network, setNetwork] = useState('')
  const [balance, setBalance] = useState('')

  // These will be set by the WalletConnect component
  const setWalletState = (state: Partial<WalletContextType>) => {
    if (state.isConnected !== undefined) setIsConnected(state.isConnected)
    if (state.address !== undefined) setAddress(state.address)
    if (state.network !== undefined) setNetwork(state.network)
    if (state.balance !== undefined) setBalance(state.balance)
  }

  const connectWallet = async () => {
    // This will be handled by the WalletConnect component
    console.log('Wallet connection should be handled by WalletConnect component')
  }

  const disconnectWallet = () => {
    setIsConnected(false)
    setAddress('')
    setNetwork('')
    setBalance('')
  }

  // Expose setWalletState to WalletConnect component
  useEffect(() => {
    ;(window as any).setWalletState = setWalletState
  }, [])

  const value: WalletContextType = {
    isConnected,
    address,
    network,
    balance,
    connectWallet,
    disconnectWallet
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}
