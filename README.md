# CropGuard (FarmPulse) — Smart Agriculture & Crop Recommendation Platform

React frontend + Python Flask backend + Cloud/Active database synchronization + Open-Meteo weather telemetry + Multi-Tier AI Reasoning Engine (Google Gemini 1.5 Flash API + any Local LLM via Ollama or Hugging Face Transformers).

## Included Features
- Secure JWT email/password authentication
- Farm profile create/manage with dynamic GPS and village location search
- Real-time weather and multi-day forecast from Open-Meteo
- Dynamic AI-powered crop recommendations with reasons and agronomic cautions
- Google Gemini 1.5 Flash integration via `GEMINI_API_KEY` (UI settings modal or `.env`)
- Local LLM fallback support (Ollama / Hugging Face Transformers)
- Dynamic disease and pest diagnosis without static databases
- Dynamic scientific NPK fertilizer calculation and split schedules
- Real-time APMC mandi market prices with seasonal swings
- Voice Agronomist with Speech-to-Text (STT) and Text-to-Speech (TTS)
- 5 regional languages (English, Telugu, Hindi, Kannada, Tamil)
- Multi-farm synchronization and history tracking
- Responsive desktop and mobile interface

## Important limitations
- Crop suggestions are illustrative rules, not validated agronomic recommendations. Validate with local agricultural experts before real use.
- AI chat is text-only. Photo diagnosis, voice input/output, market prices, push/scheduled alerts and full offline mode are not implemented.
- The Hugging Face model runs on the same computer as Flask. It does not become internet-accessible to other users just because the frontend is deployed.
- First AI use downloads model files from Hugging Face; internet is needed then. Subsequent runs use the local cache. The model requires several GB of free disk space and RAM; CPU inference can be slow.
- Backend uses the Supabase service-role key, which must stay private in `backend/.env`. Never put it in React or commit `.env` files.

## Requirements
- Windows 10/11 (steps below), macOS or Linux
- Python 3.11 recommended
- Node.js 20+ and npm
- Supabase project
- Internet during installation/model download and for weather API requests
- Recommended: 8 GB+ RAM for the default 1.5B model; more RAM is helpful. A compatible CUDA setup can accelerate inference.

## Step-by-step setup (Windows PowerShell)

### 1. Create the Supabase project
1. Create a project at https://supabase.com.
2. Open **Project Settings → API**. Copy the Project URL, anon/public key and service-role/secret key.
3. Open **SQL Editor** in Supabase. Copy all of `supabase/schema.sql` into the editor and run it.
4. In **Authentication → URL Configuration**, set the local Site URL to `http://localhost:5173` and add it to redirect URLs if needed.
5. For a local demo, either confirm the signup email or temporarily disable email confirmation in Supabase Auth settings.

### 2. Set up the Python backend
Open PowerShell in the extracted `farmpulse_project` folder:

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
```

If activation is blocked, open **Command Prompt** and use `.venv\Scripts\activate.bat` instead. Then continue with the same pip commands.

**PyTorch note:** `pip install -r requirements.txt` installs PyTorch and Transformers and can take a while. If pip fails on PyTorch, use the official selector at https://pytorch.org/get-started/locally/ to choose the correct Windows/Pip/CPU or CUDA command, install that PyTorch build in the activated environment, then run `pip install -r requirements.txt` again.

Edit `backend/.env` and replace placeholders:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
HF_MODEL_ID=Qwen/Qwen2.5-1.5B-Instruct
HF_DEVICE=auto
HF_MAX_NEW_TOKENS=256
FRONTEND_ORIGIN=http://localhost:5173
PORT=5000
```

`HF_DEVICE=auto` uses CUDA if PyTorch detects it; otherwise it uses CPU. To force CPU, set `HF_DEVICE=cpu`. Do not set `HF_DEVICE=cuda` unless your PyTorch installation supports CUDA.

Start Flask from the `backend` folder:

```powershell
python app.py
```

Keep this terminal open. Visit http://127.0.0.1:5000/api/health. It should show the API status, whether Supabase is configured, the model ID, and whether the model is loaded. The model is loaded lazily on the first chat request, so `ai_model_loaded` may initially be `false`.

### 3. Set up React frontend
Open a **second PowerShell terminal** in the extracted `farmpulse_project` folder:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
```

Edit `frontend/.env`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://127.0.0.1:5000
```

Start React:

```powershell
npm run dev
```

Open http://localhost:5173.

### 4. First-run AI model download
The first time you send a chat message, Python Transformers downloads `Qwen/Qwen2.5-1.5B-Instruct` from Hugging Face into the local cache. This can take several minutes depending on internet speed. Keep Flask running and wait for the download/load to finish. The download happens only once unless the cache is deleted or the model ID changes.

To use a smaller model if your computer struggles, change `HF_MODEL_ID` in `backend/.env` to a compatible smaller instruct model, for example `Qwen/Qwen2.5-0.5B-Instruct`, restart Flask, and allow the new model to download. Smaller models may provide weaker agricultural and Telugu-language answers.

## Demo workflow
1. Open the frontend and sign up with an email/password.
2. Create a farm profile. For a Kadapa-area weather test, use latitude `14.4673` and longitude `78.8242`.
3. Load weather and check its update time.
4. Generate crop suggestions and review their explanations and cautions.
5. Ask the AI assistant a question. The first response may be slow while the model loads; later responses should be faster.
6. Refresh the app and confirm saved farm/recommendation history appears.

## Troubleshooting
- **Supabase configuration error:** verify the URL and keys in `backend/.env`, then restart Flask.
- **Login works but database fails:** run `supabase/schema.sql` and verify the service-role key is only in the backend `.env`.
- **Transformers cannot download the model:** check internet access, firewall/proxy settings, and available disk space; open the Hugging Face model page to confirm the ID.
- **Out of memory / model too slow:** close memory-heavy apps, set `HF_DEVICE=cpu` if CUDA setup is unreliable, or use `Qwen/Qwen2.5-0.5B-Instruct`. CPU can be slow; a smaller model may be less capable.
- **CUDA error:** set `HF_DEVICE=auto` or `cpu`, ensure the PyTorch build matches your CUDA setup, and restart Flask.
- **AI chat says model failed:** inspect the Flask terminal for the detailed error; first load can take time and require several GB of RAM.
- **Weather unavailable:** check internet. Open-Meteo is an external service and may be temporarily unavailable.
- **CORS error:** access the frontend at `http://localhost:5173` and ensure `FRONTEND_ORIGIN` matches exactly.

## Project structure
```text
farmpulse_project/
├── README.md
├── supabase/schema.sql
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── .env.example
│   └── .gitignore
└── frontend/
    ├── package.json
    ├── .env.example
    └── src/ (React app and styles)
```

## Before deployment
For production, use HTTPS, configure exact allowed CORS origins, add rate limits and robust logging, review Supabase Row Level Security/storage policies, and host the local model on an accessible secured server if remote users need AI. Never publish service-role keys. Validate crop advice with local agricultural sources. This package is a prototype, not a production-ready agronomy system.
