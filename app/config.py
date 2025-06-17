from dotenv import load_dotenv
import os

load_dotenv()

class Config:
    # Configuración general
    SECRET_KEY = os.getenv('SECRET_KEY', 'clave-secreta-por-defecto-solo-para-desarrollo')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'clave-jwt-secreta-por-defecto-solo-para-desarrollo')

    # Configuración JWT
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 10800))  # 3 horas
    PROPAGATE_EXCEPTIONS = True

    # Configuración de la base de datos
    DB_USER = os.getenv('DB_USER')
    DB_PASSWORD = os.getenv('DB_PASSWORD')
    DB_HOST = os.getenv('DB_HOST')
    DB_NAME = os.getenv('DB_NAME')
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Configuración de correo
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.getenv('MAIL_USERNAME', 'gabrielvelilla.56@example.com')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', '123456')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', 'gabrielvelilla.56@gmail.com')

    required_keys = [
        'SECRET_KEY',
        'JWT_SECRET_KEY',
        'SQLALCHEMY_DATABASE_URI',
        'MAIL_USERNAME',
        'MAIL_PASSWORD',
        'MAIL_DEFAULT_SENDER'
    ]

    @classmethod
    def validate_config(cls):
        for key in cls.required_keys:
            value = getattr(cls, key, None)
            if not value or (isinstance(value, str) and value.startswith('clave-')):
                raise ValueError(f"Configuración inválida o faltante para {key}")

# Advertencias fuera de la clase
if not Config.SQLALCHEMY_DATABASE_URI:
    print("Advertencia: Falta la variable DATABASE_URL en el archivo .env, usando SQLite por defecto.")
if not Config.SECRET_KEY:
    print("Advertencia: Falta la variable SECRET_KEY en el archivo .env, usando valor por defecto.")
if not Config.JWT_SECRET_KEY:
    print("Advertencia: Falta la variable JWT_SECRET_KEY en el archivo .env, usando valor por defecto.")

# Validar configuración al cargar
Config.validate_config()