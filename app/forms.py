from flask_security.forms import RegisterFormV2
from flask_wtf.file import FileAllowed, FileField
from wtforms import SelectField, StringField, validators


class ExtendedRegisterForm(RegisterFormV2):
    name = StringField("Name", validators=[validators.DataRequired()])
    role = SelectField(
        "Type",
        choices=[("student", "Student"), ("company", "Company")],
        validators=[validators.DataRequired()],
    )
    profile_pic = FileField(
        "Profile Picture",
        validators=[FileAllowed(["jpg", "png", "jpeg"], "Images only!")],
    )
