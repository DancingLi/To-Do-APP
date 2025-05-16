FROM node:16

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies using regular npm install (not npm ci)
RUN npm install

# Copy the rest of the code
COPY . .

# Build the React app
RUN npm run build

# Make port 3000 available
EXPOSE 3000

# Start the app
CMD ["node", "server/server.js"]
