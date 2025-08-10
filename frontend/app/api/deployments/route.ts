import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { Deployment, IDeployment } from '@/lib/models/deployment'

// POST - Store new deployment
export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const body = await request.json()
    const { 
      walletAddress, 
      contractAddress, 
      contractName, 
      sourceCode, 
      targetLanguage,
      network = 'Avalanche Fuji Testnet',
      transactionHash,
      gasUsed,
      status = 'success'
    } = body

    // Validate required fields
    if (!walletAddress || !contractAddress || !contractName || !sourceCode || !targetLanguage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create new deployment record
    const deployment = new Deployment({
      walletAddress,
      contractAddress,
      contractName,
      sourceCode,
      targetLanguage,
      network,
      transactionHash,
      gasUsed,
      status,
      timestamp: new Date()
    })

    await deployment.save()

    return NextResponse.json({
      success: true,
      deployment: {
        id: deployment._id,
        walletAddress: deployment.walletAddress,
        contractAddress: deployment.contractAddress,
        contractName: deployment.contractName,
        timestamp: deployment.timestamp,
        network: deployment.network,
        status: deployment.status
      }
    })

  } catch (error) {
    console.error('Error storing deployment:', error)
    return NextResponse.json(
      { error: 'Failed to store deployment' },
      { status: 500 }
    )
  }
}

// GET - Retrieve deployment history
export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('walletAddress')
    const network = searchParams.get('network')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    const query: any = {}
    if (walletAddress) query.walletAddress = walletAddress
    if (network) query.network = network

    // Get deployments with pagination
    const deployments = await Deployment.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(offset)
      .select('-sourceCode') // Exclude source code for performance

    // Get total count
    const totalCount = await Deployment.countDocuments(query)

    return NextResponse.json({
      success: true,
      deployments,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })

  } catch (error) {
    console.error('Error retrieving deployments:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve deployments' },
      { status: 500 }
    )
  }
}
