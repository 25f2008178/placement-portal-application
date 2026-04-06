from flask import Blueprint, request
from flask_login import current_user
from flask_security.decorators import roles_accepted

from app.extensions import db
from app.models import RecruitmentDrive

placement_bp = Blueprint("placement", __name__)


@placement_bp.route("/get_drives")
@roles_accepted("admin", "students")
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


@placement_bp.route("/approve_drive/<id>", methods=["PATCH"])
@roles_accepted("admin")
def approve_drive(id):
    try:
        db.session.query(RecruitmentDrive).filter(RecruitmentDrive.id == id).update(
            {RecruitmentDrive.is_approved: True}
        )
        db.session.commit()
        return id
    except Exception as e:
        db.session.rollback()
        return str(e), 500


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
