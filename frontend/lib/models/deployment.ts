import mongoose from 'mongoose'

export interface IDeployment {
  walletAddress: string
  contractAddress: string
  contractName: string
  sourceCode: string
  targetLanguage: string
  timestamp: Date
  network: string
  transactionHash?: string
  gasUsed?: number
  status: 'pending' | 'success' | 'failed'
}

const deploymentSchema = new mongoose.Schema<IDeployment>({
  walletAddress: {
    type: String,
    required: true,
    index: true
  },
  contractAddress: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  contractName: {
    type: String,
    required: true
  },
  sourceCode: {
    type: String,
    required: true
  },
  targetLanguage: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  network: {
    type: String,
    required: true,
    default: 'Avalanche Fuji Testnet'
  },
  transactionHash: {
    type: String
  },
  gasUsed: {
    type: Number
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  }
})

// Create compound index for efficient queries
deploymentSchema.index({ walletAddress: 1, timestamp: -1 })
deploymentSchema.index({ network: 1, timestamp: -1 })

export const Deployment = mongoose.models.Deployment || mongoose.model<IDeployment>('Deployment', deploymentSchema)
