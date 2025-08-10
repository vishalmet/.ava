"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Sparkles, Monitor } from "lucide-react"
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
            Exclusive Language 
          </motion.div>

          <motion.h1 variants={item} className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(90deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
              }}
            >
              Build exclusively for Avalanche
            </span>{" "}
            with verifiable Proof of Execution.
          </motion.h1>

          <motion.p variants={item} className="mx-auto mt-4 max-w-[65ch] text-lg text-neutral-600 md:text-xl">
            Write programs in {brand.name} designed exclusively for Avalanche. Compilation generates Proof of Execution for authenticity, leveraging Avalanche's speed and low fees for optimal performance.
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
              Avalanche-native
            </Badge>
            <Badge variant="secondary" className="border-rose-200 bg-rose-50 text-rose-700">
              High-performance
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
                <DemoCard title="ava Program" />
                <DemoCard title="PoW Generated" tint="orange" />
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
      <p className="text-xs text-neutral-500">Optimized for Avalanche's high-speed, low-cost network.</p>
    </div>
  )
}
