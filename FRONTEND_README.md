# Frontend Documentation (Vote System)

This document outlines the structure and functionality of the Next.js frontend for the blockchain voting system.

## Overview

The frontend is built with Next.js (using the App Router), TypeScript, and Tailwind CSS. It utilizes Shadcn UI components for the user interface. It interacts with the backend server (Node.js/Express) via a set of well-defined services to perform actions related to users, sessions, teams, KYC, and blockchain operations.

## Project Root Structure (Frontend Specific)

*   **`/app/`**: Core of the Next.js application using the App Router.
    *   `layout.tsx`: Main layout component, likely including global providers (e.g., ThemeProvider, AuthProvider), navigation, and footer.
    *   `page.tsx`: The landing page of the application.
    *   `globals.css`: Global CSS styles, including Tailwind CSS base styles and custom global styles.
    *   **`/app/(users)/`**: Route group for user-specific pages (e.g., dashboards for different roles, profile pages).
        *   Likely contains subdirectories for `team-leader`, `team-member`, `voter-portal`, `candidate-portal` based on the project description.
    *   **`/app/session-setup/`**: Pages related to creating and configuring new voting sessions.
*   **`/components/`**: Reusable React components.
    *   **`/ui/`**: Shadcn UI components (e.g., Button, Card, Dialog, Input). These are typically generated and can be customized.
    *   **`/auth/`**: Components related to authentication (e.g., Login Form, Signup Form).
    *   **`/landing-page/`**: Components specifically for the main landing page (`app/page.tsx`).
    *   **`/shared/`**: Common components used across different parts of the application (e.g., modals, loaders, layout elements).
    *   **`/sidebar/`**: Components for navigation sidebars, likely varying based on user roles.
    *   **`/session-creation/`**: Components used in the session creation/setup process (`/app/session-setup/`).
    *   **`/session-detail/`**: Components for displaying details of a single voting session.
    *   **`/session-profile/`**: Components that might be part of a session's public profile or detailed view.
    *   **`/team-manager/`**: Components for team leaders to manage their teams.
    *   **`/team-member/`**: Components for team members' dashboard/tasks.
    *   **`/voter-portal/`**: Components for the voter's main interface, listing sessions, allowing voting.
    *   **`/nomination-requests/`**: Components for handling candidate nomination requests.
    *   **`/user-settings/`**: Components for users to manage their account settings.
    *   **`/event-calendar/`**: Components related to displaying events or session timelines.
    *   `file-uploader.tsx`: A reusable component for file uploads (likely used for KYC document submission or candidate application materials).
    *   `theme-provider.tsx`: Provides theme context (e.g., light/dark mode).
    *   `user-account-nav.tsx`: Navigation component for user account actions (e.g., profile, logout).
    *   `pricing-dialog.tsx`: A dialog for displaying pricing or subscription information (if applicable).
    *   `chat-bubble.tsx`: A UI component for chat or messaging features.
*   **`/hooks/`**: Custom React hooks for reusable stateful logic.
    *   `use-notifications.tsx` / `use-notification.ts`: Hooks for managing and displaying notifications.
    *   `use-debounced-callback.ts`: Hook for debouncing function calls.
    *   `use-toast.ts`: Hook for displaying toast messages (likely integrating with Shadcn UI Toaster).
    *   `use-current-time-indicator.ts`: Hook for displaying a current time indicator, possibly on timelines or calendars.
    *   `use-event-visibility.ts`: Hook to manage visibility of events, perhaps in a calendar or list.
    *   `use-mobile.ts`: Hook to detect if the application is being viewed on a mobile device.
*   **`/lib/`**: Utility functions, type definitions, and configurations.
    *   `utils.ts`: General utility functions (e.g., `cn` for Shadcn class merging).
    *   `types.ts`: TypeScript type definitions used across the frontend.
    *   `mock.ts`: Mock data, useful for development and testing before backend integration is complete.
    *   `stagewise.js`: (Purpose unclear without content, could be for multi-stage forms or processes).
    *   `toast.ts`: Utility functions or configurations related to toast notifications.
    *   `colors.ts`: Definitions or mappings for color palettes.
*   **`/public/`**: Static assets accessible directly via URL (e.g., images, fonts, favicons).
*   **`/services/`**: Modules responsible for making API calls to the backend server.
    *   `base-api.ts`: Base Axios instance configuration, including interceptors for handling authentication tokens and errors.
    *   `auth-service.ts`: Handles login, signup, logout, profile updates, wallet linking.
    *   `session-service.ts`: Manages session creation, fetching sessions, casting votes, candidate applications.
    *   `team-service.ts`: Handles team creation, fetching teams, managing invitations.
    *   `task-service.ts`: Manages tasks for team members.
    *   `notification-service.ts`: Fetches and manages user notifications.
    *   `kyc-service.ts`: Interacts with the backend's KYC endpoints, which in turn communicates with the Python KYC service.
    *   `candidate-service.ts`: Manages candidate-specific operations.
    *   `blockchain-service.ts`: Likely interacts with backend endpoints that then communicate with the blockchain. This might include preparing transactions or fetching on-chain data.
    *   `metamask-service.ts`: Specific functions for interacting with MetaMask (e.g., connecting wallet, signing transactions/messages if not relayed by backend).
    *   `/abi/`: Contains ABI (Application Binary Interface) files for smart contracts, used by `blockchain-service.ts` or `metamask-service.ts` if frontend interacts directly with contracts (less likely given the backend structure but possible for some read operations or client-side signing).
    *   `index.ts`: Exports all service modules for easy importing.
    *   `README.md`: (Already read) Details the service layer structure and usage.
*   **`/types/`**: Global or shared TypeScript type definitions.
*   **`package.json`**: Project metadata, scripts (e.g., `dev`, `build`, `start`, `lint`), and dependencies (Next.js, React, Tailwind, Shadcn UI, Axios, etc.).
*   **`pnpm-lock.yaml`**: PNPM lock file for consistent dependency installation.
*   **`tsconfig.json`**: TypeScript compiler options.
*   **`next.config.ts`**: Next.js configuration file (e.g., redirects, rewrites, environment variables, image optimization).
*   **`postcss.config.mjs`**: PostCSS configuration (used by Tailwind CSS).
*   **`eslint.config.mjs`**: ESLint configuration for code linting.
*   **`components.json`**: Configuration file for Shadcn UI, defining alias for components and utils.
*   **`.gitignore`**: Specifies files to be ignored by Git.

## Key Features and Flows

### 1. User Authentication
*   Users can sign up and log in via forms (`/components/auth/`).
*   `auth-service.ts` handles API calls to the backend.
*   Authentication state is likely managed using a React Context or a state management library (e.g., Zustand, Redux Toolkit).
*   JWT tokens received from the backend are stored (e.g., in localStorage) and attached to subsequent API requests by the `base-api.ts` interceptor.
*   Protected routes redirect unauthenticated users to the login page.

### 2. Role-Based Dashboards
*   After login, users are directed to their respective dashboards based on their roles (Team Leader, Team Member, Voter, Candidate).
*   The UI and available actions differ significantly per role.
*   These are likely implemented under the `/app/(users)/` route group.

### 3. Session Management
*   **Team Leaders/Members:**
    *   Can create new voting sessions through a dedicated interface (`/app/session-setup/` and `/components/session-creation/`).
    *   `session-service.ts` and potentially `blockchain-service.ts` (via backend) are used to create sessions both in the DB and on the blockchain.
    *   Can manage existing sessions (view status, participants, results).
*   **Voters:**
    *   View a list of available/active sessions in their portal (`/components/voter-portal/`).
    *   Can view session details (`/components/session-detail/`).
    *   Cast votes, which involves interaction with `session-service.ts` and `metamask-service.ts` (if client-side signing is used for vote transactions, or if wallet connection is needed to identify the voter to the backend).
*   **Candidates:**
    *   Can view sessions open for nomination.
    *   Can apply for candidacy using `candidate-service.ts`.
    *   View the status of their applications.

### 4. Team Management (Team Leaders)
*   `team-service.ts` is used for creating teams, inviting members, and managing team roles.
*   UI components are likely found in `/components/team-manager/`.

### 5. KYC Process
*   Users (voters/candidates) requiring KYC will be guided through a process.
*   This might involve uploading documents using `components/file-uploader.tsx`.
*   `kyc-service.ts` handles API calls to the backend endpoint that interfaces with the Python KYC microservice.

### 6. Notifications
*   Users receive real-time or polled notifications for important events.
*   `notification-service.ts` and `use-notifications.tsx` hook manage fetching and displaying these.
*   UI for notifications could be a dropdown or a dedicated page.

### 7. Wallet Interaction (MetaMask)
*   `metamask-service.ts` handles connecting to the user's MetaMask wallet.
*   Used for: 
    *   Identifying the user's blockchain address (linking to their profile).
    *   Potentially signing transactions or messages if the architecture requires client-side signing (e.g., for voting if gas fees are not relayed by the backend).
    *   Displaying wallet information.

## State Management

*   Given the use of hooks, React Context is likely used for global state (e.g., authentication, theme).
*   For more complex client-side state, a dedicated library (Zustand, Jotai, Redux Toolkit) might be employed, or SWR/React Query for server state management and caching API responses.

## Styling

*   **Tailwind CSS** is the primary utility-first CSS framework.
*   **Shadcn UI** provides pre-built, accessible, and customizable components, which are styled with Tailwind CSS.
*   Global styles and Tailwind configurations are in `app/globals.css` and `tailwind.config.js` (or `.mjs`).

## Building and Deployment

*   `pnpm run dev`: Starts the Next.js development server.
*   `pnpm run build`: Builds the application for production.
*   `pnpm run start`: Starts the production server after a build.
*   Deployment is typical for a Next.js application (e.g., Vercel, Netlify, AWS Amplify, or a custom Node.js server).

This documentation should provide a good starting point for understanding the frontend architecture of the Vote System. 