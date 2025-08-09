"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, Shield, Gauge, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import { brand } from "@/lib/brand"

export default function FeatureCards() {
  const features = [
    {
      title: "Compilation PoW",
      desc: "Compiler generates proof during build for authenticity.",
      icon: Zap,
    },
    {
      title: "Spam Prevention",
      desc: "Computational cost prevents fake deployments.",
      icon: Shield,
    },
    {
      title: "Avalanche Speed",
      desc: "Optimized for Avalanche's sub-second finality.",
      icon: Gauge,
    },
    {
      title: "Network Native",
      desc: "Built exclusively for Avalanche ecosystem.",
      icon: CheckCircle,
    },
  ]

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
    hidden: { opacity: 0, y: 20, scale: 0.95 }, 
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    } 
  }

  return (
    <section id="features" className="border-t bg-gradient-to-b from-rose-50 via-white to-orange-50">
      <div className="container px-4 py-16 md:py-24">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs text-neutral-700 shadow-sm">
            Built for verification
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Built exclusively for Avalanche
          </h2>
          <p className="mx-auto mt-2 max-w-[70ch] text-neutral-600">
            Compilation-time PoW optimized for Avalanche's high-speed, low-cost network architecture.
          </p>
        </div>
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((f) => (
            <motion.div 
              key={f.title} 
              variants={item}
              whileHover={{ 
                y: -8, 
                scale: 1.02,
                transition: { duration: 0.2, ease: "easeOut" }
              }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="relative overflow-hidden border-orange-100 bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer h-full">
                <div
                  className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20 blur-2xl"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
                  }}
                  aria-hidden="true"
                />
                <div className="relative">
                  <div
                    className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md text-white"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
                    }}
                  >
                    <f.icon className="h-4 w-4" />
                  </div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{f.title}</h3>
                    <Badge variant="secondary" className="border-orange-200 bg-orange-50 text-rose-700">
                      Included
                    </Badge>
                  </div>
                  <p className="text-sm text-neutral-600">{f.desc}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
