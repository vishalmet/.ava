"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Monitor, Apple, Smartphone } from "lucide-react"
import { brand } from "@/lib/brand"

export default function DownloadsPage() {
  const downloads = [
    {
      platform: "macOS",
      icon: Apple,
      versions: [
        { name: "Mac Universal", arch: "Universal Binary", recommended: true },
        { name: "Mac (ARM64)", arch: "Apple Silicon" },
        { name: "Mac (x64)", arch: "Intel" }
      ]
    },
    {
      platform: "Windows",
      icon: Monitor,
      versions: [
        { name: "Windows (x64) (User)", arch: "64-bit User Install", recommended: true },
        { name: "Windows (ARM64) (User)", arch: "ARM64 User Install" },
        { name: "Windows (x64) (System)", arch: "64-bit System Install" },
        { name: "Windows (ARM64) (System)", arch: "ARM64 System Install" }
      ]
    },
    {
      platform: "Linux",
      icon: Smartphone,
      versions: [
        { name: "Linux (x64)", arch: "64-bit", recommended: true },
        { name: "Linux (ARM64)", arch: "ARM64" }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Navigation Header */}
      <motion.header 
        className="border-b bg-white/90 backdrop-blur-md border-neutral-200"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative">
                <motion.div
                  className="h-8 w-8 rounded-md shadow-sm"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
                  }}
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                />
              </div>
              <span className="font-semibold text-lg group-hover:text-rose-600 transition-colors text-neutral-900">.ava</span>
            </Link>
            
            <Link 
              href="/" 
              className="flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-rose-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </motion.header>

      <div className="container px-4 py-12">
        {/* Page Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge 
            className="mb-4 text-white border-0"
            style={{
              backgroundImage: `linear-gradient(90deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
            }}
          >
            <Download className="h-3 w-3 mr-1" />
            Downloads
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-neutral-900 mb-4">
            Download .ava for your platform
          </h1>
          <p className="mx-auto max-w-[65ch] text-lg text-neutral-600">
            Get the .ava compiler and toolchain for Windows, macOS, and Linux. Start building verifiable programs for Avalanche.
          </p>
        </motion.div>

        {/* Download Cards */}
        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {downloads.map((platform, platformIndex) => (
            <motion.div
              key={platform.platform}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: platformIndex * 0.1 }}
            >
              <Card className="p-6 h-full border-neutral-200 bg-white shadow-sm hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div 
                    className="p-3 rounded-lg"
                    style={{
                      backgroundColor: `${brand.colors.primaryFrom}15`,
                    }}
                  >
                    <platform.icon className="h-6 w-6" style={{ color: brand.colors.primaryFrom }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900">{platform.platform}</h3>
                  </div>
                </div>

                <div className="space-y-3">
                  {platform.versions.map((version, versionIndex) => (
                    <motion.div
                      key={version.name}
                      className={`relative flex items-center justify-between p-3 rounded-lg border transition-colors group ${
                        version.recommended 
                          ? 'border-rose-200 bg-rose-50/50 hover:bg-rose-50' 
                          : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {version.recommended && (
                        <div className="absolute -top-3 right-3">
                          <Badge 
                            className="text-xs text-white border-0 shadow-sm"
                            style={{
                              backgroundImage: `linear-gradient(90deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
                            }}
                          >
                            Recommended
                          </Badge>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-neutral-900">{version.name}</p>
                        </div>
                        <p className="text-sm text-neutral-600">{version.arch}</p>
                      </div>
                      {version.recommended ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="opacity-70 group-hover:opacity-100 transition-opacity"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-xs text-neutral-500 border-neutral-300">
                          Coming soon
                        </Badge>
                      )}
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="mx-auto max-w-2xl">
            <h3 className="text-lg font-semibold text-neutral-900 mb-3">System Requirements</h3>
            <p className="text-neutral-600 mb-6">
              .ava requires a 64-bit operating system. For optimal performance, we recommend at least 4GB of RAM and 1GB of free disk space.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="outline" className="border-neutral-300">Windows 10+</Badge>
              <Badge variant="outline" className="border-neutral-300">macOS 10.15+</Badge>
              <Badge variant="outline" className="border-neutral-300">Ubuntu 18.04+</Badge>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
