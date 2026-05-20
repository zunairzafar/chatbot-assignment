from tortoise.fields import Field


class VectorField(Field):
    SQL_TYPE = "vector(384)"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_db_value(self, value, instance):
        if value is None:
            return None
        return f"[{','.join(str(x) for x in value)}]"

    def to_python_value(self, value):
        if value is None:
            return None
        if isinstance(value, str):
            return [float(x) for x in value.strip("[]").split(",")]
        return value
