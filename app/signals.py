from flask.app import Flask
from flask_security.datastore import SQLAlchemyUserDatastore
from flask_security.signals import user_registered

from .models import User


def setup_signals(app: Flask, user_datastore: SQLAlchemyUserDatastore):

    @user_registered.connect_via(app)
    def assign_role(_, user: User, **extra):
        role = extra["form_data"]["role"]
        user_datastore.add_role_to_user(user, role)
        user_datastore.deactivate_user(user)
        user_datastore.db.session.commit()
