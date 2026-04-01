from flask import Blueprint
from flask_security.decorators import roles_accepted

from app.extensions import security
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


@company_bp.route("/activate/<id>")
@roles_accepted("admin")
def activate_company(id):
    user = security.datastore.find_user(id=id)
    if user:
        security.datastore.activate_user(user)
        security.datastore.commit()
        return id, 200
    return "ID not found", 404
