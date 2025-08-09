# Download Tracking API Setup

## Environment Variables

Create a `.env.local` file in the `frontend` directory with the following:

```env
# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/ava-downloads

# Alternative: MongoDB Atlas connection string
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ava-downloads?retryWrites=true&w=majority
```

## Features

### API Endpoints

#### POST /api/download
- Tracks download events with timestamp and user info
- Serves the icon.png file as download
- Records: platform, version, userAgent, ipAddress, downloadedAt

#### GET /api/download
- Returns download statistics and analytics
- Includes: total downloads, platform breakdown, recent downloads, downloads over time

### Pages

#### /downloads
- **Clean Layout**: Shows simple download count with "View more" button
- **Analytics Modal**: Detailed statistics displayed in a modal dialog
- **Download Tracking**: All recommended downloads use the API tracking system
- **Live Updates**: Statistics refresh automatically after each download
- **Skeleton Loading**: Shows loading states while fetching data
- **NPM-Style Graph**: Visual download activity in modal
- **Platform Breakdown**: Shows download distribution in modal
- **Dark Mode Support**: Full dark theme compatibility

### Components

#### Hero Section
- "Download for Windows" button now tracks downloads
- Automatically downloads icon.png with proper naming

## Database Schema

The `Download` model includes:
- `platform`: Windows, macOS, or Linux
- `version`: Version identifier (e.g., "x64-user")
- `userAgent`: Browser/client information
- `ipAddress`: User's IP for analytics
- `downloadedAt`: Timestamp of download
- `createdAt`/`updatedAt`: Automatic timestamps

## Usage

1. Set up MongoDB connection
2. Start the development server
3. Visit `/dashboard` to view analytics
4. Download buttons automatically track usage
5. All data is stored in MongoDB for analysis
