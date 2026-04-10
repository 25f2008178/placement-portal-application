import os

from flask import request
from flask.app import Flask
from flask_security.datastore import SQLAlchemyUserDatastore
from flask_security.signals import user_registered
from werkzeug.utils import secure_filename

from .models import User


def setup_signals(app: Flask, user_datastore: SQLAlchemyUserDatastore):
    @user_registered.connect_via(app)
    def assign_role_and_save_pfp(_, user: User, **extra):
        role = extra["form_data"]["role"]
        user_datastore.add_role_to_user(user, role)
        user_datastore.deactivate_user(user)

        if "profile_pic" in request.files:
            file = request.files["profile_pic"]
            if file and file.filename:
                ext = os.path.splitext(file.filename)[1].lower()
                filename = secure_filename(f"avatar_{user.id}{ext}")
                static = app.static_folder
                if not static:
                    static = "static"

                upload_path = os.path.join(static, "uploads/profiles")
                if not os.path.exists(upload_path):
                    os.makedirs(upload_path)

                file.save(os.path.join(upload_path, filename))
                user.profile_pic = filename

        user_datastore.db.session.commit()
