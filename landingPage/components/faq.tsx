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
              Everything you need to know about prompts, components, contracts, and deploying to Avalanche.
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
                    Do I need to write code?
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-neutral-600 leading-relaxed">
                    No — you can ship end‑to‑end without touching code. If you want, you can export the project anytime.
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
              
              <motion.div variants={item}>
                <AccordionItem value="item-2" className="border-b border-neutral-200">
                  <AccordionTrigger className="hover:no-underline py-6 text-left font-semibold">
                    Can I change layouts later?
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-neutral-600 leading-relaxed">
                    Yes. Swap components freely while we keep your bindings and actions intact.
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
              
              <motion.div variants={item}>
                <AccordionItem value="item-3" className="border-b border-neutral-200">
                  <AccordionTrigger className="hover:no-underline py-6 text-left font-semibold">
                    Which networks are supported?
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-neutral-600 leading-relaxed">
                    Avalanche Mainnet and Fuji testnet are supported out of the box.
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
              
              <motion.div variants={item}>
                <AccordionItem value="item-4" className="border-b border-neutral-200">
                  <AccordionTrigger className="hover:no-underline py-6 text-left font-semibold">
                    Can I bring my own contract?
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-neutral-600 leading-relaxed">
                    You can use the generated one or import your own and deploy through our flow.
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
