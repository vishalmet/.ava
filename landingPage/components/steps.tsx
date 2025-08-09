"use client"

import { ArrowRight, Edit3, Cpu, FileCode2, Rocket } from "lucide-react"
import { motion } from "framer-motion"
import { brand } from "@/lib/brand"

export default function Steps() {
  const steps = [
    { title: "Prompt", desc: "Tell us what to build.", icon: Edit3 },
    { title: "Generate", desc: "We create UI and flows.", icon: Cpu },
    { title: "Contract", desc: "We prep Solidity for you.", icon: FileCode2 },
    { title: "Deploy", desc: "Ship on Avalanche.", icon: Rocket },
  ]

  return (
    <section id="how-it-works" className="border-t">
      <div className="container px-4 py-16 md:py-24">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs text-neutral-700 shadow-sm">
            How it works
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Idea to mainnet in four steps</h2>
          <p className="mx-auto mt-2 max-w-[70ch] text-neutral-600">A simple, bright flow — no code required.</p>
        </div>
        <div className="mt-8 grid items-stretch gap-6 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
                             transition={{ 
                 delay: i * 0.1,
                 duration: 0.5,
                 type: "spring" as const,
                 stiffness: 100,
                 damping: 15
               }}
              whileHover={{ 
                y: -8, 
                scale: 1.02,
                transition: { duration: 0.2, ease: "easeOut" }
              }}
              className="relative flex flex-col rounded-xl border bg-white p-6 shadow-sm hover:shadow-lg transition-shadow duration-300 min-h-[160px]"
            >
              <div className="flex-1">
                <div
                  className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg text-white shadow-sm"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
                  }}
                >
                  <s.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">{s.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <motion.div 
                  className="hidden lg:block"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 + 0.3 }}
                >
                  <ArrowRight className="absolute -right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-neutral-300" aria-hidden="true" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
