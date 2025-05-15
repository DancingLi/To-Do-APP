# Deploying the Node.js Backend on Render

Follow these instructions to deploy the To-Do Checklist API on Render's free tier.

## 1. Prepare Your Backend Project

1. Ensure your Node.js backend has a `package.json` file with:
   - All dependencies listed
   - Start script defined (e.g., `"start": "node server.js"`)

2. Create a `render.yaml` file in your project root:
   ```yaml
   services:
     - type: web
       name: todo-checklist-api
       env: node
       buildCommand: npm install
       startCommand: npm start
       envVars:
         - key: NODE_ENV
           value: production
         - key: PORT
           value: 10000
         - key: MONGODB_URI
           sync: false
   ```

3. Create a `.env.example` file listing all required environment variables (without values):
   ```
   PORT=5000
   MONGODB_URI=
   NODE_ENV=production
   ```

## 2. Create a Render Account

1. Go to [render.com](https://render.com/) and sign up
2. Verify your email address

## 3. Connect Your GitHub Repository

1. In the Render dashboard, click "New +"
2. Select "Web Service"
3. Connect your GitHub account
4. Select your repository with the To-Do Checklist API
5. You may need to configure access permissions for the repository

## 4. Configure the Web Service

1. Fill in the following details:
   - Name: `todo-checklist-api`
   - Environment: `Node`
   - Region: Choose closest to your users
   - Branch: `main` (or your default branch)
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: Free

2. Add environment variables:
   - Click "Advanced" > "Add Environment Variable"
   - Add the following:
     - `NODE_ENV`: `production`
     - `PORT`: `10000` (Render assigns this port internally)
     - `MONGODB_URI`: Your MongoDB Atlas connection string

3. Click "Create Web Service"

## 5. Watch the Deployment

1. Render will automatically build and deploy your service
2. You can follow the build logs in real-time
3. Once complete, you'll receive the URL for your API (e.g., `https://todo-checklist-api.onrender.com`)

## 6. Set Up Continuous Deployment

Render automatically deploys when you push to your configured branch. To temporarily disable this:

1. Go to your service dashboard
2. Click "Settings"
3. Under "Build & Deploy" > "Auto-Deploy", select "No"

## 7. Configure CORS in Your Backend

Update your CORS configuration to allow requests from your Vercel frontend:

```javascript
// In your server.js or app.js file
app.use(cors({
  origin: [
    'https://your-vercel-app-name.vercel.app', 
    'https://your-custom-domain.com',
    'http://localhost:3000' // For local development
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## 8. Free Tier Limitations

Be aware of Render's free tier limitations:
- Services spin down after 15 minutes of inactivity
- The first request after inactivity may take up to 30 seconds
- 750 hours of runtime per month
- Shared CPU and 512 MB RAM

For production use, consider upgrading to a paid plan.

## 9. Monitoring Your API

1. View logs by clicking "Logs" in your service dashboard
2. Set up health checks under "Settings" > "Health"
3. For advanced monitoring, integrate New Relic or a similar service
