from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

database_url = settings.DATABASE_URL
if not database_url:
    raise RuntimeError("DATABASE_URL must point to the Supabase PostgreSQL database.")
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)

if "sqlite" in database_url:
    raise RuntimeError("SQLite is not supported. Configure DATABASE_URL with Supabase PostgreSQL.")

connect_args = {}

engine = create_engine(
    database_url,
    connect_args=connect_args,
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_sqlite_users_schema():
    """Ensure legacy SQLite databases have the correct users schema."""
    if "sqlite" not in settings.DATABASE_URL:
        return

    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    existing_columns = inspector.get_columns("users")
    column_names = [col["name"] for col in existing_columns]
    needs_google_id = "google_id" not in column_names
    needs_avatar_url = "avatar_url" not in column_names
    password_col = next((col for col in existing_columns if col["name"] == "password_hash"), None)
    needs_password_nullable = password_col is not None and not password_col.get("nullable", True)

    if not needs_google_id and not needs_password_nullable and not needs_avatar_url:
        return

    with engine.begin() as conn:
        conn.execute(text("PRAGMA foreign_keys=OFF"))
        if needs_password_nullable:
            conn.execute(text("ALTER TABLE users RENAME TO users_old"))
            Base.metadata.tables["users"].create(bind=engine)
            columns_csv = ", ".join(column_names)
            conn.execute(text(f"INSERT INTO users ({columns_csv}) SELECT {columns_csv} FROM users_old"))
            conn.execute(text("DROP TABLE users_old"))
        else:
            if needs_google_id:
                conn.execute(text("ALTER TABLE users ADD COLUMN google_id VARCHAR"))
            if needs_avatar_url:
                conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url TEXT"))

        if needs_google_id:
            conn.execute(
                text(
                    "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_google_id ON users (google_id)"
                )
            )
        conn.execute(text("PRAGMA foreign_keys=ON"))


def ensure_sqlite_settings_schema():
    """Ensure legacy SQLite databases have calendar preference columns in settings table."""
    if "sqlite" not in settings.DATABASE_URL:
        return

    inspector = inspect(engine)
    if "settings" not in inspector.get_table_names():
        return

    existing_columns = inspector.get_columns("settings")
    column_names = [col["name"] for col in existing_columns]
    needs_calendar_theme_id = "calendar_theme_id" not in column_names
    needs_calendar_background_image = "calendar_background_image" not in column_names

    if not needs_calendar_theme_id and not needs_calendar_background_image:
        return

    with engine.begin() as conn:
        conn.execute(text("PRAGMA foreign_keys=OFF"))
        if needs_calendar_theme_id:
            conn.execute(text("ALTER TABLE settings ADD COLUMN calendar_theme_id VARCHAR"))
        if needs_calendar_background_image:
            conn.execute(text("ALTER TABLE settings ADD COLUMN calendar_background_image TEXT"))
        conn.execute(text("PRAGMA foreign_keys=ON"))
