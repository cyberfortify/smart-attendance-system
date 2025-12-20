"""
Entry-point for local development.
Run: python run.py
"""
from app import create_app

app = create_app()

if __name__ == "__main__":
    # Debug mode for local development only.
    app.run(host="0.0.0.0", port=5000, debug=True)
