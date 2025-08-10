"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Sparkles, Monitor, Code, Zap, Shield, Rocket, Cpu, Database, Network, Layers, TrendingUp } from "lucide-react"
import Orbs from "./orbs"
import { brand } from "@/lib/brand"

export default function Hero() {
  const handleDownload = async (platform: string, version: string) => {
    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platform, version }),
      })

      if (!response.ok) {
        throw new Error('Download failed')
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ava-${platform.toLowerCase()}-installer.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
      // Fallback to direct download
      window.open('/icon.png', '_blank')
    }
  }
  
  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
  const item = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 70 } },
  }

  // Floating icon animations
  const floatingIcons = [
    { icon: Code, delay: 0, x: -20, y: 10, size: 16, color: "text-blue-500" },
    { icon: Zap, delay: 0.5, x: 15, y: -15, size: 18, color: "text-yellow-500" },
    { icon: Shield, delay: 1, x: -25, y: 20, size: 14, color: "text-green-500" },
    { icon: Rocket, delay: 1.5, x: 20, y: 25, size: 16, color: "text-purple-500" },
    { icon: Cpu, delay: 2, x: -30, y: -10, size: 15, color: "text-indigo-500" },
    { icon: Database, delay: 2.5, x: 25, y: 15, size: 17, color: "text-cyan-500" },
    { icon: Network, delay: 3, x: -15, y: 30, size: 16, color: "text-orange-500" },
    { icon: Layers, delay: 3.5, x: 30, y: -20, size: 14, color: "text-pink-500" },
    { icon: TrendingUp, delay: 4, x: -35, y: 5, size: 15, color: "text-emerald-500" },
  ]

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Orbs
          className="absolute left-0 -top-16 -translate-x-1/2"
          color={"rgb(232 65 66 / 0.25)"}
          size={280}
          blur={90}
          duration={14}
        />
        <Orbs
          className="absolute right-0 top-24 translate-x-1/2"
          color={"rgb(245 158 11 / 0.25)"}
          size={260}
          blur={90}
          duration={16}
          delay={0.6}
        />
        <Orbs
          className="absolute left-1/3 -bottom-14"
          color={"rgb(253 186 116 / 0.25)"}
          size={300}
          blur={100}
          duration={18}
          delay={0.3}
        />
      </div>

      <div className="container px-4 py-14 md:py-20">
        <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-3xl text-center">
          <motion.div
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs text-neutral-700 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-rose-500" />
            Exclusive Programming Language for<strong>Avalanche</strong>
          </motion.div>

          <motion.h1 variants={item} className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(90deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
              }}
            >
              Write simple code
            </span>{" "}
            that runs everywhere with proof.
          </motion.h1>

          <motion.p variants={item} className="mx-auto mt-4 max-w-[65ch] text-lg text-neutral-600 md:text-xl">
            {brand.name} is a simple programming language that makes coding easier. Write once, and your code automatically converts to other languages like Solidity, Rust, and Cairo. Every program comes with built-in proof of execution for trust and verification.
          </motion.p>

          <motion.div variants={item} className="mt-7 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              className="text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-4 text-lg"
              style={{
                backgroundImage: `linear-gradient(90deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
              }}
              onClick={() => handleDownload('Windows', 'x64-user')}
            >
              <Monitor className="mr-1 h-5 w-5" /> Download for Windows
            </Button>
            <Link href="/downloads">
              <Button
                size="lg"
                variant="outline"
                className="font-medium shadow-sm hover:shadow-md transition-all duration-300 px-6 py-4 text-lg border-2 hover:border-rose-300"
              >
                <Download className="mr-1 h-5 w-5" /> All downloads
              </Button>
            </Link>
          </motion.div>

          <motion.div variants={item} className="mt-6 flex items-center justify-center gap-2">
            <Badge variant="secondary" className="border-orange-200 bg-orange-50 text-rose-700">
              Easy to learn
            </Badge>
            <Badge variant="secondary" className="border-rose-200 bg-rose-50 text-rose-700">
              Multi-language output
            </Badge>
          </motion.div>

          <motion.div
            variants={item}
            className="relative mx-auto mt-10 w-full max-w-4xl overflow-hidden rounded-2xl border bg-white shadow-lg"
            whileHover={{ y: -2 }}
            transition={{ type: "spring" as const, stiffness: 120, damping: 12 }}
          >
            <div
              className="h-2 w-full"
              style={{
                backgroundImage: `linear-gradient(90deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
              }}
            />
            <div className="p-4 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <DemoCard title="Simple .ava Code" />
                <DemoCard title="Multiple Languages" tint="orange" />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Problem Statement & Solution Section */}
        <motion.div 
          variants={container}
          className="mt-16 max-w-6xl mx-auto"
        >
          <motion.div 
            variants={item}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              The Smart Contract Challenge
            </h2>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
              Developers face significant barriers when building across multiple blockchains
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Problem Statement */}
            <motion.div 
              variants={item}
              className="bg-red-50 border border-red-200 rounded-2xl p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-red-900">The Problem</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-red-800">
                    <strong>Language Fragmentation:</strong> Each blockchain requires learning different smart contract languages (Solidity, Cairo, Rust)
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-red-800">
                    <strong>Proof of Work Tracking:</strong> No unified way to track and verify execution across different networks
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-red-800">
                    <strong>Development Complexity:</strong> Rewriting code for each platform increases time and introduces errors
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Solution */}
            <motion.div 
              variants={item}
              className="bg-green-50 border border-green-200 rounded-2xl p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-green-900">The Solution</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-green-800">
                    <strong>Unified Language:</strong> Write once in .ava and convert to Solidity, Cairo, or Rust based on your target blockchain
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-green-800">
                    <strong>Built-in Proof of Work:</strong> Every operation generates verifiable proof of execution for complete transparency
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-green-800">
                    <strong>Cross-Chain Deployment:</strong> Deploy the same logic to multiple blockchains without rewriting or learning new languages
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-green-800">
                    <strong>Python Inside AVA:</strong> Execute AI models, data analysis, and custom logic directly within your smart contracts for advanced functionality
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-green-800">
                    <strong>Built-in Blockchain Tools:</strong> Integrated features for NFT minting, efficient on-chain storage, and comprehensive transaction scanning
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Video Section */}
        <motion.div 
          variants={container}
          className="mt-20 max-w-4xl mx-auto text-center"
        >
          <motion.div 
            variants={item}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              See AVA Language in Action
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Watch how simple .ava code transforms into multiple programming languages with built-in verification
            </p>
          </motion.div>

          <motion.div 
            variants={item}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 bg-neutral-50">
              <iframe 
                width="100%" 
                height="400" 
                src="https://www.youtube.com/embed/ohC7_BFcmbs?si=_dff6N4REtY57kI_" 
                title="AVA Language Demo" 
                frameBorder="0" 
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                referrerPolicy="strict-origin-when-cross-origin" 
                allowFullScreen
                className="w-full h-[400px] md:h-[500px] lg:h-[600px]"
              ></iframe>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-br from-rose-400 to-orange-400 rounded-full opacity-20"></div>
            <div className="absolute -bottom-4 -right-4 w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full opacity-20"></div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

function DemoCard({ title, tint = "rose" }: { title: string; tint?: "rose" | "orange" }) {
  const bar = tint === "rose" ? "from-rose-500/20 to-rose-500/5" : "from-orange-500/20 to-orange-500/5"
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className={`mb-3 h-10 w-full rounded-md bg-gradient-to-r ${bar}`} />
      <div className="h-24 rounded-lg bg-neutral-50 ring-1 ring-orange-100" />
      <div className="mt-3 text-sm font-medium text-neutral-800">{title}</div>
      <p className="text-xs text-neutral-500">Write simple code that automatically converts to multiple programming languages.</p>
    </div>
  )
}
