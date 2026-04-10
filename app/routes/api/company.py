from flask import Blueprint
from flask_security.decorators import roles_accepted

from app.extensions import db, security
from app.models import User

company_bp = Blueprint("company", __name__)


@company_bp.route("/get_companies")
@roles_accepted("admin")
def get_companies():
    company_role = security.datastore.find_role("company")
    companies: list[User] = getattr(company_role, "users", [])
    response = []

    for i in companies:
        response.append(
            {
                "id": i.id,
                "name": i.name,
                "email": i.email,
                "is_active": i.is_active,
            }
        )

    return response


@company_bp.route("/search_companies/by_id/<id>")
@roles_accepted("admin")
def search_by_id(id):
    company_role = security.datastore.find_role("company")
    companies: list[User] = getattr(company_role, "users", [])
    response = []

    for i in companies:
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


@company_bp.route("/search_companies/by_name/<name>")
@roles_accepted("admin")
def search_by_name(name):
    company_role = security.datastore.find_role("company")
    companies: list[User] = getattr(company_role, "users", [])
    response = []

    for i in companies:
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


@company_bp.route("/search_companies/by_email/<email>")
@roles_accepted("admin")
def search_by_email(email):
    company_role = security.datastore.find_role("company")
    companies: list[User] = getattr(company_role, "users", [])
    response = []

    for i in companies:
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


@company_bp.route("/activate/<id>", methods=["PATCH"])
@roles_accepted("admin")
def activate_company(id):
    user = security.datastore.find_user(id=id)
    if user:
        security.datastore.activate_user(user)
        security.datastore.commit()
        return id, 200
    return "ID not found", 404


@company_bp.route("/deactivate/<id>", methods=["PATCH"])
@roles_accepted("admin")
def deactivate_company(id):
    user = security.datastore.find_user(id=id)
    if user:
        for d in getattr(user, "drives", []):
            d.is_approved = False

        security.datastore.deactivate_user(user)
        security.datastore.commit()
        return id, 200
    return "ID not found", 404
