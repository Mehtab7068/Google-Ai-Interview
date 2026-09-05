# Google-Ai-Interview

AI-powered technical interview practice with text, code, and voice answers.

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
