"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, Download, Monitor, Apple, Smartphone, TrendingUp, Users, Clock, BarChart3 } from "lucide-react"
import { brand } from "@/lib/brand"

interface DownloadStats {
  totalDownloads: number
  downloadsByPlatform: Array<{
    _id: string
    count: number
    latestDownload: string
  }>
  recentDownloads: Array<{
    _id: string
    platform: string
    version: string
    downloadedAt: string
    userAgent?: string
  }>
  downloadsOverTime: Array<{
    _id: string
    count: number
  }>
}

export default function DownloadsPage() {
  const [stats, setStats] = useState<DownloadStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/download')
      if (!response.ok) {
        throw new Error('Failed to fetch statistics')
      }
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Stats fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (platform: string, version: string) => {
    const downloadKey = `${platform}-${version}`
    setDownloading(downloadKey)
    
    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platform, version }),
      })

      if (!response.ok) {
        throw new Error('Download failed')
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ava-${platform.toLowerCase()}-${version.toLowerCase()}-installer.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      // Refresh stats after successful download
      await fetchStats()
    } catch (error) {
      console.error('Download error:', error)
      // Fallback to direct download
      window.open('/icon.png', '_blank')
    } finally {
      setDownloading(null)
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'macOS': return Apple
      case 'Windows': return Monitor
      case 'Linux': return Smartphone
      default: return Download
    }
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }
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
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-800">
      {/* Navigation Header */}
      <motion.header 
        className="border-b bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-neutral-200 dark:border-neutral-700"
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
              <span className="font-semibold text-lg group-hover:text-rose-600 transition-colors text-neutral-900 dark:text-white">.ava</span>
            </Link>
            
            <Link 
              href="/" 
              className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
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
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-neutral-900 dark:text-white mb-4">
            Download .ava for your platform
          </h1>
          <p className="mx-auto max-w-[65ch] text-lg text-neutral-600 dark:text-neutral-400">
            Get the .ava compiler and toolchain for Windows, macOS, and Linux. Start building verifiable programs for Avalanche.
          </p>
        </motion.div>

        {/* Simple Download Stats */}
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="inline-flex items-center gap-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-rose-500" />
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Total Downloads:</span>
              {loading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <span className="text-lg font-bold text-neutral-900 dark:text-white">
                  {stats?.totalDownloads.toLocaleString() || 0}
                </span>
              )}
            </div>
            
            <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700" />
            
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                >
                  <BarChart3 className="h-4 w-4 mr-1" />
                  View more
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-rose-500" />
                    Download Analytics
                  </DialogTitle>
                  <DialogDescription>
                    Detailed download statistics and activity over time
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-neutral-200 dark:border-neutral-700">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                          Total Downloads
                        </CardTitle>
                        <Download className="h-4 w-4 text-rose-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                          {stats?.totalDownloads.toLocaleString() || 0}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-neutral-200 dark:border-neutral-700">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                          Active Platforms
                        </CardTitle>
                        <Users className="h-4 w-4 text-rose-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                          {stats?.downloadsByPlatform.length || 0}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-neutral-200 dark:border-neutral-700">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                          Last 30 Days
                        </CardTitle>
                        <Clock className="h-4 w-4 text-rose-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                          {stats?.downloadsOverTime.reduce((sum, day) => sum + day.count, 0) || 0}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Platform Breakdown */}
                  <Card className="border-neutral-200 dark:border-neutral-700">
                    <CardHeader>
                      <CardTitle className="text-neutral-900 dark:text-white">Downloads by Platform</CardTitle>
                      <CardDescription className="text-neutral-600 dark:text-neutral-400">
                        Distribution across operating systems
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {stats?.downloadsByPlatform.map((platform) => {
                          const IconComponent = getPlatformIcon(platform._id)
                          const percentage = stats.totalDownloads > 0 ? 
                            Math.round((platform.count / stats.totalDownloads) * 100) : 0
                          
                          return (
                            <div key={platform._id} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-900/20">
                                  <IconComponent className="h-4 w-4 text-rose-500" />
                                </div>
                                <div>
                                  <p className="font-medium text-neutral-900 dark:text-white">{platform._id}</p>
                                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    Last: {formatRelativeTime(platform.latestDownload)}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-neutral-900 dark:text-white">
                                  {platform.count.toLocaleString()}
                                </p>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">{percentage}%</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Download Graph */}
                  <Card className="border-neutral-200 dark:border-neutral-700">
                    <CardHeader>
                      <CardTitle className="text-neutral-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-rose-500" />
                        Download Activity
                      </CardTitle>
                      <CardDescription className="text-neutral-600 dark:text-neutral-400">
                        Daily downloads over the last 30 days
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {stats?.downloadsOverTime && stats.downloadsOverTime.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {stats.downloadsOverTime.slice(-14).map((day) => {
                            const maxCount = Math.max(...stats.downloadsOverTime.map(d => d.count))
                            const percentage = maxCount > 0 ? (day.count / maxCount) * 100 : 0
                            
                            return (
                              <div key={day._id} className="flex items-center justify-between group hover:bg-neutral-50 dark:hover:bg-neutral-700/50 p-2 rounded transition-colors">
                                <span className="text-sm text-neutral-600 dark:text-neutral-400 font-mono">
                                  {new Date(day._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                                <div className="flex items-center gap-3 flex-1 justify-end">
                                  <div className="relative w-32 h-3 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                                    <motion.div 
                                      className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-full"
                                      initial={{ width: 0 }}
                                      animate={{ width: `${Math.max(percentage, 2)}%` }}
                                      transition={{ duration: 0.8, delay: 0.1 }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium text-neutral-900 dark:text-white w-8 text-right">
                                    {day.count}
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                          No download data available yet
                        </div>
                      )}
                    </CardContent>
                  </Card>

                </div>
              </DialogContent>
            </Dialog>
          </div>
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
              <Card className="p-6 h-full border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm hover:shadow-lg transition-shadow duration-300">
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
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">{platform.platform}</h3>
                  </div>
                </div>

                <div className="space-y-3">
                  {platform.versions.map((version, versionIndex) => (
                    <motion.div
                      key={version.name}
                      className={`relative flex items-center justify-between p-3 rounded-lg border transition-colors group ${
                        version.recommended 
                          ? 'border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-900/20 hover:bg-rose-50 dark:hover:bg-rose-900/30' 
                          : 'border-neutral-200 dark:border-neutral-600 hover:border-neutral-300 dark:hover:border-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
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
                          <p className="font-medium text-neutral-900 dark:text-white">{version.name}</p>
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">{version.arch}</p>
                      </div>
                      {version.recommended ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="opacity-70 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDownload(platform.platform, version.name)}
                          disabled={downloading === `${platform.platform}-${version.name}`}
                        >
                          {downloading === `${platform.platform}-${version.name}` ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Download className="h-4 w-4" />
                            </motion.div>
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-xs text-neutral-500 dark:text-neutral-400 border-neutral-300 dark:border-neutral-600">
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
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">System Requirements</h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              .ava requires a 64-bit operating system. For optimal performance, we recommend at least 4GB of RAM and 1GB of free disk space.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="outline" className="border-neutral-300 dark:border-neutral-600 dark:text-neutral-300">Windows 10+</Badge>
              <Badge variant="outline" className="border-neutral-300 dark:border-neutral-600 dark:text-neutral-300">macOS 10.15+</Badge>
              <Badge variant="outline" className="border-neutral-300 dark:border-neutral-600 dark:text-neutral-300">Ubuntu 18.04+</Badge>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
