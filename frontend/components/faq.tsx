"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { motion } from "framer-motion"

export default function Faq() {
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
    <section id="faq" className="border-t bg-gradient-to-b from-orange-50 via-white to-rose-50">
      <div className="container px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs text-neutral-700 shadow-sm">
              FAQ
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mx-auto mt-2 max-w-[70ch] text-neutral-600">
              Everything you need to know about ava programming, code conversion, and deployment.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
          >
            <Accordion type="single" collapsible className="mt-8">
              <AccordionItem value="item-1">
                <AccordionTrigger>What is ava programming language?</AccordionTrigger>
                <AccordionContent>
                  ava is a simple programming language designed to make coding easier and more accessible. 
                  You write code once in ava, and it automatically converts to other languages like Solidity, 
                  Rust, and Cairo. Every program includes built-in proof of execution for trust and verification.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>How does code conversion work?</AccordionTrigger>
                <AccordionContent>
                  When you write code in ava, our compiler automatically translates it to your target language 
                  while preserving all the logic and functionality. This means you can write once and deploy 
                  to multiple blockchains without rewriting your code.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>What is proof of execution?</AccordionTrigger>
                <AccordionContent>
                  Proof of execution is a mathematical guarantee that your code runs exactly as intended. 
                  When you compile ava code, it generates a proof that anyone can verify, ensuring your 
                  program behaves correctly and can be trusted.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>Why should I use ava?</AccordionTrigger>
                <AccordionContent>
                  ava makes programming accessible to everyone. You get simple syntax that's easy to learn, 
                  automatic conversion to multiple languages, built-in verification, and the ability to deploy 
                  anywhere. It's perfect for beginners and experienced developers alike.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>Which languages does ava convert to?</AccordionTrigger>
                <AccordionContent>
                  ava currently converts to Solidity (for Ethereum and Avalanche), Rust (for Solana and other 
                  Rust-based chains), and Cairo (for StarkNet). We're constantly adding support for more 
                  programming languages and blockchains.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger>How does ava ensure code quality?</AccordionTrigger>
                <AccordionContent>
                  ava uses advanced compilation techniques to ensure your converted code maintains the same 
                  logic, security, and performance characteristics. The built-in proof of execution provides 
                  mathematical certainty that your code works as intended.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
