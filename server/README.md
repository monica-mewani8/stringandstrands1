# Strings & Strands — Backend Server

Express API server handling payments, shipping, and emails securely.

## Setup

```bash
cd server
npm install
cp .env.example .env   # then fill in your real keys
```

## Environment Variables

| Variable | Where to get it |
|---|---|
| `SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API (⚠️ keep secret) |
| `RAZORPAY_KEY_ID` | Razorpay Dashboard → Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | Razorpay Dashboard → Settings → API Keys (⚠️ keep secret) |
| `SHIPROCKET_EMAIL` | Your Shiprocket login email |
| `SHIPROCKET_PASSWORD` | Your Shiprocket login password |
| `RESEND_API_KEY` | Resend Dashboard → API Keys |
| `OWNER_EMAIL` | Email address to receive new order notifications |
| `FRONTEND_URL` | `http://localhost:5173` locally, your domain in production |
| `PORT` | Default: `3001` |

## Running

```bash
# Development (auto-restarts on file change — Node 18+)
npm run dev

# Production
npm start
```

## API Routes

| Method | Route | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/api/payment/create-order` | Create Razorpay order |
| POST | `/api/payment/verify` | Verify payment signature & mark order paid |
| POST | `/api/shipping/create` | Create Shiprocket shipment |
| GET | `/api/shipping/track/:orderId` | Track shipment |
| POST | `/api/email/order-confirmation` | Send order confirmation email |

## Project Structure

```
server/
├── index.js          ← Main Express server (all routes)
├── package.json      ← Backend dependencies (separate from frontend)
├── .env              ← Your real secrets (git-ignored)
└── .env.example      ← Template for onboarding
```

> ⚠️ The `server/` folder has its own `package.json`. Run `npm install` inside `server/` separately from the root frontend install.
