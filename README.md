# ReLoop AI — Identify. Recycle. Reward. ♻️

ReLoop AI is a college hackathon MVP that uses AI to identify waste from uploaded images, provide recycling guidance, track recycling actions, and offer a simulated rewards experience.

The project uses Next.js, TypeScript, Tailwind CSS, Express, MongoDB, JWT authentication, and Ollama for local AI inference.

**Primary AI goal: Integrate Gemma 4 through Ollama for image-based waste identification**, provided the selected Gemma 4 model variant supports vision and is available in the installed Ollama environment. The application must never silently fabricate an AI response or pretend that a model is running when it is not.

---

## 1. Technology Stack

### Frontend
- Next.js
- TypeScript
- Tailwind CSS
- Responsive user interface

### Backend
- Node.js
- Express.js REST API
- MongoDB
- Mongoose
- JWT authentication
- bcrypt password hashing

### AI Integration
- Ollama for local model inference
- Gemma 4 as the intended primary AI model
- A compatible vision-capable model is required for image-based waste identification
- JSON response validation and explicit error handling

### Development Environment
- Windows 10/11
- Node.js 20+ (Node.js 22 recommended)
- npm
- Visual Studio Code
- MongoDB local installation or MongoDB Atlas

---

## 2. AI Model — Gemma 4

Gemma 4 is the intended primary AI model for ReLoop AI.

The application is designed to send uploaded waste images to a locally running Ollama model and use the model's response to identify waste materials and provide relevant recycling guidance.

### Important compatibility requirement

Before integrating Gemma 4, verify its exact model identifier, availability, hardware requirements, and image-input support using the current Ollama model library and the installed Ollama version.

Do not assume that a model identifier such as `gemma4` exists or that every Gemma variant supports vision.

If the selected Gemma 4 variant does not support image input through Ollama, use a verified vision-capable model as a temporary alternative. Clearly document which model is active.

The application must not claim that Gemma 4 is performing image analysis unless that integration has been verified.

### AI workflow

1. The user uploads a waste image through the frontend.
2. The frontend sends the image to the Express backend.
3. The backend validates the image format and file size.
4. The backend forwards the image to the configured Ollama vision model.
5. The model analyzes the image and returns a structured response.
6. The backend validates the response before sending it to the frontend.
7. The frontend displays the classification, material information, recycling guidance, and other supported analysis fields.
8. If inference fails, the application displays a clear error instead of inventing a classification.

---

## 3. Project Structure

The project uses separate frontend and backend applications.

```text
reloop-ai/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── public/
│   ├── package.json
│   ├── next.config.ts
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── services/
│   │   └── ...
│   ├── package.json
│   ├── .env
│   └── ...
│
├── .env.example
└── README.md
```

The exact internal structure may vary depending on the implementation.

---

## 4. Prerequisites

Install the following before running the project:

1. Node.js 20 or later.
2. npm.
3. MongoDB Community Server or a MongoDB Atlas database.
4. Ollama.
5. A verified vision-capable model available through Ollama.
6. Visual Studio Code.

Gemma 4 is the intended AI model. Confirm that the selected model is available and supports image input before using it for waste classification.

The model's hardware requirements depend on its variant and configuration. Ensure sufficient RAM, disk space, and, where applicable, GPU resources.

---

## 5. Install and Configure Gemma 4

### Step 1: Verify Ollama

Open a terminal in VS Code or PowerShell.

```powershell
ollama --version
```

### Step 2: Check installed models

```powershell
ollama list
```

### Step 3: Verify Gemma 4 availability

Consult the current Ollama model library and confirm the exact model identifier and whether the selected variant supports vision.

Do not use an assumed model name without verification.

### Step 4: Download the verified model

Replace the placeholder below with the exact supported identifier.

```powershell
ollama pull <exact-model-name>
```

### Step 5: Test the model

```powershell
ollama run <exact-model-name>
```

Confirm that the model runs successfully. Exit the interactive session when finished.

For ReLoop AI image analysis, also verify that the chosen model can accept image inputs through Ollama's supported API.

### Step 6: Configure the backend

Set the model identifier in `backend/.env`:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_VISION_MODEL=<exact-model-name>
```

The value of `OLLAMA_VISION_MODEL` must match the installed model identifier.

**Note:** Gemma 4 is the intended primary model, but its availability and vision compatibility must be verified in the actual development environment.

---

## 6. Environment Configuration

Create `backend/.env` using `.env.example` as a reference.

Example:

```env
PORT=4000
NODE_ENV=development

MONGODB_URI=mongodb://127.0.0.1:27017/reloop_ai

JWT_SECRET=replace_with_a_long_random_secret

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_VISION_MODEL=<exact-model-name>

SEED_DEMO_DATA=false
```

Replace the example MongoDB URI if using MongoDB Atlas.

Replace the JWT secret with a strong, randomly generated secret. Never commit real credentials or secrets to GitHub.

If the backend uses additional environment variables, configure them according to its implementation.

### Frontend environment

Create `frontend/.env.local` only if needed:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

Never put MongoDB credentials, JWT secrets, or other private backend configuration in frontend environment variables prefixed with `NEXT_PUBLIC_`.

---

## 7. MongoDB Setup

### Option A: Local MongoDB

1. Install MongoDB Community Server.
2. Start the MongoDB service.
3. Configure the backend connection string:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/reloop_ai
```

### Option B: MongoDB Atlas

1. Create an Atlas cluster.
2. Create a database user.
3. Configure the permitted network access.
4. Copy the database connection URI.
5. Place it in `backend/.env`.

The application uses Mongoose to persist user accounts, analyses, recycling actions, points transactions, recycling centres, and rewards.

---

## 8. Run ReLoop AI Locally

### Step 1: Open the project

Extract `reloop-ai.zip` and open the `reloop-ai` directory in Visual Studio Code.

### Step 2: Configure the backend

Make sure `backend/.env` contains valid MongoDB, JWT, and Ollama settings.

### Step 3: Start MongoDB

Ensure the local MongoDB service is running, or confirm that your Atlas database is accessible.

### Step 4: Start Ollama

Ensure Ollama is running and the configured vision model is installed.

Check the model list:

```powershell
ollama list
```

### Step 5: Start the backend

Open the first VS Code terminal:

```powershell
cd backend
npm install
npm run dev
```

The backend is expected to run on:

```text
http://localhost:4000
```

### Step 6: Start the frontend

Open a second VS Code terminal:

```powershell
cd frontend
npm install
npm run dev
```

The frontend is expected to run on:

```text
http://localhost:3000
```

### Step 7: Open the application

Visit:

```text
http://localhost:3000
```

Check backend health:

```text
http://localhost:4000/api/health
```

The health endpoint should confirm the API's health. Do not interpret a successful health response as proof that AI inference is working; test the actual image-analysis endpoint separately.

---

## 9. Authentication

ReLoop AI supports:

- User signup.
- User login.
- bcrypt password hashing.
- JWT-based authentication.
- Protected API endpoints.
- User-specific dashboard and profile information.

For this MVP, JWTs are stored in browser `localStorage`.

This is a development-oriented simplification, not the preferred production security design.

For production, consider secure HttpOnly cookies, appropriate SameSite settings, CSRF protections where applicable, HTTPS, token expiration and revocation strategies, rate limiting, and a stricter Content Security Policy.

---

## 10. AI Waste Image Analysis

### Supported image formats

- JPEG
- PNG
- WebP

Maximum upload size: 5 MB.

Images are processed in memory and are not intentionally saved to disk by the image-upload flow.

### Analysis process

1. The user uploads a waste image.
2. The backend validates the file.
3. The backend submits the image to the configured vision-capable Ollama model.
4. The model generates a response based on the image.
5. The backend validates the response format.
6. The frontend displays the analysis.

### AI reliability rules

- Never return a hard-coded waste classification as if it came from the AI.
- Never silently switch models after an inference failure.
- Return a clear error when Ollama is unavailable.
- Return a clear error when the configured model is missing.
- Report unsupported image input instead of pretending analysis succeeded.
- Validate model output before using it.
- Handle malformed JSON and inference timeouts safely.
- Do not claim certainty when the image does not provide enough information.

The exact output fields depend on the implemented response schema. They may include the waste category, material type, recyclability, disposal guidance, and a confidence estimate if supported by the model and response contract.

A model-generated confidence value must not automatically be treated as a calibrated probability.

---

## 11. Dashboard and Recycling Actions

The dashboard provides access to user-specific information supported by the backend, including:

- Analysis history.
- Recycling actions.
- Points balance.
- Available rewards.
- Profile information.

Users can record a recycling action associated with an analysis.

An action initially has the status `user-reported`. Only an authorized administrator can mark it as `verified`.

Recording an action does not prove that the physical recycling activity occurred.

Points are awarded once per analysis/action pair when the action is first recorded, according to the backend's implemented reward rules.

---

## 12. Rewards System

The project includes a demo rewards experience.

- Rewards are stored in MongoDB.
- Redemption is simulated.
- Points are deducted according to the backend's redemption logic.
- Demo rewards must be clearly labelled as simulated.
- A simulated redemption must never be presented as a real-world purchase or payment.

The backend must enforce point balances and prevent unauthorized users from redeeming rewards on another user's behalf.

---

## 13. Recycling Centre Finder

The recycling centre finder accepts an Indian six-digit PIN code or a city search query.

For PIN-code searches, the backend uses the India Post PIN-code lookup API to resolve location details.

The PIN-code lookup provides postal location information. It does not establish that a recycling centre exists at that location.

The application searches MongoDB for centre records explicitly marked as non-sample.

### Important limitations

- Sample centres are not presented as verified real centres.
- Demo data is seeded only when `SEED_DEMO_DATA=true`.
- When no real centre records match, the application shows an empty state.
- Centre information must be independently verified before users rely on it.

---

## 14. Admin Functionality

Public admin account creation is intentionally disabled.

A trusted reviewer can be assigned the administrator role directly in MongoDB.

Administrative endpoints must verify the authenticated user's role on the server. Hiding admin controls in the frontend is not sufficient authorization.

Only an authorized administrator can verify reported recycling actions.

---

## 15. API Reference

All JSON errors use the following format:

```json
{
  "error": "message"
}
```

Protected endpoints require:

```text
Authorization: Bearer <token>
```

### Health

`GET /api/health`

Checks API health.

### Authentication

`POST /api/auth/signup`

Request body:

```json
{
  "name": "Example User",
  "email": "user@example.com",
  "password": "example-password"
}
```

`POST /api/auth/login`

Request body:

```json
{
  "email": "user@example.com",
  "password": "example-password"
}
```

### Dashboard

`GET /api/dashboard`

Returns authenticated-user dashboard data.

### Image analysis

`POST /api/analyze`

Accepts multipart form data with the image field named `image`.

Requires authentication and a working configured vision model.

### Analysis history

`GET /api/analyses`

Returns analysis records for the authenticated user.

### Recycling actions

`POST /api/actions`

Request body:

```json
{
  "analysisId": "analysis-id",
  "notes": "Optional recycling notes"
}
```

`GET /api/actions`

Returns the authenticated user's recycling actions.

### Recycling centre finder

`GET /api/recycling-centres?pincode=533003`

Resolves the PIN code and searches available non-sample centre records.

`GET /api/recycling-centres?query=city`

Searches non-sample centre records by location.

Both endpoints require authentication.

### Rewards

`GET /api/rewards`

Returns available rewards.

`POST /api/rewards/:id/redeem`

Performs simulated reward redemption according to the backend's reward rules.

### Profile

`GET /api/profile`

Returns the authenticated user's profile.

### Admin verification

`PATCH /api/admin/actions/:id/verify`

Allows an authorized administrator to verify a reported recycling action.

---

## 16. Testing and Validation

Run backend tests from the `backend` directory:

```powershell
npm test
```

Run the backend syntax check:

```powershell
npm run check
```

Build the frontend from the `frontend` directory:

```powershell
npm run build
```

### Recommended manual tests

1. Create a new account.
2. Log in using the account.
3. Verify that protected endpoints reject unauthenticated requests.
4. Upload a valid image of waste.
5. Confirm that the configured vision model processes the image.
6. Confirm that the returned analysis is validated before display.
7. Stop Ollama and verify that the frontend displays an understandable error.
8. Configure an unavailable model and verify that analysis fails clearly.
9. Test invalid image formats and oversized uploads.
10. Record a recycling action and confirm that duplicate submissions do not incorrectly award points again.
11. Test reward redemption and verify that the points balance is handled correctly.
12. Confirm that sample recycling centres are never presented as verified real locations.
13. Verify that non-admin users cannot access admin-only operations.

A successful build does not by itself establish that MongoDB persistence, authentication, image inference, or rewards are working correctly.

---

## 17. Troubleshooting

### Ollama is unavailable

Check that Ollama is installed and running.

```powershell
ollama --version
ollama list
```

Verify that `OLLAMA_BASE_URL` points to the correct local Ollama endpoint.

### The configured model is missing

Compare `OLLAMA_VISION_MODEL` against the exact identifier returned by `ollama list`.

Pull the verified model if needed.

### Gemma 4 does not accept the uploaded image

Check the selected model variant and its documented vision capabilities. Use a compatible vision-capable model if the selected variant cannot process images.

Do not claim Gemma 4 image-analysis support until it has been verified in the actual environment.

### MongoDB connection fails

Verify that the MongoDB service is running, the connection string is correct, and Atlas network access is configured appropriately.

### Frontend cannot reach the backend

Confirm that the backend is running on port 4000 and that `NEXT_PUBLIC_API_URL` points to the correct API base URL.

### npm installation fails

Check the Node.js and npm versions, internet connectivity, and package compatibility.

If package installation fails because of network restrictions, retry locally when connectivity is available.

---

## 18. Security and Privacy

This is a hackathon MVP and is not automatically production-ready.

Before production deployment:

- Use HTTPS.
- Protect and rotate application secrets.
- Prefer secure HttpOnly cookie-based authentication where appropriate.
- Implement rate limiting and robust input validation.
- Restrict upload sizes and validate actual image content.
- Avoid logging passwords, JWTs, or unnecessary personal information.
- Review image-processing and retention behavior.
- Add appropriate authorization checks to every protected endpoint.
- Validate AI output before using it in application logic.
- Document limitations of AI-generated recycling advice.
- Review MongoDB access permissions and deployment configuration.

The current image flow processes uploads in memory and does not intentionally save uploaded image files to disk. Other logging, infrastructure, or monitoring behavior must be checked separately.

---

## 19. Government and Municipal Integration — Future Scope

No government partnership, municipal approval, or official integration is claimed by this prototype.

Future integrations would require:

- Written authorization.
- Documented and approved APIs.
- Appropriate data-processing agreements.
- Security and privacy reviews.
- Consent and retention policies.
- Minimal data collection.
- Audit logs.
- Independent verification of recycling-centre information.

Do not collect Aadhaar numbers for this project.

---

## 20. Future Enhancements

Potential future improvements include:

- Verified Gemma 4 integration for image-based waste identification.
- Improved material classification and recycling recommendations.
- More robust AI output validation.
- Real, verified recycling-centre listings.
- Admin workflows for recycling-action verification.
- More transparent and auditable reward rules.
- Improved accessibility and mobile responsiveness.
- Production-grade authentication and security.
- Evaluation of AI accuracy using a labelled waste-image dataset.

---

## 21. Project Goal

ReLoop AI aims to make waste identification and responsible disposal easier through locally hosted AI, transparent recycling guidance, user-reported recycling actions, and a simulated rewards system.

**ReLoop AI — Identify. Recycle. Reward. ♻️**

The intended primary AI model is Gemma 4. Actual image-analysis functionality depends on successful integration with a verified vision-capable model through Ollama.
