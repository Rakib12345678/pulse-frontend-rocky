# Pulse Live

Pulse Live is a modern, high-performance live streaming platform built with React 19, TanStack Start, and Stream SDK. It features real-time video broadcasting, interactive chat, virtual gifting, and a robust coin-based economy .

## 🚀 Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TanStack Start](https://tanstack.com/start/latest/docs/framework/react/build-from-scratch) (Full-stack React)
- **Routing**: [TanStack Router](https://tanstack.com/router) (File-based routing)
- **State Management**: 
  - [Zustand](https://docs.pmnd.rs/zustand/) (Client state: Auth, Live stores)
  - [TanStack Query](https://tanstack.com/query) (Server state)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) + [Lucide Icons](https://lucide.dev/)
- **Live Features**: [Stream IO Video & Chat SDK](https://getstream.io/)
- **Utilities**: [Axios](https://axios-http.com/), [Zod](https://zod.dev/), [React Hook Form](https://react-hook-form.com/)
- **Tooling**: [Biome](https://biomejs.dev/) (Linting & Formatting), [Vitest](https://vitest.dev/) (Testing)

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v22.18.0+)
- [pnpm](https://pnpm.io/)

### Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd pulse-live
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env` and fill in the required credentials:
   ```env
   VITE_API_URL="https://backendapi.com"
   VITE_GOOGLE_CLIENT_ID=example.apps.googleusercontent.com
   DEV="false"
   VITE_STREAM_API_KEY="abcd"
   ```

### Development

Start the development server:
```bash
pnpm dev
```
The application will be available at `http://localhost:3000`.

## 📂 Project Architecture

The project follows a **Feature-based structure** to ensure scalability and maintainability.

```text
src/
├── assets/         # Static assets (images, fonts)
├── components/     # Shared UI and Layout components
├── features/       # Domain-driven modules
│   ├── auth/       # Login, Signup, Auth stores
│   ├── chat/       # Live chat components and logic
│   ├── coins/      # Virtual currency & wallet system
│   ├── live/       # Core streaming logic & participants
│   └── profile/    # User profiles and settings
├── integrations/   # Third-party setups (e.g., TanStack Query)
├── routes/         # File-based routing (TanStack Router)
└── utils/          # Shared helper functions
```

### 🧩 Feature Internal Structure

Each feature in `src/features` is organized internally to keep it modular:

- `components/`: UI components specific to this feature.
- `services/`: API services and data fetching logic (Axios instances).
- `stores/`: Zustand stores for local state management.
- `hooks/`: Custom hooks for feature-specific logic.
- `constants/`: Static configurations and constants relevant to the feature.

## ✨ Key Features

- **Live Streaming**: Real-time video broadcasting with low latency.
- **Interactive Chat**: Real-time messaging with emoji support.
- **Virtual Gifting**: Send and receive animated gifts during streams.
- **Coin Economy**: Purchase coin packages and manage your wallet balance.
- **User Profiles**: Manage personal information and streaming history.
- **Responsive Design**: Optimized for both desktop and mobile devices.

## 📜 Available Scripts

- `pnpm dev`: Starts the development server.
- `pnpm build`: Builds the application for production.
- `pnpm test`: Runs the test suite using Vitest.
- `pnpm format`: Formats code using Biome.
- `pnpm lint`: Lints code using Biome.
- `pnpm check`: Runs both formatting and linting checks.

---
