"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, ArrowLeft, ExternalLink, Clock, Hash, FileText, Loader2 } from "lucide-react"
import { brand } from "@/lib/brand"

interface ApiResponse {
  items: Array<{
    createdAt: string
    id: string
    json_value_of_response: string
    source: string
  }>
}

interface BlockData {
  id: string
  blockNumber: number
  contractAddress: string
  timestamp: string
  ago: string
  snowtraceUrl: string
  gasUsed: string
  network: string
  chainId: number
  contractUrl: string
  blockUrl: string
}

export default function ExplorerPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [blocks, setBlocks] = useState<BlockData[]>([])
  const [filteredBlocks, setFilteredBlocks] = useState<BlockData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [displayedBlocks, setDisplayedBlocks] = useState<BlockData[]>([])
  const [blocksPerPage] = useState(5)
  const [currentPage, setCurrentPage] = useState(1)

  // Function to calculate time ago
  const getTimeAgo = (timestamp: string): string => {
    const now = new Date()
    const past = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    return `${Math.floor(diffInSeconds / 86400)} days ago`
  }

  // Function to parse JSON response and extract block data
  const parseBlockData = (apiResponse: ApiResponse): BlockData[] => {
    const blockData: BlockData[] = []
    
    apiResponse.items.forEach((item) => {
      try {
        // Skip items with error responses
        if (item.json_value_of_response.startsWith('ERROR:')) {
          return
        }
        
        const jsonValue = JSON.parse(item.json_value_of_response)
        const blockchain = jsonValue.blockchain
        
        if (blockchain && blockchain.success) {
          const timestamp = blockchain.blockTimestamp 
            ? new Date(blockchain.blockTimestamp * 1000).toISOString() 
            : item.createdAt
            
          blockData.push({
            id: blockchain.txHash,
            blockNumber: blockchain.blockNumber,
            contractAddress: blockchain.contractAddress,
            timestamp: timestamp,
            ago: getTimeAgo(timestamp),
            snowtraceUrl: blockchain.snowtraceUrl,
            gasUsed: blockchain.gasUsed,
            network: blockchain.network,
            chainId: blockchain.chainId,
            contractUrl: blockchain.contractUrl || `https://testnet.snowtrace.io/address/${blockchain.contractAddress}`,
            blockUrl: blockchain.blockUrl || `https://testnet.snowtrace.io/block/${blockchain.blockNumber}`
          })
        }
      } catch (error) {
        console.error('Error parsing item:', item.id, error)
        // Continue processing other items even if one fails
      }
    })
    
    // Sort by block number (newest first)
    return blockData.sort((a, b) => b.blockNumber - a.blockNumber)
  }

  // Fetch data from API
  const fetchBlockData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('https://ava-api.vercel.app/responses')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: ApiResponse = await response.json()
      const blockData = parseBlockData(data)
      setBlocks(blockData)
      setFilteredBlocks(blockData)
      setCurrentPage(1)
      setDisplayedBlocks(blockData.slice(0, blocksPerPage))
    } catch (error) {
      console.error('Error fetching block data:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch block data')
    } finally {
      setLoading(false)
    }
  }

  // Load more blocks
  const loadMoreBlocks = () => {
    const nextPage = currentPage + 1
    const startIndex = 0
    const endIndex = nextPage * blocksPerPage
    setDisplayedBlocks(filteredBlocks.slice(startIndex, endIndex))
    setCurrentPage(nextPage)
  }

  // Search functionality
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredBlocks(blocks)
      setDisplayedBlocks(blocks.slice(0, blocksPerPage))
      setCurrentPage(1)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = blocks.filter(block => 
      block.contractAddress.toLowerCase().includes(query) ||
      block.id.toLowerCase().includes(query) ||
      block.blockNumber.toString().includes(query) ||
      block.network.toLowerCase().includes(query)
    )
    
    setFilteredBlocks(filtered)
    setDisplayedBlocks(filtered.slice(0, blocksPerPage))
    setCurrentPage(1)
  }

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    if (!e.target.value.trim()) {
      setFilteredBlocks(blocks)
      setDisplayedBlocks(blocks.slice(0, blocksPerPage))
      setCurrentPage(1)
    }
  }

  useEffect(() => {
    fetchBlockData()
  }, [])

  const handleViewBlock = (snowtraceUrl: string) => {
    // Navigate to block explorer
    window.open(snowtraceUrl, '_blank')
  }

  const handleContractClick = (contractUrl: string) => {
    window.open(contractUrl, '_blank')
  }

  const handleTransactionClick = (snowtraceUrl: string) => {
    window.open(snowtraceUrl, '_blank')
  }

  const hasMoreBlocks = displayedBlocks.length < filteredBlocks.length

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Navigation Header */}
      <motion.header 
        className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
                }}
              >
                .a
              </div>
              <span className="font-semibold text-lg group-hover:text-rose-600 transition-colors">.ava</span>
            </Link>
            <Link 
              href="/" 
              className="flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-rose-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </motion.header>

      <div className="container px-4 py-12">
        {/* Page Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge 
            className="mb-4 text-white border-0"
            style={{
              backgroundImage: `linear-gradient(90deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
            }}
          >
            .ava Explorer
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-neutral-900 to-neutral-700 bg-clip-text text-transparent">
            .ava Block Explorer
          </h1>
          <p className="mx-auto mt-4 max-w-[65ch] text-lg text-neutral-600">
            Search and explore blocks, transactions, and addresses on the Avalanche network.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div 
          className="max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="relative">
            <Input
              type="text"
              placeholder="Search by transaction hash, block number, or address"
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full h-14 pl-4 pr-20 text-base border-2 border-neutral-200 focus:border-rose-500 rounded-xl"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button
              onClick={handleSearch}
              className="absolute right-2 top-2 h-10 px-6 text-white font-medium"
              style={{
                backgroundImage: `linear-gradient(90deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
              }}
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </motion.div>

        {/* Latest Blocks Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-neutral-900">
              Latest Blocks {filteredBlocks.length > 0 && `(${filteredBlocks.length})`}
            </h2>
            <Button 
              variant="ghost" 
              className="text-rose-600 hover:text-rose-700 font-medium"
              onClick={fetchBlockData}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
              <span className="ml-2 text-neutral-600">Loading block data...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchBlockData} variant="outline">
                Try Again
              </Button>
            </div>
          )}

          {/* Blocks Grid */}
          {!loading && !error && displayedBlocks.length > 0 && (
            <div className="grid gap-6">
              {displayedBlocks.map((block, index) => (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className="p-6 hover:shadow-lg transition-all duration-300 border border-neutral-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{
                              backgroundImage: `linear-gradient(135deg, ${brand.colors.primaryFrom}20, ${brand.colors.primaryTo}20)`,
                            }}
                          >
                            <Hash className="h-5 w-5" style={{ color: brand.colors.primaryFrom }} />
                          </div>
                          <div>
                            <p className="text-sm text-neutral-500 uppercase tracking-wide font-medium">BLOCK</p>
                            <h3 className="text-xl font-bold text-neutral-900">#{block.blockNumber}</h3>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-neutral-400" />
                            <span className="text-sm text-neutral-600">{block.ago}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-neutral-400" />
                            <span className="text-sm text-neutral-600">Gas: {block.gasUsed}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-neutral-600">{block.network}</span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-xs text-neutral-500 mb-1">Contract Address:</p>
                          <button
                            onClick={() => handleContractClick(block.contractUrl)}
                            className="text-sm font-mono text-rose-600 bg-rose-50 px-2 py-1 rounded break-all hover:bg-rose-100 transition-colors cursor-pointer underline"
                          >
                            {block.contractAddress}
                          </button>
                        </div>

                        <div className="mb-4">
                          <p className="text-xs text-neutral-500 mb-1">Transaction Hash:</p>
                          <button
                            onClick={() => handleTransactionClick(block.snowtraceUrl)}
                            className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded break-all hover:bg-blue-100 transition-colors cursor-pointer underline"
                          >
                            {block.id}
                          </button>
                        </div>
                      </div>

                      <div className="ml-6">
                        <Button
                          onClick={() => handleViewBlock(block.snowtraceUrl)}
                          className="text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                          style={{
                            backgroundImage: `linear-gradient(90deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
                          }}
                        >
                          View
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* No Data State */}
          {!loading && !error && displayedBlocks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-neutral-600">
                {searchQuery.trim() ? 'No blocks found matching your search.' : 'No block data available.'}
              </p>
            </div>
          )}
        </motion.div>

        {/* Load More Button */}
        {!loading && !error && hasMoreBlocks && (
          <motion.div 
            className="flex justify-center mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Button
              variant="outline"
              size="lg"
              className="border-2 font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              style={{
                borderColor: brand.colors.primaryFrom,
                color: brand.colors.primaryFrom,
              }}
              onClick={loadMoreBlocks}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {loading ? 'Loading...' : `Load More (${filteredBlocks.length - displayedBlocks.length} remaining)`}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

