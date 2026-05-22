from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from langchain_core.prompts import PromptTemplate
from tortoise import connections

from app.core.config import settings
from app.core.embeddings import get_embedding_service
from app.core.logging import get_logger

logger = get_logger(__name__)

_toxic_classifier = None

def get_toxic_classifier():
    global _toxic_classifier
    if _toxic_classifier is None:
        from transformers import pipeline
        logger.info("Loading ToxicBert classifier")
        _toxic_classifier = pipeline(
            "text-classification",
            model="unitary/toxic-bert",
            top_k=None,
        )
    return _toxic_classifier


def is_toxic(text: str, threshold: float = 0.55) -> bool:
    classifier = get_toxic_classifier()
    results = classifier(text[:512])
    scores = results[0] if isinstance(results[0], list) else results
    for item in scores:
        if item["label"] == "toxic" and item["score"] >= threshold:
            logger.warning("Toxic query detected score=%.3f", item["score"])
            return True
    return False


RAG_PROMPT = PromptTemplate.from_template(
    """You are a strict document assistant. Your ONLY job is to answer questions using the provided document context.

RULES:
- Answer ONLY from the context below. Do not use any outside knowledge.
- If the context does not contain the answer, respond with exactly: "I could not find this information in your uploaded documents."
- Do not make up facts. Do not speculate. Do not answer general knowledge questions.

Question: {question}

Context:
{context}

Answer:"""
)

RELEVANCE_THRESHOLD = 0.35


def vector_to_sql_literal(vector: list[float]) -> str:
    return "[" + ",".join(f"{value:.10f}" for value in vector) + "]"


@dataclass
class RagResult:
    answer: str
    prompt: str
    sources: list[dict]


def build_prompt(question: str, source_chunks: list[dict]) -> str:
    context = "\n\n".join(
        f"Source {i + 1} ({c['filename']}): {c['chunk_text']}"
        for i, c in enumerate(source_chunks)
    )
    return RAG_PROMPT.format(question=question, context=context)


def fallback_answer(question: str, source_chunks: list[dict]) -> RagResult:
    prompt_text = build_prompt(question, source_chunks)
    answer_lines = [f"I found {len(source_chunks)} relevant source chunk(s):"]
    for chunk in source_chunks:
        snippet = chunk["chunk_text"].strip().replace("\n", " ")
        if len(snippet) > 240:
            snippet = snippet[:240].rstrip() + "..."
        answer_lines.append(f"- {snippet}")
    answer_lines.append("This is a retrieval-only fallback when the Hugging Face model is unavailable.")
    return RagResult(answer="\n".join(answer_lines), prompt=prompt_text, sources=source_chunks)


def generate_huggingface_answer(question: str, source_chunks: list[dict]) -> RagResult:
    prompt_text = build_prompt(question, source_chunks)
    try:
        from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
        from langchain_core.messages import HumanMessage

        llm = HuggingFaceEndpoint(
            repo_id=settings.HUGGINGFACE_CHAT_MODEL,
            huggingfacehub_api_token=settings.HUGGINGFACE_API_TOKEN,
            max_new_tokens=settings.HUGGINGFACE_MAX_NEW_TOKENS,
            temperature=0.2,
        )
        chat = ChatHuggingFace(llm=llm)
        logger.info("Generating HF answer model=%s chunks=%s", settings.HUGGINGFACE_CHAT_MODEL, len(source_chunks))
        response = chat.invoke([HumanMessage(content=prompt_text)])
        answer_text = response.content.strip()
        if not answer_text:
            raise RuntimeError("Empty response from Hugging Face model")
        return RagResult(answer=answer_text, prompt=prompt_text, sources=source_chunks)
    except Exception:
        logger.exception("HF generation failed, using fallback")
        return fallback_answer(question, source_chunks)


async def retrieve_top_chunks(user_id: UUID, question: str, limit: int = 4) -> list[dict]:
    embedding_service = get_embedding_service()
    query_embedding = embedding_service.embed_query(question)
    sql = """
        SELECT
            dc.id,
            dc.chunk_index,
            dc.page_number,
            dc.chunk_text,
            dc.created_at,
            d.id AS document_id,
            d.filename,
            1 - (dc.embedding <=> $1::vector) AS score
        FROM document_chunks dc
        INNER JOIN documents d ON d.id = dc.document_id
        WHERE d.user_id = $2::uuid
          AND d.enabled = TRUE
        ORDER BY dc.embedding <=> $1::vector
        LIMIT $3;
    """
    connection = connections.get("default")
    rows = await connection.execute_query_dict(
        sql, [vector_to_sql_literal(query_embedding), str(user_id), limit]
    )
    relevant = [r for r in rows if (r.get("score") or 0) >= RELEVANCE_THRESHOLD]
    logger.info("Retrieved %s chunks, %s above threshold for user_id=%s", len(rows), len(relevant), user_id)
    return relevant


async def has_enabled_documents(user_id: UUID) -> bool:
    connection = connections.get("default")
    rows = await connection.execute_query_dict(
        "SELECT COUNT(*) AS cnt FROM documents WHERE user_id = $1::uuid AND enabled = TRUE",
        [str(user_id)],
    )
    return (rows[0]["cnt"] if rows else 0) > 0


async def run_rag(question: str, user_id: UUID) -> RagResult:
    if is_toxic(question):
        return RagResult(
            answer="Your message was flagged as inappropriate. Please rephrase your question.",
            prompt="",
            sources=[],
        )

    if not await has_enabled_documents(user_id):
        return RagResult(
            answer="You have no enabled documents. Please upload and enable at least one document before asking questions.",
            prompt="",
            sources=[],
        )

    source_chunks = await retrieve_top_chunks(user_id=user_id, question=question)

    if not source_chunks:
        return RagResult(
            answer="I could not find this information in your uploaded documents.",
            prompt="",
            sources=[],
        )

    return generate_huggingface_answer(question, source_chunks)
