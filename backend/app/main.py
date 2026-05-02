from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import analyze, chat, copilotkit, fix, generate

app = FastAPI(
    title="Multimodal Generative UI Assistant API",
    description="Backend service for multimodal UI generation, preview iteration, and accessibility fixes.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generate.router, prefix="/api", tags=["generate"])
app.include_router(analyze.router, prefix="/api", tags=["analyze"])
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(fix.router, prefix="/api", tags=["fix"])
app.include_router(copilotkit.router, prefix="/api", tags=["copilotkit"])


@app.get("/")
async def root():
    return {"message": "Multimodal Generative UI Assistant API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}
