# Project Overview: Votex - Voting System

This document provides a high-level overview of the Votex project, based on analysis of its file structure and key configuration files.

## 1. Project Description

Votex appears to be a comprehensive web application designed as a voting system. It features a landing page, user authentication, different user roles (Team Leader, Team Member, Voter), session management, payment/subscription features, and real-time monitoring capabilities.

## 2. Technology Stack

### Frontend:
*   **Framework:** Next.js (v15.3.0) with React (v19)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS (v4.1.4) with PostCSS & Autoprefixer
*   **UI Components:** Primarily Shadcn UI (built on Radix UI primitives), with additional libraries like `@remixicon/react`, `@tabler/icons-react`, `lucide-react`.
*   **State Management/Routing:** Likely Next.js App Router, potentially supplemented by context or other state management libraries if needed (not explicitly identified in scanned files). TanStack Router is listed as a dependency but usage context is unclear from scanned files.
*   **Forms:** React Hook Form with Zod for validation.
*   **Charts:** Recharts
*   **Animation:** Framer Motion, `@devnomic/marquee`
*   **Real-time:** Likely uses Socket.IO client to connect to the backend.
*   **Other:** `next-themes` (theming), `date-fns` (date utilities), `axios` (HTTP client), `sonner` (toasts), `nextjs-toploader` (loading bar).

### Backend:
*   **Framework:** Express.js
*   **Language:** JavaScript (Node.js)
*   **Database:** MongoDB (connected locally at `mongodb://127.0.0.1:27017/votex`) with Mongoose ODM.
*   **Authentication:** JWT (JSON Web Tokens) with bcrypt for password hashing.
*   **Validation:** Joi
*   **Real-time:** Socket.IO for WebSocket communication.
*   **API:** RESTful API structure, likely defined in `server/routes/` and consumed by the frontend via services in `api/`.
*   **Other:** `cors`, `dotenv`, `config`.

### Development & Tooling:
*   **Package Manager:** pnpm (inferred from `pnpm-lock.yaml`)
*   **Linting:** ESLint configured for Next.js.
*   **Dev Server:** `nodemon` for backend hot-reloading.
*   **Build:** Next.js build process (`next build`).

## 3. Project Structure Highlights

*   **`app/`:** Contains the Next.js App Router structure.
    *   **`(auth)/`:** Routes for login, sign-up, forgot/reset password.
    *   **`payment/`:** Payment processing page.
    *   **`session-setup/`:** Page for setting up voting sessions.
    *   **`subscription/`:** Subscription management page.
    *   **`team-leader/`:** Routes specific to the Team Leader role (monitoring, scheduler, session management, support, team).
    *   **`team-member/`:** Routes/pages for Team Members.
    *   **`voter/`:** Routes/pages for Voters.
    *   **`layout.tsx`:** Root layout, includes ThemeProvider and global styles.
    *   **`page.tsx`:** Main landing page, composed of various sections.
*   **`components/`:** Contains reusable React components.
    *   **`auth/`:** Authentication-related components.
    *   **`event-calendar/`:** Components for a drag-and-drop event calendar.
    *   **`landing-page/`:** Components specific to the landing page sections.
    *   **`magicui/`:** Specialized UI components (e.g., animated grid, globe).
    *   **`monitoring/`:** Components for the real-time monitoring dashboard (charts, lists).
    *   **`session-profile/`:** Components for managing/viewing session details.
    *   **`setup-form/`:** Components for the multi-step session setup form.
    *   **`shadcn-ui/`:** Core UI components (likely generated/managed by Shadcn CLI).
    *   **`sidebar/`, `team-manager/`, `user-settings/`, `voter-portal/`:** Role/feature-specific components.
*   **`api/`:** Frontend services for interacting with the backend API (`user-service`, `team-service`, `session-service`).
*   **`lib/`:** Utility functions, type definitions (`api.d.ts`, `types.ts`), mock data.
*   **`hooks/`:** Custom React hooks.
*   **`public/`:** Static assets (images, fonts, logos).
*   **`server/`:** Contains the backend Express.js application.
    *   **`index.js`:** Backend server entry point (DB connection, Express setup, Socket.IO setup).
    *   **`models/`:** Mongoose schemas/models.
    *   **`routes/`:** Express API route definitions.
    *   **`middleware/`:** Custom Express middleware.
    *   **`startup/`:** Initialization logic (e.g., loading routes).
    *   **`utils/`:** Backend utility functions.
    *   **`validation/`:** Joi validation schemas.

## 4. Key Features (Inferred)

*   User Authentication (Login, Sign Up, Password Reset)
*   Role-Based Access Control (Team Leader, Team Member, Voter)
*   Voting Session Creation & Management
*   Real-time Vote Monitoring Dashboard (Vote counts, distribution charts)
*   Event Scheduling/Calendar Functionality
*   Team Management
*   Subscription/Payment System Integration
*   Landing Page with Feature Showcases, Pricing, FAQ, Contact
*   Light/Dark Theme Support

## 5. Configuration Notes

*   **Frontend:** Runs on port 3000 by default (`npm run dev`). Configured to use Cloudinary for images.
*   **Backend:** Runs on port 2000 by default (`npm run server` or `npm run backend:start`), increments port if 2000 is busy. Connects to MongoDB at `mongodb://127.0.0.1:27017/votex`. Uses Socket.IO for real-time updates.

## 6. Potential Next Steps for Deeper Analysis

*   Examine specific route handlers in `server/routes/` to understand API logic.
*   Analyze Mongoose models in `server/models/` for data structures.
*   Review components in `components/` subdirectories for specific UI implementations.
*   Investigate the usage of `socket.io` on both client and server for real-time data flow.
*   Read `server/README-SESSION-INTEGRATION.md` for specific details on session integration.
