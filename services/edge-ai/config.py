"""Environment configuration for edge-ai. Copy .env.example to .env first."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- identity -----------------------------------------------------
    jurisdiction_id: str = "jur_thrissur_01"

    # --- providers ----------------------------------------------------
    stt_provider: str = "groq"
    tts_provider: str = "edge_tts"
    translate_provider: str = "bank"
    edge_llm_provider: str = "lmstudio"

    edge_llm_url: str = "http://localhost:1234/v1"
    edge_llm_model: str = "qwen2.5-7b-instruct"
    edge_llm_fallback: str = "groq"
    edge_llm_timeout_ms: int = 20_000

    groq_api_key: str = ""
    groq_stt_model: str = "whisper-large-v3-turbo"
    groq_fallback_model: str = "llama-3.3-70b-versatile"

    # --- timing -------------------------------------------------------
    # Demo value. Production is 90s (architecture §5.4) — a nurse cannot
    # perform a physical check in 20 seconds, but a judge will not wait 90.
    on_demand_timeout_seconds: int = 20

    # --- data ---------------------------------------------------------
    supabase_url: str = ""
    supabase_service_key: str = ""
    edge_db_path: str = "edge.db"
    audio_dir: str = "audio_tmp"

    # --- mqtt ---------------------------------------------------------
    mqtt_url: str = ""
    mqtt_username: str = ""
    mqtt_password: str = ""

    # --- cors ---------------------------------------------------------
    web_origin: str = "http://localhost:3000"


@lru_cache
def get_settings() -> Settings:
    return Settings()
