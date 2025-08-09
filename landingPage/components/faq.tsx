import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function Faq() {
  return (
    <section id="faq" className="border-t bg-gradient-to-b from-orange-50 via-white to-rose-50">
      <div className="container px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs text-neutral-700 shadow-sm">
              FAQ
            </div>
            <h3 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Questions, answered</h3>
            <p className="mx-auto mt-2 max-w-[65ch] text-neutral-600">
              Everything you need to know about prompts, components, contracts, and deploying to Avalanche.
            </p>
          </div>

          <Accordion type="single" collapsible className="mt-8">
            <AccordionItem value="item-1">
              <AccordionTrigger>Do I need to write code?</AccordionTrigger>
              <AccordionContent>
                No — you can ship end‑to‑end without touching code. If you want, you can export the project anytime.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Can I change layouts later?</AccordionTrigger>
              <AccordionContent>
                Yes. Swap components freely while we keep your bindings and actions intact.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Which networks are supported?</AccordionTrigger>
              <AccordionContent>Avalanche Mainnet and Fuji testnet are supported out of the box.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>Can I bring my own contract?</AccordionTrigger>
              <AccordionContent>
                You can use the generated one or import your own and deploy through our flow.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  )
}
