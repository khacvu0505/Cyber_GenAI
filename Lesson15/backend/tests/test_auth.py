from uuid import uuid4

from app.schemas import UserRegister
from app.security import create_access_token, decode_access_token, hash_password, verify_password


def test_password_hash_round_trip() -> None:
    password_hash = hash_password("a-secure-password")

    assert password_hash != "a-secure-password"
    assert verify_password("a-secure-password", password_hash)
    assert not verify_password("wrong-password", password_hash)


def test_access_token_round_trip() -> None:
    user_id = uuid4()

    assert decode_access_token(create_access_token(user_id)) == user_id
    assert decode_access_token("not-a-token") is None


def test_register_normalizes_email() -> None:
    user = UserRegister(
        full_name="  Nguyễn Minh Anh  ",
        email="  MINH.ANH@EXAMPLE.COM  ",
        password="a-secure-password",
    )

    assert user.full_name == "Nguyễn Minh Anh"
    assert user.email == "minh.anh@example.com"
