from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import pandas as pd
import os, uuid, datetime

upload_bp = Blueprint("upload", __name__)

ALLOWED_EXTENSIONS = {"csv", "xlsx", "xls"}


# =========================
# 📁 FILE TYPE CHECK
# =========================
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# =========================
# 📤 UPLOAD FILE
# =========================
@upload_bp.route("/file", methods=["POST"])
@jwt_required()
def upload_file():
    try:
        user_id = get_jwt_identity()

        # ❌ No file
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files["file"]

        # ❌ No filename
        if not file or file.filename.strip() == "":
            return jsonify({"error": "No file selected"}), 400

        # ❌ Wrong file type
        if not allowed_file(file.filename):
            return jsonify({"error": "Only CSV and Excel files allowed"}), 400

        # 📁 Create uploads folder
        os.makedirs("uploads", exist_ok=True)

        # 🔐 Secure + unique filename
        filename = secure_filename(file.filename)
        unique_name = f"{uuid.uuid4()}_{filename}"
        save_path = os.path.join("uploads", unique_name)

        # 💾 Save file
        file.save(save_path)

        # =========================
        # 📊 VALIDATE DATASET
        # =========================
        try:
            if filename.lower().endswith(".csv"):
                df = pd.read_csv(save_path)
            else:
                df = pd.read_excel(save_path)

            if df.empty:
                os.remove(save_path)
                return jsonify({"error": "File is empty"}), 400

            columns = list(df.columns)
            row_count = len(df)

        except Exception as e:
            if os.path.exists(save_path):
                os.remove(save_path)
            return jsonify({"error": f"Could not parse file: {str(e)}"}), 400

        # =========================
        # 🗄 STORE METADATA
        # =========================
        try:
            from extensions import mongo

            dataset_id = str(uuid.uuid4())

            mongo.db.datasets.insert_one({
                "dataset_id": dataset_id,
                "user_id": user_id,  # 🔐 ownership stored
                "filename": filename,
                "saved_as": unique_name,
                "columns": columns,
                "row_count": row_count,
                "uploaded_at": datetime.datetime.utcnow()
            })

        except Exception as e:
            if os.path.exists(save_path):
                os.remove(save_path)
            return jsonify({"error": f"Database error: {str(e)}"}), 500

        # =========================
        # ✅ SUCCESS RESPONSE
        # =========================
        return jsonify({
            "message": "File uploaded successfully",
            "dataset_id": dataset_id,
            "filename": filename,
            "columns": columns,
            "row_count": row_count
        }), 201

    except Exception as e:
        return jsonify({
            "error": "Upload failed",
            "details": str(e)
        }), 500


# =========================
# 📂 GET USER DATASETS
# =========================
@upload_bp.route("/datasets", methods=["GET"])
@jwt_required()
def get_datasets():
    try:
        user_id = get_jwt_identity()
        from extensions import mongo

        # 🔐 ONLY USER DATA
        datasets = list(
            mongo.db.datasets.find(
                {"user_id": user_id},
                {"_id": 0, "saved_as": 0}
            ).sort("uploaded_at", -1)
        )

        # ✅ Explicit empty response
        if not datasets:
            return jsonify({"datasets": []}), 200

        return jsonify({"datasets": datasets}), 200

    except Exception as e:
        return jsonify({
            "error": "Failed to fetch datasets",
            "details": str(e)
        }), 500