# Blockchain Vote System

A full-stack, blockchain-based voting platform with robust KYC, role-based access, and transparent, tamper-proof voting sessions.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Directory Structure](#directory-structure)
- [Getting Started](#getting-started)
- [Frontend](#frontend)
- [Backend](#backend)
- [Blockchain](#blockchain)
- [KYC Service](#kyc-service)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

---

## Project Overview

This system enables secure, transparent, and decentralized voting using blockchain technology. It supports multiple user roles (Team Leader, Team Member, Candidate, Voter) and integrates a KYC process for identity verification.
This project was developed as part of the requirements for obtaining a Bachelor's degree in Computer Science. The academic report is available here.

Note: The project is still under development and may contain some issues, which will be addressed as soon as we have the availability.

---

## Architecture

- **Frontend**: Next.js app for user interaction, dashboards, and voting.
- **Backend**: Node.js/Express API for business logic, user/session management, and blockchain interaction.
- **Blockchain**: Solidity smart contracts for vote sessions and vote recording.
- **KYC**: Python microservice for document and identity verification.

---

## Features

- **Role-based Dashboards**: Custom interfaces for each user type.
- **Session Management**: Create, edit, and manage voting sessions.
- **Blockchain Voting**: All votes are recorded on-chain for transparency.
- **KYC Integration**: Secure identity verification for voters and candidates.
- **Team Management**: Team leaders can invite/manage members.
- **Notifications**: Real-time updates for session events, KYC status, and more.

---

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Node.js, Express, MongoDB, Socket.IO
- **Blockchain**: Solidity, Hardhat, Ethers.js
- **KYC**: Python, Flask, OCR, image forensics

---

## Directory Structure
```
.
├── app/           # Next.js frontend  
├── server/        # Node.js/Express backend  
├── blockchain/    # Solidity smart contracts & deployment  
├── kyc/           # Python KYC microservice  
├── components/    # Shared frontend components  
├── services/      # Frontend service modules (API calls)  
├── docs/          # Additional documentation  
├── public/        # Static assets  
├── utils/         # Utility functions  
├── types/         # TypeScript types  
└── ...
```



---

## Getting Started

### Prerequisites

- Node.js (v16+)
- Python 3.8+
- MongoDB
- Docker (optional, for containerized setup)

### 1. Clone the Repository

```bash
git clone https://github.com/nzgl-g/voteX.git
cd vote-system
```

### 2. Install Dependencies

#### Frontend & Backend

```bash
pnpm install
# or
npm install
```

#### KYC Service

```bash
cd kyc
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Environment Variables

- Copy `.env-docker.example` and `.env_sample` (in `kyc/`) to `.env` files and fill in required values.

### 4. Running the System

#### Docker (Recommended)

```bash
docker-compose up --build
```

#### Manual

- **Frontend**: `pnpm run dev`
- **Backend**: `cd server && npm start`
- **KYC**: `cd kyc && python app.py`
- **Blockchain**: Deploy contracts with Hardhat (`cd blockchain && npx hardhat run scripts/deploy.js`)

---

## Frontend

- Built with Next.js, TypeScript, Tailwind CSS, and Shadcn UI.
- Role-based dashboards: `/app/team-leader`, `/app/team-member`, `/app/voter-portal`, `/app/candidate-portal`.
- Session creation, voting, KYC, and notifications.

See [FRONTEND_README.md](FRONTEND_README.md) for details.

---

## Backend

- Node.js/Express REST API.
- Handles authentication, session/team management, notifications, and blockchain interaction.
- MongoDB for data storage.
- Socket.IO for real-time updates.

See [server/README.md](server/README.md) for details.

---

## Blockchain

- Solidity smart contracts: `VoteSessionFactory`, `VoteSession`.
- Hardhat for deployment/testing.
- All votes and session data are recorded on-chain for transparency.

See [blockchain/README.md](blockchain/README.md) for details.

---

## KYC Service

- Python Flask microservice for document and identity verification.
- Integrates with backend for user KYC checks.
- Uses OCR, image forensics, and metadata analysis.

See [kyc/README.md](kyc/README.md) for details.

---

## Security

- JWT-based authentication and role-based access control.
- All sensitive data managed via environment variables.
- KYC data is handled securely and deleted after processing.
- Blockchain private keys are never exposed in the codebase.

---

## Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Create a new Pull Request

---

## License

[MIT](LICENSE)

---

## Documentation

- [Frontend](FRONTEND_README.md)
- [Backend](server/README.md)
- [Blockchain](blockchain/README.md)
- [KYC](kyc/README.md)
