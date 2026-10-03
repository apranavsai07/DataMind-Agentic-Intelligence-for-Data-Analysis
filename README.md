# DataMind

An autonomous, full-stack AI data analysis platform that transforms raw datasets into actionable intelligence. Upload files in multiple formats (CSV, Excel, JSON, PDF, Word), perform automated data profiling and cleaning, generate high-impact visualizations, run statistical analysis, and receive executive summaries with exportable reports.

---

## 🌟 Key Features

- **Multi-Format Data Ingestion**:
  - Structured data: `.csv`, `.xlsx`, `.xls`, `.json`
  - Unstructured documents: `.pdf`, `.docx`
- **Comprehensive Data Profiling**:
  - Structural analysis: row/column counts, missing values, duplicate detection, and data type inferences.
  - Descriptive statistics for both numeric and categorical features.
- **Autonomous Data Cleaning**:
  - Identifies anomalies, handles missing data, deduplicates rows, and casts data types.
  - Directly downloads cleaned, formatted `.csv` files.
- **Dynamic Visualizations**:
  - Auto-generated plots (bar charts, line graphs, histograms, heatmaps, scatter plots).
  - High-resolution interactive chart preview and export.
- **Conversational Multi-Turn Analysis**:
  - Ask follow-up questions about any completed analysis.
  - Quick-start prompt shortcuts (`Profile`, `Clean`, `Analyze`, `Visualize`, `Insights`, `Report`).
- **Executive Reporting & Export**:
  - Generates comprehensive markdown executive reports.
  - Client-side styled PDF generation via `jsPDF` and `html2canvas`.
- **Authentication & Workspace Persistence**:
  - Supabase authentication with Email/Password and Google OAuth 2.0.
  - User nickname onboarding and personalized greeting.
  - Cloud-persisted user preferences (default view, analysis tone, auto-scroll).
- **Dedicated Workspace Sections**:
  - **Datasets**: Browse uploaded datasets, inspect schemas, and download original source files.
  - **Recent Analyses**: Reopen previous analyses and continue discussions seamlessly.
  - **Outputs & Reports**: Access all generated artifacts, cleaned CSVs, and PDF exports.
  - **Settings**: Manage profile identity, credentials, security, and workspace preferences.

---

## 🏗️ Architecture & Technology Stack

```
DataMind
├── frontend/               # React 18 + Vite SPA
│   ├── src/
│   │   ├── api/            # Backend API clients (workspace, datasets, history)
│   │   ├── components/     # UI components (workspace, landing, panels, auth)
│   │   ├── lib/            # Supabase auth, PDF generator, utilities
│   │   └── pages/          # Workspace, Datasets, Recent Analyses, Outputs, Settings
│   └── package.json
│
└── backend/                # FastAPI + Python 3.11+ Backend
    ├── app/
    │   ├── api/routes/     # REST API routes (upload, history, datasets)
    │   ├── core/           # Configuration & environment settings
    │   ├── database/       # Supabase service client
    │   ├── parsers/        # Tabular and document file parsers
    │   ├── operations/     # Profiling, cleaning, analysis algorithms
    │   ├── graphs/         # LangGraph workflows and agent state graphs
    │   └── storage/        # Cloud dataset & output storage handlers
    ├── requirements.txt    # Python dependencies
    └── app/main.py         # Application entry point
```

### Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router 6, Vanilla CSS (Glassmorphism), jsPDF, html2canvas, Marked |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, Pydantic v2, Python-Multipart |
| **AI / Orchestration** | Google Gemini (`google-genai`), LangChain, LangGraph |
| **Data & Math** | Pandas, NumPy, OpenPyXL, PyArrow, Matplotlib, Pillow |
| **Database & Auth** | Supabase (PostgreSQL, Supabase Auth, Storage Buckets) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Python**: v3.10, v3.11, or v3.12
- **Supabase Project**: An active project on [Supabase](https://supabase.com)
- **Google Gemini API Key**: From [Google AI Studio](https://aistudio.google.com/)

---

### 1. Environment Configuration

#### Backend Environment (`backend/.env`)
Create a `.env` file inside the `backend/` directory:

```env
APP_NAME="DataMind"
APP_VERSION="1.0.0"
HOST="127.0.0.1"
PORT=8000
DEBUG=True

# Google Gemini API
GOOGLE_API_KEY="your-google-gemini-api-key"

# Supabase Credentials (Service Role Key for Backend)
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
```

#### Frontend Environment (`frontend/.env`)
Create a `.env` file inside the `frontend/` directory:

```env
# Backend API Base URL
VITE_API_BASE_URL="http://localhost:8000"

# Supabase Public Keys
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

---

### 2. Backend Setup & Run

1. Open a terminal and navigate to `backend/`:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **Windows**:
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   The backend API will be available at `http://127.0.0.1:8000` (Interactive docs at `http://127.0.0.1:8000/docs`).

---

### 3. Frontend Setup & Run

1. Open another terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the development server:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

---

## 🗄️ Database Schema & Storage

The application leverages Supabase PostgreSQL for authentication, metadata persistence, and file storage.

### Core Tables:
- `auth.users`: Managed by Supabase Auth (stores emails, passwords, OAuth tokens, and `user_metadata`).
- `public.datasets`: Stores dataset file metadata, storage paths, row/column counts, and upload timestamps.
- `public.analyses`: Stores analysis runs, prompt questions, result payloads, and execution statuses.
- `public.analysis_outputs`: Stores generated output artifacts (cleaned CSVs, visualization charts, markdown summaries).
- `public.conversation_messages`: Stores threaded conversation messages for multi-turn chat on each analysis.

### Storage Buckets:
- `datasets`: Raw uploaded user files.
- `outputs`: Cleaned datasets and generated chart images.

---

## 🧭 Application Routes

| Path | Description | Access |
| :--- | :--- | :--- |
| `/` | Landing page showcasing platform features | Public |
| `/signin` | User login (Email/Password & Google OAuth) | Public |
| `/signup` | User registration | Public |
| `/profile-setup` | Nickname onboarding for greeting personalization | Authenticated |
| `/workspace` | Main interactive data analyst studio | Authenticated |
| `/workspace/analyses` | Recent analyses execution history | Authenticated |
| `/workspace/analyses/:id` | Analysis detail view & follow-up chat | Authenticated |
| `/workspace/datasets` | Dataset file library & raw downloads | Authenticated |
| `/workspace/outputs` | Output artifacts, cleaned CSVs & PDF reports | Authenticated |
| `/workspace/settings` | Account, security, and workspace preferences | Authenticated |

---

## 📄 License

This project is licensed under the MIT License.
