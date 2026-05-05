from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from extensions import mongo, jwt

app = Flask(__name__)
app.config.from_object(Config)

mongo.init_app(app)
jwt.init_app(app)

# ✅ CORS configuration (clean - no manual headers needed)
CORS(app, 
     origins=["http://localhost:5173", "http://localhost:3000"],
     supports_credentials=True,
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"])

# ✅ Global error handlers
@app.errorhandler(400)
def bad_request(error):
    return jsonify({"error": "Invalid JSON or bad request"}), 400

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

@app.errorhandler(401)
def unauthorized(error):
    return jsonify({"error": "Unauthorized - invalid or missing token"}), 401

# Register route blueprints
from routes.auth import auth_bp
from routes.upload import upload_bp
from routes.insights import insights_bp
from routes.export import export_bp

app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(upload_bp, url_prefix="/api/upload")
app.register_blueprint(insights_bp, url_prefix="/api/insights")
app.register_blueprint(export_bp, url_prefix="/api/export")

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy"}), 200

if __name__ == "__main__":
    app.run(debug=True, port=5000)