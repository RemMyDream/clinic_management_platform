import json
from typing import Optional
from redis import Redis
from .config import settings

redis_client: Optional[Redis] = None


def get_redis() -> Optional[Redis]:
    global redis_client
    if redis_client is None:
        try:
            redis_client = Redis.from_url(settings.REDIS_URL, decode_responses=True)
            redis_client.ping()
        except Exception:
            redis_client = None
    return redis_client


def cache_get(key: str) -> Optional[dict]:
    r = get_redis()
    if r is None:
        return None
    data = r.get(key)
    if data is None:
        return None
    return json.loads(data)


def cache_set(key: str, value: dict, ttl: int = 300):
    r = get_redis()
    if r is None:
        return
    r.set(key, json.dumps(value, default=str), ex=ttl)


def cache_delete(key: str):
    r = get_redis()
    if r is None:
        return
    r.delete(key)


def cache_delete_pattern(pattern: str):
    r = get_redis()
    if r is None:
        return
    for key in r.scan_iter(match=pattern):
        r.delete(key)
