"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, FileCode2, Code, Zap } from "lucide-react"
import { brand } from "@/lib/brand"

export default function ConverterCta() {
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
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    } 
  }

  return (
    <section className="border-t bg-gradient-to-b from-white via-orange-50 to-rose-50">
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
              <FileCode2 className="h-3 w-3 mr-1" />
              Try it now
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              See{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(90deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
                }}
              >
                .ava
              </span>{" "}
              in action
            </h2>
            <p className="mx-auto max-w-[65ch] text-lg text-neutral-600">
              Write simple .ava code and watch it instantly convert to Solidity, Cairo, and Rust. 
              See how your code transforms while keeping all the logic and verification intact.
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
                  className="flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center text-white"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
                  }}
                >
                  <Code className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Interactive Conversion</h3>
                  <p className="text-neutral-600">
                    Write .ava code and instantly see how it translates to your target language 
                    with all the logic and verification properties preserved.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div
                  className="flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center text-white"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
                  }}
                >
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Real-time Preview</h3>
                  <p className="text-neutral-600">
                    See live examples of how your code maintains its structure and functionality 
                    across different programming languages.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div
                  className="flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center text-white"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
                  }}
                >
                  <FileCode2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Download & Deploy</h3>
                  <p className="text-neutral-600">
                    Export your converted code with proper file extensions, ready for 
                    deployment with full verification support.
                  </p>
                </div>
              </div>
            </div>

            {/* Right side - CTA */}
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
                      <Code className="h-4 w-4" />
                      .ava → .sol, .cairo, .rs
                    </div>
                    <h3 className="text-xl font-bold mb-2">Try the Converter</h3>
                    <p className="text-neutral-600 text-sm">
                      Experience seamless code conversion with maintained functionality
                    </p>
                  </div>

                  <Link href="/converter">
                    <Button
                      size="lg"
                      className="text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 w-full"
                      style={{
                        backgroundImage: `linear-gradient(90deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
                      }}
                    >
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Open Converter
                    </Button>
                  </Link>

                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Badge variant="secondary" className="text-xs">
                      No signup required
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Instant results
                    </Badge>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
