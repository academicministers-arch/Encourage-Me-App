import os
import sys
import unittest
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


class EnvFileResolutionTests(unittest.TestCase):
    def test_resolve_env_file_uses_backend_dotenv_even_if_cwd_changes(self):
        self.assertTrue((BACKEND_DIR / ".env").exists(), "Expected backend/.env to exist")

        original_cwd = os.getcwd()
        try:
            os.chdir(BACKEND_DIR.parent)
            from app import config

            self.assertEqual(config.resolve_env_file(), BACKEND_DIR / ".env")
        finally:
            os.chdir(original_cwd)


if __name__ == "__main__":
    unittest.main()
