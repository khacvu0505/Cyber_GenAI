from app.config import Settings


def test_database_access_builds_encoded_sqlalchemy_url() -> None:
    settings = Settings(
        _env_file=None,
        database_driver="postgresql+asyncpg",
        db_host="db.internal",
        db_port=5433,
        db_user="proposal_user",
        db_pass="p@ss:/word",
        database="proposal_db",
    )
    url = settings.sqlalchemy_url
    assert url.host == "db.internal"
    assert url.port == 5433
    assert url.username == "proposal_user"
    assert url.password == "p@ss:/word"
    assert url.database == "proposal_db"
