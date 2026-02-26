from app import db
from ..models.notification import Notification

def create_notification(user_id, title, message, type="info"):
    try:
        notif = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=type
        )
        db.session.add(notif)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("Notification error:", e)