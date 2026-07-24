\getenv target_user POSTGRES_USER
\getenv target_password POSTGRES_PASSWORD

ALTER ROLE :"target_user" WITH PASSWORD :'target_password';
