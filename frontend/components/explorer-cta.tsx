"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Search, Hash, Clock } from "lucide-react"
import { brand } from "@/lib/brand"

export default function ExplorerCta() {
  const container = { 
    hidden: { opacity: 0 }, 
    show: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      } 
    } 
  }
  
  const item = { 
    hidden: { opacity: 0, y: 20 }, 
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    } 
  }

  return (
    <section className="border-t bg-gradient-to-b from-white via-rose-50 to-orange-50">
      <div className="container px-4 py-16 md:py-24">
        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="mx-auto max-w-4xl"
        >
          <motion.div variants={item} className="text-center mb-12">
            <Badge variant="secondary" className="border-orange-200 bg-orange-50 text-rose-700 mb-4">
              <Search className="h-3 w-3 mr-1" />
              Explore Now
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Explore{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(90deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
                }}
              >
                .ava
              </span>{" "}
              blockchain data
            </h2>
            <p className="mx-auto max-w-[65ch] text-lg text-neutral-600">
              Dive deep into Avalanche's blockchain with real-time data, transaction history, 
              and comprehensive analytics built for .ava developers.
            </p>
          </motion.div>

          <motion.div 
            variants={item}
            className="grid gap-8 md:grid-cols-2 items-center"
          >
            {/* Left side - Features */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div 
                  className="p-2 rounded-lg flex-shrink-0"
                  style={{
                    backgroundColor: `${brand.colors.primaryFrom}15`,
                  }}
                >
                  <Hash className="h-5 w-5" style={{ color: brand.colors.primaryFrom }} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Block Explorer</h3>
                  <p className="text-neutral-600">
                    Browse blocks, transactions, and smart contracts with detailed information 
                    about gas usage, timestamps, and verification status.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div 
                  className="p-2 rounded-lg flex-shrink-0"
                  style={{
                    backgroundColor: `${brand.colors.primaryFrom}15`,
                  }}
                >
                  <Clock className="h-5 w-5" style={{ color: brand.colors.primaryFrom }} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Real-time Data</h3>
                  <p className="text-neutral-600">
                    Monitor live network activity with up-to-date block confirmations, 
                    transaction throughput, and network health metrics.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div 
                  className="p-2 rounded-lg flex-shrink-0"
                  style={{
                    backgroundColor: `${brand.colors.primaryFrom}15`,
                  }}
                >
                  <Search className="h-5 w-5" style={{ color: brand.colors.primaryFrom }} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Advanced Search</h3>
                  <p className="text-neutral-600">
                    Search by transaction hash, block number, address, or smart contract 
                    with powerful filtering and sorting capabilities.
                  </p>
                </div>
              </div>
            </div>

            {/* Right side - CTA Card */}
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <div className="relative overflow-hidden rounded-2xl border bg-white p-8 shadow-lg">
                <div
                  className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-10 blur-2xl"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
                  }}
                  aria-hidden="true"
                />
                
                <div className="relative text-center">
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 text-sm text-neutral-600 mb-2">
                      <Search className="h-4 w-4" />
                      Real-time Avalanche Explorer
                    </div>
                    <h3 className="text-xl font-bold mb-2">Explore the Network</h3>
                    <p className="text-neutral-600 text-sm">
                      Access comprehensive blockchain data with developer-friendly tools
                    </p>
                  </div>

                  <Link href="/explorer">
                    <Button
                      size="lg"
                      className="text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 w-full"
                      style={{
                        backgroundImage: `linear-gradient(90deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
                      }}
                    >
                      Launch Explorer
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
