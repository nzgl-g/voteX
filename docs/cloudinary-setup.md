# Cloudinary Setup for Banner Images

This document explains how to set up Cloudinary for banner image uploads in the Vote System application.

## Prerequisites

1. Create a [Cloudinary account](https://cloudinary.com/users/register/free) if you don't have one already.
2. Log in to your Cloudinary dashboard.

## Setup Steps

### 1. Get Your Cloudinary Credentials

From your Cloudinary dashboard, note down the following:
- Cloud Name
- API Key
- API Secret

### 2. Create an Upload Preset

1. In your Cloudinary dashboard, go to Settings > Upload
2. Scroll down to "Upload presets" and click "Add upload preset"
3. Set the following:
   - Name: `session_banners`
   - Signing Mode: Unsigned
   - Folder: `session_banners`
   - Access Mode: public
4. Save the preset

### 3. Configure Environment Variables

Add the following to your `.env.local` file:

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Replace `your_cloud_name`, `your_api_key`, and `your_api_secret` with your actual Cloudinary credentials.

### 4. Update Predefined Banners (Optional)

If you want to use your own predefined banner images, upload them to Cloudinary and update the URLs in `components/session-creation/steps/step-1-basic-info.tsx`:

```typescript
const predefinedBanners = [
  "https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1/session_banners/banner1.jpg",
  "https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1/session_banners/banner2.jpg",
  "https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1/session_banners/banner3.jpg",
  "https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1/session_banners/banner4.jpg",
];
```

## How It Works

1. The application uses the Cloudinary Upload Widget to handle image uploads directly from the client to Cloudinary.
2. When a user uploads an image, it's sent directly to Cloudinary and the URL is returned.
3. The URL is stored in the session data and used to display the banner image.
4. The Next.js configuration includes Cloudinary as a trusted image domain.

## Troubleshooting

- If images aren't displaying, check that `res.cloudinary.com` is included in the `images.domains` array in `next.config.ts`.
- If uploads fail, verify that your upload preset is configured correctly and is set to "unsigned".
- Check browser console for any errors related to Cloudinary. 