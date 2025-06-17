from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_marshmallow import Marshmallow
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_mail import Mail

db = SQLAlchemy()
bcrypt = Bcrypt()
ma = Marshmallow()
jwt = JWTManager()
migrate = Migrate()
mail = Mail()
