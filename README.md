# ReLoop AI — Identify. Recycle. Reward.

A college/hackathon MVP: Next.js + TypeScript + Tailwind frontend, Express REST API, MongoDB/Mongoose persistence, JWT auth, and Ollama vision inference. It never silently fakes an AI response. If Ollama is unavailable, the API returns a clear error.

## Requirements
- Windows 10/11, Node.js 20+ (22 recommended), npm
- MongoDB local or MongoDB Atlas
- Ollama installed locally and a vision-capable model pulled (example: `ollama pull llama3.2-vision`; check Ollama's current model library for availability/requirements)
- Optional: a text model such as Gemma for future separate text reasoning; the current analyzer uses the configured vision model directly.

## Setup (Windows + VS Code)
1. Extract `reloop-ai.zip`, open the `reloop-ai` folder in VS Code.
2. Copy root `.env.example` to `backend/.env` and edit `MONGODB_URI`, `JWT_SECRET`, and model settings. Keep secrets out of frontend `.env` files.
3. Start MongoDB (or create an Atlas database and paste its URI).
4. In VS Code terminal:
   ```powershell
   cd backend
   npm install
   npm run dev
   ```
5. In a second terminal:
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```
6. Open `http://localhost:3000`. Backend health: `http://localhost:4000/api/health`.
7. Start Ollama in another terminal if needed; confirm `ollama list` shows the model configured in `OLLAMA_VISION_MODEL`.

## Environment
Copy `.env.example` to `backend/.env`. `frontend/.env.local` may set `NEXT_PUBLIC_API_URL=http://localhost:4000/api` only; never put secrets there.

## Current prototype behavior
- Sign up/login with bcrypt-hashed passwords and signed JWTs.
- JWT stored in browser localStorage for MVP simplicity. For production, switch to secure, HttpOnly, SameSite cookies, CSRF protections, HTTPS, refresh/revocation strategy, and a stricter CSP.
- Image upload: JPEG/PNG/WebP, max 5 MB. Files are processed in memory and are not saved to disk.
- Live AI: Ollama `/api/chat` with an image-capable model; response JSON is validated. Errors are surfaced; there is no hard-coded fallback result.
- MongoDB models: users, analyses, actions, points transactions, centres, rewards.
- Demo rewards are labelled simulated. Demo recycling centres are seeded only when `SEED_DEMO_DATA=true`, and are clearly identified as samples—not real locations.
- Points are awarded once per analysis/action pair when an action is first recorded. Action status is `user-reported`; only an admin can mark it `verified`.
- Admin account creation is intentionally not exposed publicly. Set a user's `role: "admin"` directly in MongoDB for a trusted reviewer.
- Centre finder resolves six-digit Indian PIN codes through the India Post PIN-code lookup API and searches only centre records explicitly marked as non-sample. The lookup supplies location details, not recycling-centre listings; when no real centre records are available, the finder shows an empty state.

## API summary
All JSON errors use `{ "error": "message" }`. Protected endpoints require `Authorization: Bearer <token>`.

- `GET /api/health`
- `POST /api/auth/signup` `{name,email,password}`
- `POST /api/auth/login` `{email,password}`
- `GET /api/dashboard`
- `POST /api/analyze` multipart form field `image`
- `GET /api/analyses`
- `POST /api/actions` `{analysisId,notes?}`
- `GET /api/recycling-centres?pincode=533003` (authenticated; resolves the PIN code and searches non-sample centres by PIN or city)
- `GET /api/recycling-centres?query=city` (authenticated; searches only non-sample centres)
- `GET /api/rewards`
- `POST /api/rewards/:id/redeem` (simulated redemption; points deducted once per request)
- `GET /api/profile`
- `GET /api/actions`
- `PATCH /api/admin/actions/:id/verify` (admin only)

## Tests and checks
From `backend`: `npm test` (unit tests for validation/reward rules), `npm run check` (syntax check). The frontend can be checked with `npm run build` after dependencies install. The generation environment may not have network access to install npm packages; run these commands locally if installation was unavailable.

## Government / municipal integration — future scope
No government partnership or approval is claimed. Real integration would require written authorisation, documented APIs, data-processing agreements, security review, minimal data collection, consent/retention policies, and audit logs. Do not collect Aadhaar numbers. Independently verify all collection-centre details before relying on them.
