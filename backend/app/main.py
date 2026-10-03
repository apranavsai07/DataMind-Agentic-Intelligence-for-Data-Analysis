from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.core.config import settings
from app.api.routes import upload
from app.api.routes.history import router as history_router
from app.api.routes import datasets



app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION
)

# ============================================================
# CORS — allow the Vite dev server to call the API
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://datamind-ai-agent.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# STATIC FILES — serve generated charts and exports
# ============================================================

OUTPUTS_DIR = Path("outputs")
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)

app.mount(
    "/outputs",
    StaticFiles(directory="outputs"),
    name="outputs",
)

# ============================================================
# ROUTES
# ============================================================

app.include_router(
    upload.router,
    prefix="/upload",
    tags=["Upload"],
)


app.include_router(
    history_router
   
)
app.include_router(datasets.router)

@app.get("/")
def home():
    return {
        "message": "AI Data Analyst Workspace Backend Running"
    }