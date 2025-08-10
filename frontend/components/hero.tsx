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
