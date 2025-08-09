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
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.05 }}
              className="relative rounded-xl border bg-white p-5 shadow-sm"
            >
              <div
                className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg text-white"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
                }}
              >
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-neutral-600">{s.desc}</p>
              {i < steps.length - 1 && (
                <div className="hidden lg:block">
                  <ArrowRight className="absolute -right-3 top-8 h-6 w-6 text-neutral-300" aria-hidden="true" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
