# Cyberify KB

Full-stack knowledge base scaffold with a FastAPI backend, PostgreSQL storage, Tortoise ORM models, LangChain-based ingestion, vector search, JWT auth, and a React + Tailwind frontend.

## Structure

- `app/` FastAPI backend
- `frontend/` React application
- `migrations/` Aerich migration folder

## Backend setup

```bash
cd /home/zaunair/Chatbot_2/cyberify-kb
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Frontend setup

```bash
cd /home/zaunair/Chatbot_2/cyberify-kb/frontend
npm install
npm run dev
```

## Environment

The backend reads settings from `.env`.

- `DATABASE_URL` points to the `cyberify_kb` PostgreSQL database.
- `SECRET_KEY` signs JWT access tokens.
- `FASTEMBED_MODEL` controls the embedding backend; if it cannot load, the app falls back to a lightweight hashed embedding.

## API endpoints

- `POST /auth/register`
- `POST /auth/login`
- `POST /documents/upload`
- `POST /ask`
- `GET /health`

## Notes

- PDFs and TXT files are supported for ingestion.
- FastEmbed is used first for embeddings, with Hugging Face embeddings as a fallback.
- The frontend stores the JWT in local storage and protects the dashboard route.