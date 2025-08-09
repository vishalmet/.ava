import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Rocket } from "lucide-react"
import { brand } from "@/lib/brand"

export default function AvalancheCta() {
  return (
    <section id="avalanche" className="border-t">
      <div className="container px-4 py-16 md:py-24">
        <div className="grid items-center gap-6 lg:grid-cols-[1fr_520px]">
          <div className="order-2 space-y-4 lg:order-1">
            <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs text-neutral-700 shadow-sm">
              Avalanche Ready
            </div>
            <h3 className="text-3xl font-bold tracking-tight sm:text-4xl">One‑click deploy to Mainnet or Fuji</h3>
            <p className="text-neutral-600">
              We handle RPCs, verification, and addresses so you can focus on your product.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                className="text-white"
                style={{
                  backgroundImage: `linear-gradient(90deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
                }}
              >
                <Rocket className="mr-2 h-4 w-4" />
                Deploy now
              </Button>
              <a
                href="#"
                className="text-sm font-medium underline underline-offset-4 text-neutral-700 hover:text-neutral-900"
              >
                Read the deploy guide
              </a>
            </div>
            <ul className="mt-2 list-disc pl-5 text-sm text-neutral-600">
              <li>Network selection (Mainnet / Fuji)</li>
              <li>Bytecode verification</li>
              <li>Contract addresses and ABI export</li>
            </ul>
          </div>
          <div className="order-1 lg:order-2">
            <div className="relative overflow-hidden rounded-xl border bg-white shadow-sm">
              <div
                className="absolute left-0 top-0 h-1 w-full"
                style={{
                  backgroundImage: `linear-gradient(90deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
                }}
              />
              <Image
                src="/placeholder.svg?height=360&width=520"
                alt="Avalanche deployment diagram"
                width={520}
                height={360}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
