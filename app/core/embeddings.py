from __future__ import annotations

from functools import lru_cache
from typing import Iterable

from fastembed import TextEmbedding

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class EmbeddingService:
    def __init__(self) -> None:
        logger.info("Loading FastEmbed model=%s", settings.FASTEMBED_MODEL)
        self._backend = TextEmbedding(model_name=settings.FASTEMBED_MODEL)

    def embed_documents(self, texts: Iterable[str]) -> list[list[float]]:
        text_list = list(texts)
        logger.debug("Embedding %s chunk(s)", len(text_list))
        return [list(vector) for vector in self._backend.embed(text_list)]

    def embed_query(self, text: str) -> list[float]:
        return self.embed_documents([text])[0]


@lru_cache(maxsize=1)
def get_embedding_service() -> EmbeddingService:
    return EmbeddingService()
