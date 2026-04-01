from flask import Blueprint

from .company import company_bp
from .student import student_bp

api_bp = Blueprint("api", __name__)
api_bp.register_blueprint(company_bp, url_prefix="/company")
api_bp.register_blueprint(student_bp, url_prefix="/student")
