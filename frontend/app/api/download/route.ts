import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import dbConnect from '@/lib/mongodb'
import Download from '@/models/Download'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const body = await request.json()
    const { platform, version } = body

    if (!platform || !version) {
      return NextResponse.json(
        { error: 'Platform and version are required' },
        { status: 400 }
      )
    }

    // Get user info for analytics
    const userAgent = request.headers.get('user-agent') || undefined
    const forwarded = request.headers.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.ip || undefined

    // Create download record
    const download = new Download({
      platform,
      version,
      userAgent,
      ipAddress,
      downloadedAt: new Date(),
    })

    await download.save()

    // Read the icon file
    const filePath = join(process.cwd(), 'public', 'icon.png')
    const fileBuffer = await readFile(filePath)

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="ava-installer.png"',
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Download API error:', error)
    return NextResponse.json(
      { error: 'Failed to process download' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    // Get time period from query params
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d'

    // Calculate date range based on period
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case '24h':
        startDate = new Date(now)
        startDate.setHours(now.getHours() - 23, 0, 0, 0) // 24 hours ago, start of hour
        break
      case '7d':
        startDate.setDate(now.getDate() - 6) // Include today (7 days total)
        break
      case '30d':
        startDate.setDate(now.getDate() - 29) // Include today (30 days total)
        break
      default:
        startDate.setDate(now.getDate() - 6)
    }

    // Get download statistics
    const totalDownloads = await Download.countDocuments()
    
    // Get downloads by platform
    const downloadsByPlatform = await Download.aggregate([
      {
        $group: {
          _id: '$platform',
          count: { $sum: 1 },
          latestDownload: { $max: '$downloadedAt' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ])

    // Get recent downloads (last 10)
    const recentDownloads = await Download.find({})
      .sort({ downloadedAt: -1 })
      .limit(10)
      .select('platform version downloadedAt userAgent')

    // Get downloads over time by platform
    const downloadsOverTimeByPlatform = await Download.aggregate([
      {
        $match: {
          downloadedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: period === '24h' ? '%Y-%m-%d %H:00' : '%Y-%m-%d',
                date: '$downloadedAt'
              }
            },
            platform: '$platform'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1, '_id.platform': 1 }
      }
    ])

    // Get unique platforms and time periods
    const platforms = [...new Set(downloadsByPlatform.map(p => p._id))]
    const timePeriods = []
    
    if (period === '24h') {
      // Generate 24 hours (including current hour)
      for (let i = 0; i < 24; i++) {
        const date = new Date(startDate)
        date.setHours(startDate.getHours() + i, 0, 0, 0)
        const key = date.toISOString().substring(0, 13) + ':00'
        timePeriods.push(key)
      }
    } else {
      // Generate days (including today)
      const days = period === '7d' ? 7 : 30
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate)
        date.setDate(date.getDate() + i)
        const key = date.toISOString().substring(0, 10)
        timePeriods.push(key)
      }
    }

    // Create a map for quick lookup
    const platformTimeMap = new Map()
    downloadsOverTimeByPlatform.forEach(item => {
      const key = `${item._id.date}-${item._id.platform}`
      platformTimeMap.set(key, item.count)
    })

    // Debug: Log the mapping for 24h period
    if (period === '24h') {
      console.log('24h Debug - Platform Time Map keys:', Array.from(platformTimeMap.keys()).slice(-5))
      console.log('24h Debug - Generated time periods:', timePeriods.slice(-3))
      console.log('24h Debug - Recent downloads times:', recentDownloads.slice(0, 3).map(d => d.downloadedAt))
    }

    // Fill in missing periods with zero values for each platform
    const downloadsOverTime = timePeriods.map(timeKey => {
      const platformCounts = {}
      let totalCount = 0
      
      platforms.forEach(platform => {
        const count = platformTimeMap.get(`${timeKey}-${platform}`) || 0
        platformCounts[platform] = count
        totalCount += count
      })
      
      return {
        _id: timeKey,
        count: totalCount,
        platforms: platformCounts
      }
    })

    console.log('API Debug:', {
      period,
      startDate: startDate.toISOString(),
      now: now.toISOString(),
      timePeriods: period === '24h' ? timePeriods.slice(-3) : timePeriods.slice(0, 3), // Last 3 hours or first 3 days
      downloadsOverTimeLength: downloadsOverTime.length,
      sampleDownloadData: period === '24h' ? downloadsOverTime.slice(-3) : downloadsOverTime.slice(-2), // Last 3 hours or 2 days
      rawDataCount: downloadsOverTimeByPlatform.length,
      rawDataSample: downloadsOverTimeByPlatform.slice(-2)
    })

    return NextResponse.json({
      totalDownloads,
      downloadsByPlatform,
      recentDownloads,
      downloadsOverTime,
      period, // Include the period in response for debugging
    })
  } catch (error) {
    console.error('Download stats API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch download statistics' },
      { status: 500 }
    )
  }
}
