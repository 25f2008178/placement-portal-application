from app import create_app
from app.extensions import db
from app.models import Model

app = create_app()
with app.app_context():
    Model.metadata.create_all(db.engine)

if __name__ == "__main__":
    app.run()
