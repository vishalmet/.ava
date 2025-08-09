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
              Everything you need to know about ava programming, Proof of Execution, and Avalanche deployment.
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
                    How does compilation-time Proof of Execution work?
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-neutral-600 leading-relaxed">
                    During compilation, the ava compiler performs a computational challenge (hash puzzle or verifiable computation) that produces a proof artifact. This proof is recorded with your program's hash, ensuring authenticity and preventing spam deployments.
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
              
              <motion.div variants={item}>
                <AccordionItem value="item-2" className="border-b border-neutral-200">
                  <AccordionTrigger className="hover:no-underline py-6 text-left font-semibold">
                    Why is ava exclusive to Avalanche?
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-neutral-600 leading-relaxed">
                    ava is designed specifically for Avalanche's unique architecture, leveraging its sub-second finality, low fees, and high throughput. This exclusive focus allows for optimal performance and native integration with Avalanche's ecosystem.
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
              
              <motion.div variants={item}>
                <AccordionItem value="item-3" className="border-b border-neutral-200">
                  <AccordionTrigger className="hover:no-underline py-6 text-left font-semibold">
                    How does verification prevent fake deployments?
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-neutral-600 leading-relaxed">
                    When code runs or is inspected later, nodes can verify that the code wasn't altered after compilation, was built using the official ava toolchain, and required computational work was done. This prevents spam and ensures authenticity.
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
              
              <motion.div variants={item}>
                <AccordionItem value="item-4" className="border-b border-neutral-200">
                  <AccordionTrigger className="hover:no-underline py-6 text-left font-semibold">
                    How does ava leverage Avalanche's performance?
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-neutral-600 leading-relaxed">
                    ava programs are optimized for Avalanche's consensus mechanism and network architecture. This means faster execution, lower gas costs, and seamless integration with Avalanche's subnets and native features.
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
