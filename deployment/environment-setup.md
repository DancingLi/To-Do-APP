# Environment Variables and Secrets Setup

This guide explains how to set up all necessary environment variables and secrets for deploying the To-Do Checklist application.

## Required Secrets for GitHub Actions

Add these secrets in your GitHub repository: Settings > Secrets > Actions:

1. **Backend Deployment (Render)**
   - `RENDER_API_KEY`: Your Render API key from account settings
   - `RENDER_SERVICE_ID`: The ID of your web service from the Render dashboard URL

2. **Frontend Deployment (Vercel)**
   - `VERCEL_TOKEN`: API token from Vercel account settings
   - `VERCEL_ORG_ID`: Your organization ID from Vercel
   - `VERCEL_PROJECT_ID`: Your project ID from Vercel

## Environment Variables

### Backend (Render)

Add these in the Render dashboard for your service:

