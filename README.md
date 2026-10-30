# Google-Ai-Interview

AI-powered technical interview practice with text, code, and voice answers.

## Live Application

Use the deployed application here: [https://google-ai-interview.vercel.app/](https://google-ai-interview.vercel.app/)

## Project Phases

### Phase 1: Project Setup

- Created the React/Vite frontend, Express backend, and FastAPI AI service.
- Added MongoDB connection, environment-based configuration, and shared deployment configuration.

### Phase 2: Authentication

- Added email/password registration and login.
- Added Google OAuth login.
- Protected dashboard, profile, interview, and review routes.
- Added dynamic navigation with Login/Register for guests and Logout for authenticated users.

### Phase 3: Interview Workspace

- Added role, seniority, interview type, and question-count selection.
- Added AI-generated interview questions.
- Added coding editor support for multiple programming languages.
- Added session progress tracking and interview review pages.

### Phase 4: Voice Interviews

- Added browser microphone recording with WebM/Opus support.
- Added server-side audio upload validation and temporary-file cleanup.
- Added audio conversion to mono 16 kHz WAV for reliable transcription.
- Added transcription retries for temporary AI service failures.

### Phase 5: AI Evaluation

- Added technical and confidence scoring.
- Added structured AI feedback and ideal answers.
- Added handling for empty, invalid, or irrelevant answers.
- Added retry and rate-limit handling for Gemini requests.

### Phase 6: Production Deployment

- Deployed the frontend on Vercel.
- Configured backend and AI services for Render deployment.
- Added FFmpeg support for audio conversion.
- Added CORS restrictions, Helmet security headers, upload limits, API throttling, and lazy-loaded frontend routes.

### Phase 7: Future Improvements

- Add automated end-to-end tests for authentication and complete voice interviews.
- Add background job queues for high-volume AI requests.
- Add analytics dashboards for long-term interview progress.
- Add mock/demo mode for testing without consuming AI API quota.

The frontend includes persistent Light and Dark display modes, plus animated page transitions and motion-aware styling.

## Local Setup

### AI service

```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Set secrets through local `.env` files or the deployment provider. Never commit real values.

### `ai-service/.env`

```env
AI_SERVICE_PORT=8000
GEMINI_API_KEY=your_gemini_key
```

### `backend/.env`

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
AI_SERVICE_URL=http://localhost:8000
ASSEMBLYAI_API_KEY=your_assemblyai_key
GEMINI_API_KEY=your_gemini_key
```

### `frontend/.env`

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

## Render Deployment

Deploy the services from `render.yaml`. Configure the `sync: false` variables in the Render dashboard for each service. The AI service needs `GEMINI_API_KEY`; the backend needs MongoDB, JWT, AssemblyAI, and Gemini credentials.

The backend validates audio uploads, limits them to 10 MB, and applies API/AI request limits. The frontend lazy-loads the interview workspace to keep the initial bundle smaller.

## Security Checklist

- Rotate any API key that has been exposed in chat, logs, or commits.
- Keep `.env` files ignored by Git.
- Restrict `allowedOrigins` in `backend/server.js` to the deployed frontend and local development URLs.
- Review `npm audit` results before production releases.
