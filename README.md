# Smart Attendance System

Full-stack attendance system built with:

- React (frontend)
- Flask (backend)
- MySQL (database)

## Project structure

- `frontend/` – React app (admin + student dashboards)
- `backend/` – Flask API + database models

## Local setup

### Backend
- go to backend directory
- create env by using python -m venv venv if env. already present then run .\venv\Scripts\activate to activate env.
- pip install -r requirements.txt
- backend run: waitress-serve --listen=0.0.0.0:5000 run:app

### Database Setup
- first install mysql command line client: https://dev.mysql.com/downloads/mysql/
- create database using this command: CREATE DATABASE attendance_system;
- then come to project dir. then in terminal run: flask dp upgrade - for clean table autogenerate with the help of database migration or if we want to add some dummy data run: python scripts/seed.py 

### Frontend
- go to frontend directory
- run this commmand: npm run dev

### Account to login:
- admin: admin@example.com pass: admin123
- teacher: teacher1@gmail.com pass: teacher123
- student: tejas@gmail.com pass: student123  
