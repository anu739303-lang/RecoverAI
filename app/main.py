from fastapi import FastAPI
from app.database import client, db
from app.dashboard import router as dashboard_router
from app.recovery import router as recovery_router
from fastapi.middleware.cors import CORSMiddleware
from app.analytics import router as analytics_router

app = FastAPI(
    title="RecoverAI",
    description="AI Revenue Recovery Agent",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Routers
app.include_router(dashboard_router)
app.include_router(
    recovery_router
)
app.include_router(
    analytics_router
)



@app.get("/")
def root():
    return {
        "message": "RecoverAI API is running"
    }


@app.get("/health")
def health():
    try:
        client.admin.command("ping")

        return {
            "status": "healthy",
            "database": "connected"
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }