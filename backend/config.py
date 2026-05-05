import os
from dotenv import load_dotenv
load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-in-production")
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/ai_platform")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-secret-change-this")
    UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads")
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload