from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import router
from .catalog import DOCUMENTS
from .config import CORS_ORIGINS
from .repositories import initialize_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    initialize_database(DOCUMENTS)
    yield


app = FastAPI(title="Secure RAG Access Control", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)
