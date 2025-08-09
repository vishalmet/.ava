"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"
import Hero from "@/components/hero"
import FeatureCards from "@/components/feature-cards"
import Steps from "@/components/steps"
import AvalancheCta from "@/components/avalanche-cta"
import Faq from "@/components/faq"
import { brand } from "@/lib/brand"

export default function Page() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="#" className="flex items-center gap-2">
            <div className="relative">
              <div
                className="h-8 w-8 rounded-md"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
                }}
              />
              <Sparkles className="absolute -right-2 -top-2 h-4 w-4 text-rose-500" aria-hidden="true" />
            </div>
            <span className="font-semibold">SparkDapp</span>
            <span className="sr-only">SparkDapp Home</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#how-it-works" className="text-sm font-medium hover:underline underline-offset-4">
              How it works
            </a>
            <a href="#features" className="text-sm font-medium hover:underline underline-offset-4">
              Features
            </a>
            <a href="#avalanche" className="text-sm font-medium hover:underline underline-offset-4">
              Avalanche
            </a>
            <a href="#faq" className="text-sm font-medium hover:underline underline-offset-4">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="border-orange-200 bg-orange-50 text-rose-700">
              No code
            </Badge>
            <Button
              className="text-white"
              style={{
                backgroundImage: `linear-gradient(90deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
              }}
            >
              Launch App
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Hero />
        <FeatureCards />
        <Steps />
        <AvalancheCta />
        <Faq />
      </main>

      <footer className="border-t bg-white">
        <div className="container flex flex-col items-center justify-between gap-4 px-4 py-6 md:h-16 md:flex-row">
          <p className="text-xs text-neutral-600">
            {"© "}
            {new Date().getFullYear()}
            {" SparkDapp. All rights reserved."}
          </p>
          <nav className="flex items-center gap-4 text-xs">
            <Link href="#" className="hover:underline underline-offset-4">
              Privacy
            </Link>
            <Link href="#" className="hover:underline underline-offset-4">
              Terms
            </Link>
            <Link href="#" className="hover:underline underline-offset-4">
              Docs
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
