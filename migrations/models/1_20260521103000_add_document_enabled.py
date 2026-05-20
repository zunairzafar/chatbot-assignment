from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "documents"
        ADD COLUMN IF NOT EXISTS "enabled" BOOL NOT NULL DEFAULT TRUE;
    """


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "documents"
        DROP COLUMN IF EXISTS "enabled";
    """
