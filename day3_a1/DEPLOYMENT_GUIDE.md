# Deployment Guide - Aegis Recruit

This guide provides step-by-step instructions for deploying the **Aegis Recruit** system to a production environment.

## 🏗️ Recommended Architecture
Since this is a decoupled application (FastAPI + Next.js), we recommend the following:
- **Frontend**: Vercel
- **Backend**: Render, Railway, or AWS Lambda
- **Observability**: LangSmith

---

## 1. Backend Deployment (e.g., Render)

### Steps:
1.  **Repository Setup**: Ensure your project is pushed to GitHub.
2.  **Create Web Service**: In Render, create a new "Web Service" and link your repository.
3.  **Root Directory**: Set this to `backend/`.
4.  **Runtime**: Select `Python 3`.
5.  **Build Command**: `pip install -r requirements.txt`
6.  **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
7.  **Environment Variables**:
    - `GROQ_API_KEY`: [Your Groq Key]
    - `LANGSMITH_API_KEY`: [Your LangSmith Key]
    - `LANGCHAIN_TRACING_V2`: `true`
    - `LANGCHAIN_PROJECT`: `recruitment-production`

---

## 2. Frontend Deployment (Vercel)

### Steps:
1.  **Framework Preset**: Next.js
2.  **Root Directory**: `frontend/`
3.  **Environment Variables**:
    - `NEXT_PUBLIC_API_URL`: The URL of your deployed Backend (from Step 1).
4.  **Deployment**: Vercel will automatically detect the configuration and deploy.

> [!IMPORTANT]
> Ensure you update the API URL in `frontend/app/page.tsx` to use the environment variable:
> ```javascript
> const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
> ```

---

## 📈 Monitoring & Tracing
Once deployed, all production traffic will be visible in your **LangSmith** dashboard. This allows you to:
- Monitor token usage and costs.
- Inspect failed agent steps.
- Export traces for further fine-tuning.

---

## 🔐 Security Considerations
- **CORS**: In `backend/main.py`, update `allow_origins=["*"]` to only include your Vercel URL.
- **Rate Limiting**: Implementation of Redis-based rate limiting is recommended for production scaling.
