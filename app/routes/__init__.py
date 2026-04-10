from flask import Blueprint, redirect, render_template, url_for
from flask_login import current_user
from flask_security.decorators import auth_required, roles_accepted

from .api import api_bp

main = Blueprint("main", __name__)
main.register_blueprint(api_bp, url_prefix="/api")


@main.route("/")
@auth_required()
def index():
    if current_user.has_role("admin"):
        return redirect(url_for("main.admin_dashboard"))
    elif current_user.has_role("company"):
        return redirect(url_for("main.company_dashboard"))
    elif current_user.has_role("student"):
        return redirect(url_for("main.student_dashboard"))


@main.route("/admin")
@roles_accepted("admin")
def admin_dashboard():
    return render_template("admin_dashboard.html")


@main.route("/company")
@roles_accepted("company")
def company_dashboard():
    return render_template("company_dashboard.html")


@main.route("/student")
@roles_accepted("company")
def student_dashboard():
    return render_template("student_dashboard.html")
