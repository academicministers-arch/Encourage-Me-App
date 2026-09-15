"""
Shared streak calculation — used by both /api/journey/stats (for the
Emotional Journey page) and /api/checkin (so the frontend can detect a
milestone the instant a check-in is submitted, without a second API call).
"""

import datetime
from typing import Iterable, Tuple


def compute_streaks(entry_dates: Iterable[datetime.date]) -> Tuple[int, int]:
    """Given the dates (not datetimes) of a user's check-ins, returns
    (current_streak, longest_streak) in days.
    """
    dates = sorted(set(entry_dates), reverse=True)
    current_streak = 0
    longest_streak = 0

    if not dates:
        return 0, 0

    today = datetime.datetime.utcnow().date()
    date_set = set(dates)

    cursor = today
    while cursor in date_set:
        current_streak += 1
        cursor -= datetime.timedelta(days=1)

    # Still counts as an active streak if the most recent check-in was
    # yesterday (today's just hasn't happened yet).
    if current_streak == 0 and (today - dates[0]).days == 1:
        cursor = dates[0]
        while cursor in date_set:
            current_streak += 1
            cursor -= datetime.timedelta(days=1)

    streak = 1
    longest_streak = 1
    sorted_asc = sorted(date_set)
    for i in range(1, len(sorted_asc)):
        if (sorted_asc[i] - sorted_asc[i - 1]).days == 1:
            streak += 1
            longest_streak = max(longest_streak, streak)
        else:
            streak = 1

    return current_streak, longest_streak
