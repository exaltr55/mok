"""Application configuration via environment variables.

Uses pydantic-settings for type-safe config with .env file support.
All config is externalized per 12-Factor App principles.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Platform configuration.

    Reads from environment variables with the ``MOK_`` prefix and falls back to
    a ``.env`` file in the backend directory.
    """

    model_config = SettingsConfigDict(
        env_prefix="MOK_",
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application / Branding
    app_name: str = "mok"
    app_subtitle: str = "Base AI Application"
    debug: bool = False
    log_level: str = "INFO"
    frontend_url: str = ""

    # Database
    database_url: str = "postgresql+asyncpg://mok:mok@localhost:5432/mok"

    # JWT Authentication.
    # SECURITY: leave the secret at the sentinel default and the startup check
    # in app.main will refuse to boot in non-debug mode.
    jwt_secret_key: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 480  # 8 hours
    password_reset_token_minutes: int = 60

    # Password policy
    password_min_length: int = 8
    password_require_uppercase: bool = True
    password_require_lowercase: bool = True
    password_require_digit: bool = True

    # Login brute-force protection — max attempts per IP per window.
    # mok uses an in-process counter; for production replace with Redis.
    login_rate_limit_attempts: int = 10
    login_rate_limit_window_seconds: int = 300

    # Initial admin user (seeded on first startup if no users exist).
    initial_admin_email: str = "admin@mok.dev"
    initial_admin_password: str = ""

    # LLM providers
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    gemini_api_key: str = ""
    ollama_base_url: str = "http://localhost:11434"
    default_model: str = "anthropic:claude-sonnet-4-6"
    chat_max_message_chars: int = 8_000
    chat_max_history_messages: int = 50

    # SMTP (leave host blank to log emails to stdout in dev mode)
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""

    # Contact form
    contact_recipient: str = "admin@mok.dev"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000


settings = Settings()
