# MongoDB Atlas Setup

Follow these instructions to set up a free-tier MongoDB Atlas cluster for your To-Do Checklist app.

## 1. Create a MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and click "Try Free"
2. Sign up with your email or use Google/GitHub authentication
3. Complete the welcome survey (or skip)

## 2. Create a Free Tier Cluster

1. Choose the "Shared" (Free) option
2. Select your preferred cloud provider (AWS, Google Cloud, or Azure)
3. Choose a region closest to your target users
4. Select "M0 Sandbox" (Free tier)
5. Name your cluster (e.g., "todo-checklist")
6. Click "Create Cluster"

## 3. Set Up Database Security

### Create a Database User

1. In the left sidebar, navigate to "Database Access"
2. Click "Add New Database User"
3. Authentication Method: Password
4. Username: Choose a username (e.g., "todo-app-user")
5. Password: Choose a secure password (or autogenerate one) - **SAVE THIS PASSWORD**
6. Database User Privileges: "Read and write to any database"
7. Click "Add User"

### Configure Network Access

1. In the left sidebar, navigate to "Network Access"
2. Click "Add IP Address"
3. For development: Choose "Allow Access from Anywhere" (0.0.0.0/0)
   - For production, you should restrict to your application's IP addresses
4. Click "Confirm"

## 4. Get Your Connection String

1. In the left sidebar, click on "Database" under "Deployments"
2. Find your cluster and click "Connect"
3. Select "Connect your application"
4. Choose "Node.js" as your driver and the latest version
5. Copy the connection string (it will look like this):
   ```
   mongodb+srv://<username>:<password>@todo-checklist.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` and `<password>` with your database user credentials
7. Add your database name to the connection string:
   ```
   mongodb+srv://todo-app-user:yourpassword@todo-checklist.xxxxx.mongodb.net/todo_checklist?retryWrites=true&w=majority
   ```

## 5. Create Database Collections

You can either:

1. Let your application create collections automatically on first use, or
2. Manually create them:
   - Click on your cluster name
   - Click "Collections" tab
   - Click "Add My Own Data"
   - Create a database named "todo_checklist"
   - Create collections:
     - `tasks`
     - `categories`
     - `users`
     - `progressTracking`

## 6. Set Up Connection in Your Application

Update your `.env` file with the MongoDB connection string:

