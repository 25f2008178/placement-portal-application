from flask import Blueprint
from flask_security.decorators import roles_accepted

from app.extensions import security
from app.models import User

student_bp = Blueprint("student", __name__)


@student_bp.route("/get_students")
@roles_accepted("admin")
def get_companies():
    student_role = security.datastore.find_role("student")
    students: list[User] = getattr(student_role, "users", [])
    response = []

    for i in students:
        response.append(
            {
                "id": i.id,
                "name": i.name,
                "email": i.email,
                "is_active": i.is_active,
            }
        )

    return response


@student_bp.route("/activate/<id>")
@roles_accepted("admin")
def activate_student(id):
    user = security.datastore.find_user(id=id)
    if user:
        security.datastore.activate_user(user)
        security.datastore.commit()
        return id, 200
    return "ID not found", 404
