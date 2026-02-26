from ..extensions import db

class Subject(db.Model):
    __tablename__ = "subjects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey("classes.id"), nullable=False)

    klass = db.relationship("Class", backref="subjects")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "class_id": self.class_id
        }