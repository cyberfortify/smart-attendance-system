# Attendance System - Backend Starter

## Setup (local)
1. Create a Python virtual environment:
   python -m venv venv
   source venv/bin/activate     # macOS / Linux
   venv\Scripts\activate        # Windows

2. Install requirements:
   pip install -r requirements.txt

3. Copy `.env.example` to `.env` and update DB credentials:
   FLASK_ENV=development
   SECRET_KEY=...
   SQLALCHEMY_DATABASE_URI=mysql+mysqlconnector://user:pass@host/dbname
   JWT_SECRET_KEY=...

4. Create database 'attendance_system' in MySQL (or update URI).

5. Run seed script to create tables and sample data:
   python scripts/seed.py

6. Start the app:
   python run.py

7. Test login:
   POST http://localhost:5000/api/auth/login
   Body JSON:
   {
     "email": "admin@example.com",
     "password": "admin123"
   }

