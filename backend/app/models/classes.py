"""
Class model represents a school class or section.
"""
from ..extensions import db


class Class(db.Model):
    __tablename__ = "classes"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    section = db.Column(db.String(20))
    year = db.Column(db.Integer)

    def __repr__(self):
        return f"<Class {self.id} {self.name} {self.section}>"
