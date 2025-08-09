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

export async function GET() {
  try {
    await dbConnect()

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

    // Get downloads over time (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const downloadsOverTime = await Download.aggregate([
      {
        $match: {
          downloadedAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$downloadedAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ])

    return NextResponse.json({
      totalDownloads,
      downloadsByPlatform,
      recentDownloads,
      downloadsOverTime,
    })
  } catch (error) {
    console.error('Download stats API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch download statistics' },
      { status: 500 }
    )
  }
}
