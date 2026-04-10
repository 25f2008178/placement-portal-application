from flask import Blueprint, request
from flask_login import current_user
from flask_security.decorators import roles_accepted

from app.extensions import db
from app.models import Application, ApplicationStatus, RecruitmentDrive

application_bp = Blueprint("application", __name__)


@application_bp.route("/apply/<int:drive_id>", methods=["POST"])
@roles_accepted("student")
def apply_to_drive(drive_id):
    drive = db.session.get(RecruitmentDrive, drive_id)

    if not drive:
        return {"error": "Recruitment drive not found"}, 404

    if drive.is_closed:
        return {"error": "This recruitment drive is closed"}, 400

    existing_application = (
        db.session.query(Application)
        .filter_by(drive_id=drive_id, student_id=current_user.id)
        .first()
    )

    if existing_application:
        return {"error": "You have already applied to this drive"}, 400

    data = request.get_json() or {}
    resume_link = data.get("resume_link")

    new_application = Application(
        drive_id=drive.id,
        student_id=current_user.id,
        status=ApplicationStatus.APPLIED,
        resume_link=resume_link,
    )

    try:
        db.session.add(new_application)
        db.session.commit()
        return {
            "message": "Application submitted successfully",
            "application_id": new_application.id,
        }, 201
    except Exception as e:
        db.session.rollback()
        return {"error": str(e)}, 500


@application_bp.route("/my-applications", methods=["GET"])
@roles_accepted("student")
def get_my_applications():
    apps = []
    for app in current_user.applications:
        apps.append(
            {
                "drive_title": app.drive.title,
                "status": app.status.value,
                "applied_at": app.created_at.isoformat(),
            }
        )
    return apps, 200


@application_bp.route("/update-status/<int:application_id>", methods=["PATCH"])
@roles_accepted("company")
def update_application_status(application_id):
    application = db.session.get(Application, application_id)

    if not application:
        return {"error": "Application not found"}, 404

    if application.drive.company_id != current_user.id:
        return {"error": "Unauthorized: You do not manage this recruitment drive"}, 403

    data = request.get_json()
    new_status_name = data.get("status").upper()

    if not new_status_name or new_status_name not in ApplicationStatus.__members__:
        return {
            "error": "Invalid status",
            "allowed_statuses": list(ApplicationStatus.__members__.keys()),
        }, 400

    try:
        application.status = ApplicationStatus[new_status_name]
        db.session.commit()
        return {
            "message": f"Status updated to {application.status.value}",
            "application_id": application.id,
            "new_status": application.status.value,
        }, 200
    except Exception as e:
        db.session.rollback()
        return {"error": str(e)}, 500
