from fastapi import APIRouter, Depends

from app.core.deps import get_current_user
from app.core.logging import get_logger
from app.core.rag import generate_huggingface_answer, retrieve_top_chunks
from app.models.user import User
from app.schemas.ask import AskRequest, AskResponse

router = APIRouter(tags=["ask"])
logger = get_logger(__name__)


@router.post("/ask", response_model=AskResponse)
async def ask(body: AskRequest, current_user: User = Depends(get_current_user)):
    logger.info("Question from user %s: %s", current_user.id, body.question)
    chunks = await retrieve_top_chunks(user_id=current_user.id, question=body.question, limit=4)
    result = generate_huggingface_answer(question=body.question, source_chunks=chunks)
    return AskResponse(answer=result.answer, prompt=result.prompt, sources=result.sources)