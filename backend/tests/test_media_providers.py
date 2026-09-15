import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.services.dailymotion_service import _build_entry as build_dailymotion_entry
from app.services.listennotes_service import _build_entry as build_listennotes_entry


def test_listen_notes_episode_is_normalized_as_playable_audio():
    entry = build_listennotes_entry({
        "id": "episode-123",
        "title_original": "A hopeful conversation",
        "podcast_title_original": "Small Steps",
        "audio": "https://cdn.example.test/episode.mp3",
        "thumbnail": "https://cdn.example.test/cover.jpg",
        "link": "https://www.listennotes.com/e/episode-123/",
        "audio_length_sec": 420,
    })

    assert entry["media_id"] == "listennotes:episode-123"
    assert entry["media_type"] == "audio"
    assert entry["audio_url"].endswith("episode.mp3")


def test_dailymotion_video_is_normalized_as_embeddable_video():
    entry = build_dailymotion_entry({
        "id": "video-456",
        "title": "A motivating story",
        "owner.screenname": "Encourage Channel",
        "thumbnail_360_url": "https://dm.example.test/thumb.jpg",
        "url": "https://www.dailymotion.com/video/video-456",
    })

    assert entry["media_id"] == "dailymotion:video-456"
    assert entry["media_type"] == "video"
    assert entry["embed_url"].endswith("/video/video-456")


def test_provider_entries_without_playable_source_are_skipped():
    assert build_listennotes_entry({"id": "missing-audio"}) is None
    assert build_dailymotion_entry({}) is None