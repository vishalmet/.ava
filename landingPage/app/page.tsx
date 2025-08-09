"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import Hero from "@/components/hero"
import FeatureCards from "@/components/feature-cards"
import Steps from "@/components/steps"
import ConverterCta from "@/components/converter-cta"
import AvalancheCta from "@/components/avalanche-cta"
import Faq from "@/components/faq"
import ScrollToTop from "@/components/scroll-to-top"
import PageLoader from "@/components/page-loader"
import { brand } from "@/lib/brand"

export default function Page() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      <PageLoader />
      <div className="flex min-h-screen flex-col relative w-full">
        {/* Diagonal Stripes Background */}
        <motion.div
          className="fixed inset-0 z-0 opacity-100"
          style={{
            backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 0px, #f8fafc 2px, #f8fafc 4px)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ duration: 2, ease: "easeOut" }}
        />
      <motion.header 
        className="sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/75"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="container flex h-16 items-center justify-between px-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Link href="#" className="flex items-center gap-2 group">
              <div className="relative">
                <motion.div
                  className="h-8 w-8 rounded-md shadow-sm"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
                  }}
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                />
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                >
                  <Sparkles className="absolute -right-2 -top-2 h-4 w-4 text-rose-500" aria-hidden="true" />
                </motion.div>
              </div>
              <span className="font-semibold text-lg group-hover:text-rose-600 transition-colors">.ava</span>
              <span className="sr-only">ava Home</span>
            </Link>
          </motion.div>
          
          <nav className="hidden items-center gap-8 md:flex">
            {[
              { href: "#how-it-works", label: "How it works" },
              { href: "#features", label: "Features" },
              { href: "#faq", label: "FAQ" }
            ].map((item, i) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                {item.href.startsWith('#') ? (
                  <a
                    href={item.href}
                    className="text-sm font-medium text-neutral-700 hover:text-rose-600 transition-colors relative group"
                  >
                    {item.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-rose-500 to-orange-500 group-hover:w-full transition-all duration-300"></span>
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    className="text-sm font-medium text-neutral-700 hover:text-rose-600 transition-colors relative group"
                  >
                    {item.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-rose-500 to-orange-500 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                )}
              </motion.div>
            ))}
          </nav>
          
          <div className="hidden md:flex items-center gap-3">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link href="/converter">
                <Button
                  className="text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                  style={{
                    backgroundImage: `linear-gradient(90deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
                  }}
                >
                  .ava Converter
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Mobile menu button */}
          <motion.button
            className="md:hidden p-2 text-neutral-700 hover:text-rose-600 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait">
              {isMobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-6 w-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-6 w-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="md:hidden border-t bg-white/95 backdrop-blur-md"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="container px-4 py-4 space-y-4">
                {[
                  { href: "#how-it-works", label: "How it works" },
                  { href: "#features", label: "Features" },
                  { href: "#faq", label: "FAQ" }
                ].map((item, i) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    {item.href.startsWith('#') ? (
                      <a
                        href={item.href}
                        className="block text-sm font-medium text-neutral-700 hover:text-rose-600 transition-colors py-2"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        className="block text-sm font-medium text-neutral-700 hover:text-rose-600 transition-colors py-2"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    )}
                  </motion.div>
                ))}
                <div className="flex items-center gap-3 pt-4 border-t">
                  <Badge variant="secondary" className="border-orange-200 bg-orange-50 text-rose-700">
                    Verifiable
                  </Badge>
                  <Link href="/converter" className="flex-1">
                    <Button
                      className="text-white font-medium w-full"
                      style={{
                        backgroundImage: `linear-gradient(90deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
                      }}
                    >
                      .ava Converter
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <main className="flex-1 relative z-10">
        <Hero />
        <FeatureCards />
        <Steps />
        <ConverterCta />
        {/* <AvalancheCta /> */}
        <Faq />
      </main>

      <motion.footer 
        className="border-t bg-gradient-to-r from-neutral-50 to-white relative z-10"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="container flex flex-col items-center justify-between gap-4 px-4 py-8 md:py-6 md:flex-row">
          <motion.p 
            className="text-sm text-neutral-600"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {"© "}
            {new Date().getFullYear()}
            {" ava. All rights reserved."}
          </motion.p>
          <motion.nav 
            className="flex items-center gap-6 text-sm"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            {[
              { href: "#", label: "Privacy" },
              { href: "#", label: "Terms" },
              { href: "#", label: "Docs" }
            ].map((link, i) => (
              <motion.div
                key={link.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.1 }}
                whileHover={{ y: -2 }}
              >
                <Link 
                  href={link.href} 
                  className="text-neutral-600 hover:text-rose-600 transition-colors duration-200 relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-rose-500 to-orange-500 group-hover:w-full transition-all duration-300"></span>
                </Link>
              </motion.div>
            ))}
          </motion.nav>
        </div>
      </motion.footer>
      
      <ScrollToTop />
      </div>
    </>
  )
}
