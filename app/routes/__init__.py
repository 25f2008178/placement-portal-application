from flask import Blueprint, render_template
from flask_security.decorators import auth_required, roles_accepted

from .api import api_bp

main = Blueprint("main", __name__)
main.register_blueprint(api_bp, url_prefix="/api")


@main.route("/")
@auth_required()
def index():
    return render_template("index.html")


@main.route("/admin")
@roles_accepted("admin")
def admin():
    return "<h1>Admin</h1>"
