import json
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.idempotency import IdempotencyRecord


async def check_idempotency(
    db: AsyncSession,
    user_id: str,
    idempotency_key: str | None,
) -> dict | None:
    """
    Checks if this request was already processed under the given Idempotency-Key.
    Solves the 'Laggy Wi-Fi' double-tap problem.
    """
    if not idempotency_key:
        return None

    res = await db.execute(
        select(IdempotencyRecord).where(
            IdempotencyRecord.key == idempotency_key,
            IdempotencyRecord.user_id == user_id,
        )
    )
    record = res.scalar_one_or_none()
    if record:
        return {
            "status_code": record.status_code,
            "data": json.loads(record.response_json),
        }
    return None


async def save_idempotency(
    db: AsyncSession,
    user_id: str,
    idempotency_key: str | None,
    status_code: int,
    data: dict,
):
    """
    Caches the response against the Idempotency-Key.
    """
    if not idempotency_key:
        return

    record = IdempotencyRecord(
        key=idempotency_key,
        user_id=user_id,
        status_code=status_code,
        response_json=json.dumps(data, default=str),
    )
    db.add(record)
    await db.commit()
