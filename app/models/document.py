import uuid
from tortoise import fields
from tortoise.models import Model
from app.models.fields import VectorField


class Document(Model):
    id = fields.UUIDField(pk=True, default=uuid.uuid4)
    user = fields.ForeignKeyField("models.User", related_name="documents", on_delete=fields.CASCADE)
    filename = fields.CharField(max_length=255)
    enabled = fields.BooleanField(default=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "documents"


class DocumentChunk(Model):
    id = fields.UUIDField(pk=True, default=uuid.uuid4)
    document = fields.ForeignKeyField("models.Document", related_name="chunks", on_delete=fields.CASCADE)
    chunk_index = fields.IntField()
    page_number = fields.IntField(null=True)
    chunk_text = fields.TextField()
    embedding = VectorField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "document_chunks"
