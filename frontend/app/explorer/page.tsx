"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, ArrowLeft, ExternalLink, Clock, Hash, FileText } from "lucide-react"
import { brand } from "@/lib/brand"

interface Block {
  id: number
  hash: string
  transactions: number
  timestamp: string
  size: string
}

export default function ExplorerPage() {
  const [searchQuery, setSearchQuery] = useState("")

  // Mock data for blocks
  const blocks: Block[] = [
    {
      id: 47664890,
      hash: "0xfee7c4e0fee7c4e0fee7c4e0fee7c4e0fee7c4e0fee7c4e0fee7c4e0fee7c4e0",
      transactions: 156,
      timestamp: "2 mins ago",
      size: "45.2 KB"
    },
    {
      id: 47664889,
      hash: "0xabc123e0abc123e0abc123e0abc123e0abc123e0abc123e0abc123e0abc123e0",
      transactions: 203,
      timestamp: "4 mins ago", 
      size: "52.8 KB"
    },
    {
      id: 47664888,
      hash: "0x456def90456def90456def90456def90456def90456def90456def90456def90",
      transactions: 89,
      timestamp: "6 mins ago",
      size: "38.1 KB"
    },
    {
      id: 47664887,
      hash: "0x789ghi40789ghi40789ghi40789ghi40789ghi40789ghi40789ghi40789ghi40",
      transactions: 174,
      timestamp: "8 mins ago",
      size: "47.3 KB"
    },
    {
      id: 47664886,
      hash: "0x012jkl80012jkl80012jkl80012jkl80012jkl80012jkl80012jkl80012jkl80",
      transactions: 132,
      timestamp: "10 mins ago",
      size: "41.7 KB"
    }
  ]

  const handleSearch = () => {
    // Mock search functionality
    console.log("Searching for:", searchQuery)
  }

  const handleViewBlock = (blockId: number) => {
    // Navigate to block details (mock)
    window.open(`https://snowscan.xyz/block/${blockId}`, '_blank')
  }

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
            Avalanche Explorer
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-neutral-900 to-neutral-700 bg-clip-text text-transparent">
            Avalanche Block Explorer
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
              onChange={(e) => setSearchQuery(e.target.value)}
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
            <h2 className="text-2xl font-bold text-neutral-900">Latest Blocks</h2>
            <Button 
              variant="ghost" 
              className="text-rose-600 hover:text-rose-700 font-medium"
            >
              View all
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Blocks Grid */}
          <div className="grid gap-6">
            {blocks.map((block, index) => (
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
                          <h3 className="text-xl font-bold text-neutral-900">#{block.id}</h3>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-neutral-400" />
                          <span className="text-sm text-neutral-600">
                            {block.transactions} transactions
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-neutral-400" />
                          <span className="text-sm text-neutral-600">{block.timestamp}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-neutral-600">Size: {block.size}</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs text-neutral-500 mb-1">Transaction Hash:</p>
                        <code className="text-sm font-mono text-neutral-700 bg-neutral-50 px-2 py-1 rounded break-all">
                          {block.hash}
                        </code>
                      </div>
                    </div>

                    <div className="ml-6">
                      <Button
                        onClick={() => handleViewBlock(block.id)}
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
        </motion.div>

        {/* Load More Button */}
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
          >
            Load More Blocks
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
