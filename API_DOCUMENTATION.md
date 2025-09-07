# Jagrut API Documentation

This document provides comprehensive documentation of all APIs used in the Jagrut project, based on the source code in the `src` folder.

## Overview

The Jagrut project interacts with the Jagrut Awaaz learning platform API (`jagrutawaazapi.classx.co.in`) to:

- Authenticate users
- Fetch course folder structures
- Retrieve video details and download links
- Download educational content

## API Endpoints

### 1. User Authentication

#### Login API

- **File**: `src/lib/get-new-token.ts`
- **Endpoint**: `POST /post/userLogin`
- **Full URL**: `https://jagrutawaazapi.classx.co.in/post/userLogin?extra_details=0`

**Request Headers:**

```
Auth-Key: appxapi
Client-Service: Appx
Source: windows
```

**Request Body (FormData):**

```
source: windows
phone: [email]
email: [email]
password: [password]
mydeviceid: PG035NTJ
extra_details: 1
```

**Response:**

```typescript
{
  status: number;
  data: {
    userid: string;
    token: string;
  }
}
```

### 2. Folder Contents API

#### Get Folder Contents

- **File**: `src/lib/fetch-folder.ts`
- **Endpoint**: `GET /get/folder_contentsv3`
- **Full URL**: `https://jagrutawaazapi.classx.co.in/get/folder_contentsv3?course_id=${courseId}&parent_id=${folderId}&windowsapp=true&start=0`

**Request Headers:**

```
Auth-Key: appxapi
Client-Service: Appx
Source: windows
Authorization: [JWT_TOKEN]
```

**Query Parameters:**

- `course_id`: Course identifier
- `parent_id`: Parent folder identifier
- `windowsapp`: `true`
- `start`: `0`

**Response:**

```typescript
{
  status: number;
  data: {
    id: string;
    parent_id: string;
    Title: string;
    material_type: string; // "FOLDER", "VIDEO", "PDF", "IMAGE"
  }
  [];
}
```

### 3. Video Details API

#### Get Video Details

- **File**: `src/lib/fetch-video.ts`
- **Endpoint**: `GET /get/fetchVideoDetailsById`
- **Full URL**: `https://jagrutawaazapi.classx.co.in/get/fetchVideoDetailsById?course_id=${courseId}&video_id=${videoId}&folder_wise_course=1&lc_app_api_url=&ytflag=0`

**Request Headers:**

```
Host: jagrutawaazapi.classx.co.in
User-Id: [USER_ID]
Sec-Ch-Ua: "Not?A_Brand";v="8", "Chromium";v="108"
Auth-Key: appxapi
Device-Type:
Client-Service: Appx
Source: windows
Sec-Ch-Ua-Mobile: ?0
Authorization: [JWT_TOKEN]
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) jagrut_awaaz/0.0.1 Chrome/108.0.5359.62 Electron/22.0.0 Safari/537.36
Sec-Ch-Ua-Platform: "Windows"
Accept: */*
Origin: https://kbsdsgvkmsvo.akamai.net.in
Sec-Fetch-Site: cross-site
Sec-Fetch-Mode: cors
Sec-Fetch-Dest: empty
Referer: https://kbsdsgvkmsvo.akamai.net.in/
Accept-Encoding: gzip, deflate, br
Accept-Language: en-US
```

**Query Parameters:**

- `course_id`: Course identifier
- `video_id`: Video identifier
- `folder_wise_course`: `1`
- `lc_app_api_url`: (empty)
- `ytflag`: `0`

**Response:**

```typescript
{
  status: number;
  data: {
    id: string;
    Title: string;
    file_link: string;
    download_link: string;
    download_links: {
      bitrate: string; // e.g., "720p", "1080p"
      quality: string;
      path: string; // Encrypted download URL
      backup_url: string;
      backup_url2: string;
    }
    [];
  }
}
```

## File Download API

### Video File Download

- **Source**: External CDN (Akamai)
- **URL**: Decrypted from `download_links[].path` in video details response
- **Referrer Domain**: `https://appx-play.akamai.net.in/`

**Request Headers for Downloads:**

```
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) jagrut_awaaz/0.0.1 Chrome/108.0.5359.62 Electron/22.0.0 Safari/537.36
Referer: https://appx-play.akamai.net.in/
```

## Security & Encryption

### URL Decryption (`src/lib/decrypt.ts`)

- **Algorithm**: AES-256-CBC
- **Key**: `"638udh3829162018"` (UTF-8 encoded)
- **IV**: `"fedcba9876543210"` (UTF-8 encoded)
- **Padding**: PKCS7
- **Input**: Encrypted download URLs from video details API
- **Output**: Decrypted CDN URLs for file download

## Usage Patterns

### 1. Course Structure Traversal (`src/main.ts`)

```typescript
// Recursive folder fetching to build complete course tree
const buildFileTree = async (folderId: string, courseId: string) => {
  const folderData = await fetchFolder(folderId, courseId);
  // Process folders recursively
  // Build hierarchical structure
};
```

### 2. File System Creation (`src/create-folders.ts`)

- Reads generated file tree JSON
- Creates local folder structure
- Generates download manifest (`to-download.json`)

### 3. Concurrent Downloads (`src/download-videos.ts`)

- Fetches video details for each file
- Decrypts download URLs
- Downloads files with concurrency control (max 3 concurrent)
- Progress tracking and resumability
- Error handling and retry logic

## Error Handling

### Common Status Codes

- `200`: Success
- `401`: Unauthorized (invalid token)
- `404`: Resource not found
- `500`: Server error

### API Response Validation

All API responses include a `status` field that should be checked:

```typescript
if (data.status !== 200) {
  // Handle error
}
```

## Rate Limiting & Best Practices

### Concurrency Control

- Maximum 3 concurrent downloads
- Uses `p-limit` for queue management
- Progress tracking every 2 seconds

### File Size Validation

- Minimum file size check: 200 bytes
- Content-Length header validation

### Resumability

- Downloads marked as completed in JSON manifest
- Failed downloads logged separately
- Supports resume from interruption

## Dependencies

### External Libraries

- `crypto-js`: AES decryption for download URLs
- `p-limit`: Concurrency control
- `p-map`: Parallel processing with limits

### Runtime

- **Bun**: JavaScript runtime used for execution
- **Node.js fs/promises**: File system operations

## Environment Requirements

### Headers Configuration

The API expects specific headers that mimic the official Windows desktop application:

- `Auth-Key: appxapi`
- `Client-Service: Appx`
- `Source: windows`
- Custom User-Agent string matching Electron app

### Authentication

- JWT tokens are required for all authenticated endpoints
- Tokens include user ID, email, timestamp, and tenant information
- Tokens appear to have expiration (timestamp field)

## Notes

1. **Security**: All download URLs are encrypted and require decryption before use
2. **Platform Specific**: APIs are designed for the Windows desktop application
3. **Course Structure**: Hierarchical folder/file organization
4. **Material Types**: Supports FOLDER, VIDEO, PDF, IMAGE content types
5. **Quality Selection**: Videos available in multiple bitrates/qualities
6. **CDN Distribution**: Files served through Akamai CDN infrastructure
