"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { brand } from "@/lib/brand"

export default function Showcase() {
  return (
    <section className="border-t bg-gradient-to-b from-white to-orange-50">
      <div className="container px-4 py-16 md:py-24">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_520px]">
          <div className="order-2 space-y-4 lg:order-1">
            <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs text-neutral-700 shadow-sm">
              Component library
            </div>
            <h3 className="text-3xl font-bold tracking-tight sm:text-4xl">Pick a layout, keep your logic</h3>
            <p className="text-neutral-600">
              Choose from clean, bright components that match Avalanche’s energy. Swap visuals without touching the
              wiring.
            </p>
            <ul className="mt-2 list-disc pl-5 text-sm text-neutral-600">
              <li>Lists, grids, forms, dashboards</li>
              <li>Consistent colors and spacing</li>
              <li>No-code friendly controls</li>
            </ul>
          </div>
          <motion.div
            className="order-1"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
          >
            <div className="relative overflow-hidden rounded-xl border bg-white shadow-sm">
              <div
                className="absolute left-0 top-0 h-1 w-full"
                style={{
                  backgroundImage: `linear-gradient(90deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
                }}
              />
              <Image
                src="/placeholder.svg?height=360&width=520"
                alt="Component library preview"
                width={520}
                height={360}
                className="h-full w-full object-cover"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
