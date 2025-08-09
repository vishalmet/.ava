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
        type: "spring",
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
            <h3 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Questions, answered</h3>
            <p className="mx-auto mt-2 max-w-[65ch] text-neutral-600">
              Everything you need to know about ava programming, Proof of Work, and multi-target compilation.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
          >
            <Accordion type="single" collapsible className="mt-8">
              <motion.div variants={item}>
                <AccordionItem value="item-1" className="border-b border-neutral-200">
                  <AccordionTrigger className="hover:no-underline py-6 text-left font-semibold">
                    How does Proof of Work generation work?
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-neutral-600 leading-relaxed">
                    Every ava program automatically generates Proof of Work during execution. This ensures computational integrity and enables verifiable computing without additional setup.
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
              
              <motion.div variants={item}>
                <AccordionItem value="item-2" className="border-b border-neutral-200">
                  <AccordionTrigger className="hover:no-underline py-6 text-left font-semibold">
                    Which target languages are supported?
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-neutral-600 leading-relaxed">
                    ava can compile to Solidity (.sol), Cairo (.cairo), and Rust (.rs). Each compilation maintains the same verification properties and Proof of Work guarantees.
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
              
              <motion.div variants={item}>
                <AccordionItem value="item-3" className="border-b border-neutral-200">
                  <AccordionTrigger className="hover:no-underline py-6 text-left font-semibold">
                    How is onchain verification handled?
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-neutral-600 leading-relaxed">
                    All program actions are recorded onchain with cryptographic proofs. Anyone can verify the execution history and computational integrity at any time.
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
              
              <motion.div variants={item}>
                <AccordionItem value="item-4" className="border-b border-neutral-200">
                  <AccordionTrigger className="hover:no-underline py-6 text-left font-semibold">
                    Can I integrate ava with existing codebases?
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-neutral-600 leading-relaxed">
                    Yes. Compile ava programs to your target language and integrate the generated code into existing projects while maintaining verification capabilities.
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            </Accordion>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
