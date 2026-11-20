"""Groq API client + local sentence-transformers embeddings."""
from __future__ import annotations

import logging
import threading
from typing import List, Optional

from groq import Groq
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.core.config import get_settings
from app.core.exceptions import AIServiceError

logger = logging.getLogger(__name__)
settings = get_settings()

# ── Groq client (sync SDK, called via threadpool) ─────────────────────────────
_groq_client: Optional[Groq] = None
_groq_lock = threading.Lock()


def _get_groq_client() -> Groq:
    global _groq_client
    if _groq_client is None:
        with _groq_lock:
            if _groq_client is None:
                if not settings.GROQ_API_KEY:
                    raise AIServiceError("GROQ_API_KEY is not configured")
                _groq_client = Groq(api_key=settings.GROQ_API_KEY)
    return _groq_client


# ── Sentence-Transformers (local embeddings, no API key needed) ───────────────
_embedding_model = None
_embedding_lock = threading.Lock()


def _get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        with _embedding_lock:
            if _embedding_model is None:
                try:
                    from sentence_transformers import SentenceTransformer
                    _embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
                    logger.info(f"Loaded embedding model: {settings.EMBEDDING_MODEL}")
                except Exception as e:
                    logger.error(f"Failed to load embedding model: {e}")
                    raise AIServiceError(f"Embedding model unavailable: {e}")
    return _embedding_model


# ── Text Generation ───────────────────────────────────────────────────────────

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(Exception),
    reraise=True,
)
async def generate_text(
    prompt: str,
    system_instruction: Optional[str] = None,
    temperature: float = 0.7,
    max_output_tokens: int = 2048,
    use_fast_model: bool = False,
) -> str:
    """Generate text using Groq LLM."""
    import asyncio
    try:
        model = settings.GROQ_FAST_MODEL if use_fast_model else settings.GROQ_MODEL
        client = _get_groq_client()
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        # Run sync Groq client in executor to avoid blocking event loop
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_output_tokens,
            ),
        )
        return response.choices[0].message.content or ""
    except AIServiceError:
        raise
    except Exception as e:
        logger.error(f"Groq generate_text failed: {e}")
        raise AIServiceError(f"AI generation failed: {str(e)}")


async def generate_chat_response(
    messages: List[dict],
    system_instruction: Optional[str] = None,
    temperature: float = 0.8,
    max_output_tokens: int = 4096,
    use_fast_model: bool = False,
) -> str:
    """Send a multi-turn chat history to Groq and get a response."""
    import asyncio
    try:
        model = settings.GROQ_FAST_MODEL if use_fast_model else settings.GROQ_MODEL
        client = _get_groq_client()

        groq_messages = []
        if system_instruction:
            groq_messages.append({"role": "system", "content": system_instruction})

        for msg in messages:
            role = msg.get("role", "user")
            if role == "assistant":
                role = "assistant"
            groq_messages.append({"role": role, "content": msg.get("content", "")})

        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.chat.completions.create(
                model=model,
                messages=groq_messages,
                temperature=temperature,
                max_tokens=max_output_tokens,
            ),
        )
        return response.choices[0].message.content or ""
    except AIServiceError:
        raise
    except Exception as e:
        logger.error(f"Groq chat failed: {e}")
        raise AIServiceError(f"AI chat failed: {str(e)}")


# ── Embeddings (local sentence-transformers) ──────────────────────────────────

async def get_embedding(text: str) -> List[float]:
    """Get local embedding vector for text using sentence-transformers."""
    import asyncio
    try:
        model = _get_embedding_model()
        loop = asyncio.get_event_loop()
        embedding = await loop.run_in_executor(
            None,
            lambda: model.encode(text, convert_to_numpy=True).tolist(),
        )
        return embedding
    except AIServiceError:
        raise
    except Exception as e:
        logger.error(f"Embedding failed: {e}")
        return [0.0] * settings.EMBEDDING_DIMENSION


async def get_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """Get embeddings for multiple texts in a batch (faster than sequential)."""
    import asyncio
    try:
        model = _get_embedding_model()
        loop = asyncio.get_event_loop()
        embeddings = await loop.run_in_executor(
            None,
            lambda: model.encode(texts, convert_to_numpy=True).tolist(),
        )
        return embeddings
    except Exception as e:
        logger.error(f"Batch embedding failed: {e}")
        return [[0.0] * settings.EMBEDDING_DIMENSION for _ in texts]
