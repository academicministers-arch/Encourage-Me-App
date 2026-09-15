"""Shared rate limiter instance — imported by main.py (to register the
error handler) and by individual routers (to apply @limiter.limit(...) to
specific sensitive endpoints like login/register/check-in).
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
