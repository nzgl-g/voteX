FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose the Hardhat node port
EXPOSE 8545

# Start a local Hardhat node
CMD ["npx", "hardhat", "node"] 