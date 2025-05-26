# Dockerized Vote System

This document provides instructions for running the Vote System using Docker containers.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Project Structure

The Vote System consists of four main components:

1. **Frontend**: NextJS application
2. **Backend**: Express.js API server
3. **Blockchain**: Hardhat node with smart contracts
4. **KYC**: Python Flask application for identity verification

## Getting Started

### 1. Build and Run the Containers

```bash
# Build and start all services
docker-compose up -d

# To build a specific service
docker-compose build <service-name>

# To rebuild and restart a specific service
docker-compose up -d --build <service-name>
```

### 2. Access the Services

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- KYC Service: http://localhost:5000
- Blockchain Node: http://localhost:8545

### 3. Check Container Status

```bash
# View all running containers
docker-compose ps

# View logs for a specific service
docker-compose logs -f <service-name>
```

### 4. Stopping the Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (will delete database data)
docker-compose down -v
```

## Development Workflow

When developing with Docker:

1. Changes to the frontend code will be reflected without restarting thanks to volume mounting
2. Backend changes require a restart of the backend service
3. KYC service changes require a restart of the KYC service
4. Blockchain contract changes require redeploying the contracts

## Deployment

For production deployment:

1. Update the environment variables in the docker-compose.yml file
2. Build production images:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
   ```
3. Deploy to your server:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

## Troubleshooting

- If services fail to start, check the logs with `docker-compose logs -f <service-name>`
- Ensure ports are not in use by other applications
- For database connection issues, verify MongoDB is running and accessible

## Notes

- The default MongoDB credentials should be changed in production
- JWT secrets and other sensitive information should be stored in environment variables
- For production, consider using Docker Swarm or Kubernetes for better container orchestration 