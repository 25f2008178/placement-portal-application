from flask import Blueprint, request
from flask_login import current_user
from flask_security.decorators import roles_accepted

from app.extensions import db
from app.models import RecruitmentDrive

placement_bp = Blueprint("placement", __name__)


@placement_bp.route("/get_drives")
@roles_accepted("admin", "student")
def get_drives():
    drives = db.session.query(RecruitmentDrive).all()
    response = []

    for i in drives:
        response.append(
            {
                "id": i.id,
                "title": i.title,
                "description": i.description,
                "requirements": i.requirements,
                "is_approved": i.is_approved,
                "is_closed": i.is_closed,
                "company_id": i.company_id,
                "created_at": i.created_at,
            }
        )

    return response


@placement_bp.route("/create_drive", methods=["POST"])
@roles_accepted("company")
def create_drive():
    if current_user.active:
        data = request.json
        title = data.get("title")
        description = data.get("description")
        requirements = data.get("requirements")

        new_drive = RecruitmentDrive(
            title=title,
            description=description,
            requirements=requirements,
            company_id=current_user.id,
        )

        try:
            db.session.add(new_drive)
            db.session.commit()
            return str(new_drive.id), 201
        except Exception as e:
            db.session.rollback()
            return str(e), 500
    else:
        return "Company isn't active", 403


@placement_bp.route("/my_drives", methods=["GET"])
@roles_accepted("company")
def get_company_drives():
    drives = current_user.drives

    if not drives:
        return []

    results = []
    for drive in drives:
        results.append(
            {
                "id": drive.id,
                "title": drive.title,
                "description": drive.description,
                "is_approved": drive.is_approved,
                "is_closed": drive.is_closed,
                "created_at": drive.created_at.isoformat(),
                "application_count": len(drive.applications),
            }
        )

    return results


@placement_bp.route("/get_drives/<int:drive_id>", methods=["GET"])
@roles_accepted("company", "admin")
def get_drive_detail(drive_id):
    drive = db.session.get(RecruitmentDrive, drive_id)

    if not drive or (
        drive.company_id != current_user.id and not current_user.has_role("admin")
    ):
        return {"error": "Drive not found or access denied"}, 404

    app_list = []
    for app in drive.applications:
        app_list.append(
            {
                "application_id": app.id,
                "student_id": app.student_id,
                "student_name": app.student.name,
                "status": app.status.value,
                "resume_link": app.resume_link,
                "applied_at": app.created_at.isoformat(),
            }
        )

    return {
        "id": drive.id,
        "title": drive.title,
        "description": drive.description,
        "requirements": drive.requirements,
        "is_approved": drive.is_approved,
        "is_closed": drive.is_closed,
        "created_at": drive.created_at.isoformat(),
        "applications": app_list,
        "total_applications": len(app_list),
    }


@placement_bp.route("/approve_drive/<id>", methods=["PATCH"])
@roles_accepted("admin")
def approve_drive(id):
    try:
        drive_query = db.session.query(RecruitmentDrive).filter(
            RecruitmentDrive.id == id
        )
        drive = drive_query.first()

        if not drive:
            return {"error": "Drive not found"}, 404

        company = drive.company

        if not company.is_active:
            return {"error": "Company is not active"}, 401

        drive_query.update({RecruitmentDrive.is_approved: True})
        db.session.commit()
        return id
    except Exception as e:
        db.session.rollback()
        return {"error": str(e)}, 500


@placement_bp.route("/reject_drive/<id>", methods=["PATCH"])
@roles_accepted("admin")
def reject_drive(id):
    try:
        db.session.query(RecruitmentDrive).filter(RecruitmentDrive.id == id).update(
            {RecruitmentDrive.is_approved: False}
        )
        db.session.commit()
        return id
    except Exception as e:
        db.session.rollback()
        return str(e), 500


@placement_bp.route("/edit_drive/<id>", methods=["PUT"])
@roles_accepted("company")
def edit_drive(id):
    drive = (
        db.session.query(RecruitmentDrive).filter(RecruitmentDrive.id == id).all()[0]
    )
    if current_user.id == drive.company_id:
        data = request.json
        title = data.get("title")
        description = data.get("description")
        requirements = data.get("requirements")
        is_closed = data.get("is_closed")

        try:
            db.session.query(RecruitmentDrive).filter(RecruitmentDrive.id == id).update(
                {
                    RecruitmentDrive.title: title if title else drive.title,
                    RecruitmentDrive.description: description
                    if description
                    else drive.description,
                    RecruitmentDrive.requirements: requirements
                    if requirements
                    else drive.requirements,
                    RecruitmentDrive.is_closed: is_closed
                    if is_closed
                    else drive.is_closed,
                }
            )
            db.session.commit()
            return id
        except Exception as e:
            db.session.rollback()
            return str(e), 500
    else:
        return "You do not own this recruitment drive", 401


@placement_bp.route("/remove_drive/<id>", methods=["DELETE"])
@roles_accepted("company")
def remove_drive(id):
    drive = (
        db.session.query(RecruitmentDrive).filter(RecruitmentDrive.id == id).all()[0]
    )
    if current_user.id == drive.company_id:
        try:
            db.session.query(RecruitmentDrive).filter(
                RecruitmentDrive.id == id
            ).delete()
            db.session.commit()
            return id
        except Exception as e:
            db.session.rollback()
            return str(e), 500
    else:
        return "You do not own this recruitment drive", 401
