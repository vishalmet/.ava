'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Wallet, LogOut, Copy, Check, AlertCircle } from 'lucide-react'

// Type definitions for ethereum provider
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on: (eventName: string, handler: (...args: any[]) => void) => void
      removeListener: (eventName: string, handler: (...args: any[]) => void) => void
      isMetaMask?: boolean
      isAvalanche?: boolean
      isCore?: boolean
    }
  }
}

interface WalletConnectProps {
  className?: string
}

export default function WalletConnect({ className }: WalletConnectProps) {
  const [address, setAddress] = useState<string>('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [network, setNetwork] = useState<string>('')
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string>('')
  const [balance, setBalance] = useState<string>('')

  // Update global wallet state when local state changes
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).setWalletState) {
      ;(window as any).setWalletState({
        isConnected,
        address,
        network,
        balance
      })
    }
  }, [isConnected, address, network, balance])

  // Safe function to get ethereum provider with error handling
  const getEthereumProvider = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        // Check if ethereum is already defined and accessible
        if (window.ethereum) {
          return window.ethereum
        }
        
        // If not defined, try to access it safely
        const descriptor = Object.getOwnPropertyDescriptor(window, 'ethereum')
        if (descriptor && descriptor.value) {
          return descriptor.value
        }
        
        // Try alternative access methods
        try {
          const ethereum = (window as any).ethereum
          if (ethereum && typeof ethereum.request === 'function') {
            return ethereum
          }
        } catch (err) {
          // Ignore this error
        }
      }
    } catch (err) {
      console.warn('Error accessing ethereum provider:', err)
    }
    return null
  }, [])

  // Function to fetch user's AVAX balance
  const fetchBalance = useCallback(async (userAddress: string) => {
    const provider = getEthereumProvider()
    if (!provider || !userAddress) return
    
    try {
      const balanceWei = await provider.request({
        method: 'eth_getBalance',
        params: [userAddress, 'latest']
      })
      
      // Convert from Wei to AVAX (18 decimals)
      const balanceAvax = (parseInt(balanceWei, 16) / Math.pow(10, 18)).toFixed(4)
      setBalance(balanceAvax)
    } catch (error) {
      console.error('Error fetching balance:', error)
      setBalance('0.0000')
    }
  }, [getEthereumProvider])

  // Check for multiple wallet extensions
  const detectWalletExtensions = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        const extensions = []
        
        // Check for common wallet extensions
        if (window.ethereum?.isMetaMask) extensions.push('MetaMask')
        if (window.ethereum?.isAvalanche) extensions.push('Avalanche Core')
        if (window.ethereum?.isCore) extensions.push('Core')
        
        // Check for other potential conflicts
        const keys = Object.keys(window).filter(key => 
          key.toLowerCase().includes('ethereum') || 
          key.toLowerCase().includes('wallet')
        )
        
        if (keys.length > 1) {
          console.warn('Multiple wallet extensions detected:', keys)
        }
        
        return extensions
      }
    } catch (err) {
      console.warn('Error detecting wallet extensions:', err)
    }
    return []
  }, [])

  // Handle ethereum property conflicts
  const handleEthereumConflicts = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        // Check if there are multiple ethereum properties
        const ethereumKeys = Object.keys(window).filter(key => 
          key.toLowerCase().includes('ethereum')
        )
        
        if (ethereumKeys.length > 1) {
          console.warn('Multiple ethereum properties detected. Attempting to resolve conflicts.')
          
          // Try to find the most reliable ethereum provider
          for (const key of ethereumKeys) {
            try {
              const provider = (window as any)[key]
              if (provider && typeof provider.request === 'function') {
                console.log(`Using ethereum provider from: ${key}`)
                return provider
              }
            } catch (err) {
              // Continue to next key
            }
          }
        }
      }
    } catch (err) {
      console.warn('Error handling ethereum conflicts:', err)
    }
    return null
  }, [])

  const checkNetwork = useCallback(async () => {
    const provider = getEthereumProvider()
    if (provider) {
      try {
        const chainId = await provider.request({ method: 'eth_chainId' })
        if (chainId === '0xa869') { // Fuji testnet
          setNetwork('Fuji Testnet')
          setError('')
        } else {
          setNetwork('Wrong Network')
          setError('Please switch to Avalanche Fuji Testnet')
        }
      } catch (error) {
        console.error('Error checking network:', error)
      }
    }
  }, [getEthereumProvider])

  // Safe event handler functions
  const handleAccountsChanged = useCallback(async (accounts: string[]) => {
    try {
      if (accounts.length === 0) {
        // User disconnected
        setIsConnected(false)
        setAddress('')
        setNetwork('')
        setBalance('')
      } else {
        // User connected or switched accounts
        setAddress(accounts[0])
        setIsConnected(true)
        await checkNetwork()
        await fetchBalance(accounts[0])
      }
    } catch (err) {
      console.error('Error handling account change:', err)
    }
  }, [checkNetwork, fetchBalance])

  const handleChainChanged = useCallback(async () => {
    try {
      await checkNetwork()
      // Refresh balance when chain changes
      if (address) {
        await fetchBalance(address)
      }
    } catch (err) {
      console.error('Error handling chain change:', err)
    }
  }, [checkNetwork, address, fetchBalance])

  const handleDisconnect = useCallback(() => {
    try {
      setIsConnected(false)
        setAddress('')
        setNetwork('')
        setBalance('')
    } catch (err) {
      console.error('Error handling disconnect:', err)
    }
  }, [])

  const checkConnection = useCallback(async () => {
    const provider = getEthereumProvider()
    if (provider) {
      try {
        const accounts = await provider.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          await handleAccountsChanged(accounts)
          await checkNetwork()
        }
      } catch (error) {
        console.error('Error checking connection:', error)
      }
    }
  }, [getEthereumProvider, handleAccountsChanged, checkNetwork])

  useEffect(() => {
    let mounted = true

    const initializeWallet = async () => {
      if (!mounted) return
      
      try {
        // Detect wallet extensions first
        const extensions = detectWalletExtensions()
        if (extensions.length > 1) {
          console.warn('Multiple wallet extensions detected. This may cause conflicts.')
        }
        
        // Check if wallet is already connected on mount
        await checkConnection()
        
        // Listen for account changes
        const provider = getEthereumProvider()
        if (provider && mounted) {
          try {
            provider.on('accountsChanged', handleAccountsChanged)
            provider.on('chainChanged', handleChainChanged)
            provider.on('disconnect', handleDisconnect)
          } catch (error) {
            console.warn('Could not attach wallet listeners:', error)
          }
        }
      } catch (err) {
        console.error('Error initializing wallet:', err)
      }
    }

    // Delay initialization to avoid conflicts
    const timer = setTimeout(initializeWallet, 200)

    return () => {
      mounted = false
      clearTimeout(timer)
      
      const provider = getEthereumProvider()
      if (provider) {
        try {
          provider.removeListener('accountsChanged', handleAccountsChanged)
          provider.removeListener('chainChanged', handleChainChanged)
          provider.removeListener('disconnect', handleDisconnect)
        } catch (error) {
          console.warn('Could not remove wallet listeners:', error)
        }
      }
    }
  }, [checkConnection, getEthereumProvider, handleAccountsChanged, handleChainChanged, handleDisconnect, detectWalletExtensions])

  const connectWallet = async () => {
    const provider = getEthereumProvider()
    if (!provider) {
      setError('Avalanche Core Wallet not detected. Please install it first.')
      return
    }

    setIsConnecting(true)
    setError('')
    
    try {
      // Request wallet connection
      const accounts = await provider.request({ 
        method: 'eth_requestAccounts' 
      })
      
      if (accounts.length > 0) {
        setAddress(accounts[0])
        setIsConnected(true)
        await checkNetwork()
        await fetchBalance(accounts[0])
        
        // Try to switch to Fuji testnet if not already on it
        await switchToFuji()
      }
    } catch (error: any) {
      if (error.code === 4001) {
        setError('User rejected connection')
      } else {
        setError('Failed to connect wallet')
        console.error('Connection error:', error)
      }
    } finally {
      setIsConnecting(false)
    }
  }

  const switchToFuji = async () => {
    const provider = getEthereumProvider()
    if (!provider) return
    
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xa869' }], // Fuji testnet
      })
      setNetwork('Fuji Testnet')
      setError('')
      // Refresh balance after switching networks
      if (address) {
        await fetchBalance(address)
      }
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0xa869', // 43113 in hex
                chainName: 'Avalanche Fuji C-Chain',
                nativeCurrency: { 
                  name: 'Avalanche', 
                  symbol: 'AVAX', 
                  decimals: 18 
                },
                rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
                blockExplorerUrls: ['https://testnet.snowtrace.io/']
              },
            ],
          })
          setNetwork('Fuji Testnet')
          setError('')
          // Refresh balance after adding network
          if (address) {
            await fetchBalance(address)
          }
        } catch (addError) {
          setError('Failed to add Fuji testnet')
          console.error('Error adding network:', addError)
        }
      } else {
        setError('Failed to switch to Fuji testnet')
        console.error('Error switching network:', switchError)
      }
    }
  }

  const disconnectWallet = async () => {
    // Note: ethereum providers don't have a built-in disconnect method
    // We just clear our local state
    setIsConnected(false)
    setAddress('')
    setNetwork('')
    setBalance('')
    setError('')
  }

  const copyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('Failed to copy address:', error)
      }
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (isConnected && address) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {/* Network Badge */}
        <div className={`px-2 py-1 text-xs font-medium rounded-full border ${
          network === 'Fuji Testnet' 
            ? 'bg-green-100 text-green-800 border-green-200' 
            : 'bg-red-100 text-red-800 border-red-200'
        }`}>
          {network}
        </div>
        
        {/* Balance Display */}
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {balance} AVAX
          </span>
        </div>
        
        {/* Address Display */}
        <div className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <Wallet className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
          <span className="text-sm font-mono text-neutral-700 dark:text-neutral-300">
            {formatAddress(address)}
          </span>
          
          {/* Copy Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={copyAddress}
            className="h-6 w-6 p-0 hover:bg-neutral-200 dark:hover:bg-neutral-700"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3 text-neutral-500" />
            )}
          </Button>
        </div>
        
        {/* Disconnect Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={disconnectWallet}
          className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <Button
        onClick={connectWallet}
        disabled={isConnecting}
        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0"
      >
        {isConnecting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4 mr-2" />
            Connect Wallet
          </>
        )}
      </Button>
      
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}
    </div>
  )
}
