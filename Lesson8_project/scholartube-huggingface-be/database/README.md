# Sample Database Data

Use `schema.sql` to create ScholarTube Edu tables, then `sample_data.sql` to reset and preload demo data.

`sample_data.sql` truncates demo tables before inserting fixed sample IDs. This avoids foreign-key mismatches if the backend already auto-seeded random UUIDs earlier. Do not run it on production data you want to preserve.

Demo accounts:

```text
student@scholartube.edu / Demo@12345
admin@scholartube.edu / Demo@12345
minh.tran@scholartube.edu / Demo@12345
mai.le@scholartube.edu / Demo@12345
khoa.pham@scholartube.edu / Demo@12345
```

PostgreSQL example:

```bash
psql "$DATABASE_URL" -f backend/database/schema.sql
psql "$DATABASE_URL" -f backend/database/sample_data.sql
```

Local SQLite note:

```bash
cd backend
python scripts/init_db.py
```

`schema.sql` is written for PostgreSQL/Supabase. For local SQLite, let SQLAlchemy create tables through `python scripts/init_db.py` or backend startup. The same demo data is seeded automatically on backend startup when the course catalog is empty.
