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


@student_bp.route("/search_students/by_id/<id>")
@roles_accepted("admin")
def search_by_id(id):
    student_role = security.datastore.find_role("student")
    students: list[User] = getattr(student_role, "users", [])
    response = []

    for i in students:
        if id in str(i.id):
            response.append(
                {
                    "id": i.id,
                    "name": i.name,
                    "email": i.email,
                    "is_active": i.is_active,
                }
            )

    return response


@student_bp.route("/search_students/by_name/<name>")
@roles_accepted("admin")
def search_by_name(name):
    student_role = security.datastore.find_role("student")
    students: list[User] = getattr(student_role, "users", [])
    response = []

    for i in students:
        if name.lower() in i.name.lower():
            response.append(
                {
                    "id": i.id,
                    "name": i.name,
                    "email": i.email,
                    "is_active": i.is_active,
                }
            )

    return response


@student_bp.route("/search_students/by_email/<email>")
@roles_accepted("admin")
def search_by_email(email):
    student_role = security.datastore.find_role("student")
    students: list[User] = getattr(student_role, "users", [])
    response = []

    for i in students:
        if email.lower() in i.email.lower():
            response.append(
                {
                    "id": i.id,
                    "name": i.name,
                    "email": i.email,
                    "is_active": i.is_active,
                }
            )

    return response


@student_bp.route("/activate/<id>", methods=["PATCH"])
@roles_accepted("admin")
def activate_student(id):
    user = security.datastore.find_user(id=id)
    if user:
        security.datastore.activate_user(user)
        security.datastore.commit()
        return id, 200
    return "ID not found", 404


@student_bp.route("/deactivate/<id>", methods=["PATCH"])
@roles_accepted("admin")
def deactivate_student(id):
    user = security.datastore.find_user(id=id)
    if user:
        security.datastore.deactivate_user(user)
        security.datastore.commit()
        return id, 200
    return "ID not found", 404
