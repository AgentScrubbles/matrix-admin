from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    synapse_url: str = "http://synapse.matrix.svc.cluster.local:8008"
    server_name: str = "halflings.chat"
    session_secret: str = "change-me-in-production"
    session_max_age: int = 28800  # 8 hours
    cookie_domain: str = "admin.halflings.chat"

    model_config = {"env_prefix": ""}


settings = Settings()
