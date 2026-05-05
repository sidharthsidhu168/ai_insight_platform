from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import mongo
from services.data_processor import load_and_clean, get_summary_stats, detect_anomalies
from services.ml_engine import run_linear_regression, run_clustering, generate_trend
import os

insights_bp = Blueprint("insights", __name__)


# =========================
# 🔐 SECURE FILE PATH HELPER
# =========================
def get_file_path(dataset_id, user_id):
    """Get file path ONLY if user owns the dataset"""
    try:
        dataset = mongo.db.datasets.find_one({
            "dataset_id": dataset_id,
            "user_id": user_id
        })

        if not dataset:
            return None, None

        return os.path.join("uploads", dataset["saved_as"]), dataset

    except Exception:
        return None, None


# =========================
# 📊 SUMMARY
# =========================
@insights_bp.route("/summary/<dataset_id>", methods=["GET"])
@jwt_required()
def summary(dataset_id):
    try:
        user_id = get_jwt_identity()

        path, dataset = get_file_path(dataset_id, user_id)
        if not path:
            return jsonify({"error": "Dataset not found or access denied"}), 403

        df = load_and_clean(path)
        stats = get_summary_stats(df)

        return jsonify({
            "dataset_id": dataset_id,
            "columns": list(df.columns),
            "row_count": len(df),
            "stats": stats
        }), 200

    except Exception as e:
        return jsonify({"error": "Failed to generate summary", "details": str(e)}), 500


# =========================
# ⚠️ ANOMALIES
# =========================
@insights_bp.route("/anomalies/<dataset_id>", methods=["GET"])
@jwt_required()
def anomalies(dataset_id):
    try:
        user_id = get_jwt_identity()

        column = request.args.get("column")
        if not column:
            return jsonify({"error": "Column parameter required"}), 400

        path, _ = get_file_path(dataset_id, user_id)
        if not path:
            return jsonify({"error": "Dataset not found or access denied"}), 403

        df = load_and_clean(path)

        if column not in df.columns:
            return jsonify({"error": f"Column '{column}' not found"}), 400

        result = detect_anomalies(df, column)

        # ✅ HANDLE ERROR FROM SERVICE
        if isinstance(result, dict) and "error" in result:
            return jsonify({"error": result["error"]}), 400

        return jsonify({
            "dataset_id": dataset_id,
            "column": column,
            "anomalies": result,
            "count": len(result)
        }), 200

    except Exception as e:
        return jsonify({"error": "Failed to detect anomalies", "details": str(e)}), 500


# =========================
# 📉 REGRESSION
# =========================
@insights_bp.route("/regression/<dataset_id>", methods=["POST"])
@jwt_required()
def regression(dataset_id):
    try:
        user_id = get_jwt_identity()

        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body required"}), 400

        target = data.get("target")
        features = data.get("features", [])

        if not target or not features:
            return jsonify({"error": "Target and features required"}), 400

        if not isinstance(features, list) or len(features) == 0:
            return jsonify({"error": "Features must be a non-empty array"}), 400

        path, _ = get_file_path(dataset_id, user_id)
        if not path:
            return jsonify({"error": "Dataset not found or access denied"}), 403

        df = load_and_clean(path)

        if target not in df.columns:
            return jsonify({"error": f"Target column '{target}' not found"}), 400

        for feature in features:
            if feature not in df.columns:
                return jsonify({"error": f"Feature column '{feature}' not found"}), 400

        result = run_linear_regression(df, target, features)

        if "error" in result:
            return jsonify({"error": result["error"]}), 400

        return jsonify({
            "dataset_id": dataset_id,
            "analysis": result
        }), 200

    except Exception as e:
        return jsonify({"error": "Regression analysis failed", "details": str(e)}), 500


# =========================
# 🎯 CLUSTERING
# =========================
@insights_bp.route("/cluster/<dataset_id>", methods=["POST"])
@jwt_required()
def cluster(dataset_id):
    try:
        user_id = get_jwt_identity()

        data = request.get_json()
        n_clusters = data.get("n_clusters", 3) if data else 3

        if not isinstance(n_clusters, int) or n_clusters < 2 or n_clusters > 10:
            return jsonify({"error": "n_clusters must be between 2 and 10"}), 400

        path, _ = get_file_path(dataset_id, user_id)
        if not path:
            return jsonify({"error": "Dataset not found or access denied"}), 403

        df = load_and_clean(path)
        result = run_clustering(df, n_clusters)

        if "error" in result:
            return jsonify({"error": result["error"]}), 400

        return jsonify({
            "dataset_id": dataset_id,
            "analysis": result
        }), 200

    except Exception as e:
        return jsonify({"error": "Clustering failed", "details": str(e)}), 500


# =========================
# 📈 TREND (FIXED 🔥)
# =========================
@insights_bp.route("/trend/<dataset_id>", methods=["GET"])
@jwt_required()
def trend(dataset_id):
    try:
        user_id = get_jwt_identity()  # 🔥 THIS WAS MISSING

        column = request.args.get("column")
        if not column:
            return jsonify({"error": "Column parameter required"}), 400

        path, _ = get_file_path(dataset_id, user_id)  # 🔥 FIXED
        if not path:
            return jsonify({"error": "Dataset not found or access denied"}), 403

        df = load_and_clean(path)

        if column not in df.columns:
            return jsonify({"error": f"Column '{column}' not found"}), 400

        result = generate_trend(df, column)

        if "error" in result:
            return jsonify({"error": result["error"]}), 400

        return jsonify({
            "dataset_id": dataset_id,
            "column": column,
            "values": result["values"],
            "rolling_mean": result["rolling_mean"]
        }), 200

    except Exception as e:
        return jsonify({"error": "Trend analysis failed", "details": str(e)}), 500