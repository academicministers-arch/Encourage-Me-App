import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import main
import app.database as database
import app.models as models
import app.auth as auth


class TestimonialsApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        cls.temp_db.close()
        cls.engine = create_engine(f"sqlite:///{cls.temp_db.name}")
        cls.SessionLocal = sessionmaker(bind=cls.engine, autocommit=False, autoflush=False)
        cls.patcher = patch.object(database, "SessionLocal", cls.SessionLocal)
        cls.patcher.start()
        models.Base.metadata.create_all(bind=cls.engine)
        cls.client = TestClient(main.app)

    @classmethod
    def tearDownClass(cls):
        cls.patcher.stop()
        if hasattr(cls, "client"):
            cls.client.close()
        if hasattr(cls, "engine"):
            cls.engine.dispose()
        try:
            os.remove(cls.temp_db.name)
        except FileNotFoundError:
            pass
        except PermissionError:
            pass

    def test_create_testimonial_like_and_comment(self):
        with self.SessionLocal() as db:
            user = models.User(name="Tester", email="tester@example.com", password_hash="x")
            db.add(user)
            db.commit()
            db.refresh(user)
            current_user = user

        main.app.dependency_overrides[auth.get_current_user] = lambda: current_user
        try:
            with patch(
                "app.routers.testimonials_router.upload_media",
                return_value="https://example.supabase.co/storage/v1/object/public/media/testimonials/photo.png",
            ), patch("app.routers.testimonials_router.settings.SUPABASE_URL", "https://example.supabase.co"), patch(
                "app.routers.testimonials_router.settings.SUPABASE_SERVICE_ROLE_KEY", "test-key"
            ):
                create_response = self.client.post(
                    "/api/testimonials",
                    data={"text": "This app changed my life."},
                    files=[("files", ("photo.png", b"abc123", "image/png"))],
                )

            self.assertEqual(create_response.status_code, 200, create_response.text)
            payload = create_response.json()
            self.assertEqual(payload["text"], "This app changed my life.")
            self.assertEqual(len(payload["attachments"]), 1)
            testimonial_id = payload["id"]

            like_response = self.client.post(f"/api/testimonials/{testimonial_id}/like")
            self.assertEqual(like_response.status_code, 200, like_response.text)
            self.assertTrue(like_response.json()["liked_by_me"])
            self.assertEqual(like_response.json()["like_count"], 1)

            comment_response = self.client.post(
                f"/api/testimonials/{testimonial_id}/comments",
                json={"content": "This really helped me."},
            )
            self.assertEqual(comment_response.status_code, 200, comment_response.text)
            self.assertEqual(comment_response.json()["content"], "This really helped me.")
        finally:
            main.app.dependency_overrides.clear()

    def test_admin_can_manage_support_organizations(self):
        with self.SessionLocal() as db:
            admin = models.User(name="Admin", email="admin@example.com", password_hash="x", is_admin=True)
            db.add(admin)
            db.commit()
            db.refresh(admin)
            current_admin = admin

        main.app.dependency_overrides[auth.get_current_admin] = lambda: current_admin
        main.app.dependency_overrides[auth.get_current_user] = lambda: current_admin
        try:
            create_response = self.client.post(
                "/api/admin/organizations",
                json={
                    "name": "Test Support Org",
                    "description": "A local support organization for testing.",
                    "category": "Community Support",
                    "country": "Uganda",
                    "location": "Kampala",
                    "phone": "+256700000000",
                    "phone_note": "Available during business hours",
                    "email": "hello@testsupport.org",
                    "website": "https://testsupport.org",
                    "emergency": False,
                },
            )

            self.assertEqual(create_response.status_code, 201, create_response.text)
            payload = create_response.json()
            self.assertEqual(payload["name"], "Test Support Org")
            org_id = payload["id"]

            list_response = self.client.get("/api/organizations")
            self.assertEqual(list_response.status_code, 200, list_response.text)
            org_names = [item["name"] for item in list_response.json()]
            self.assertIn("Test Support Org", org_names)

            update_response = self.client.put(
                f"/api/admin/organizations/{org_id}",
                json={"country": "Kenya", "location": "Nairobi"},
            )
            self.assertEqual(update_response.status_code, 200, update_response.text)
            self.assertEqual(update_response.json()["country"], "Kenya")
            self.assertEqual(update_response.json()["location"], "Nairobi")

            delete_response = self.client.delete(f"/api/admin/organizations/{org_id}")
            self.assertEqual(delete_response.status_code, 200, delete_response.text)
            self.assertEqual(delete_response.json()["message"], "Support organization removed.")
        finally:
            main.app.dependency_overrides.clear()


if __name__ == "__main__":
    unittest.main()
