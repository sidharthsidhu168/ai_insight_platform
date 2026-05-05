from flask import Blueprint, make_response, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from fpdf import FPDF
from services.data_processor import load_and_clean, get_summary_stats
from extensions import mongo
import io, os

export_bp = Blueprint("export", __name__)


# =========================
# 🔐 SECURE DATASET PATH
# =========================
def get_dataset_path(dataset_id, user_id):
    """Get dataset path ONLY if user owns it"""
    try:
        d = mongo.db.datasets.find_one({
            "dataset_id": dataset_id,
            "user_id": user_id
        })

        if not d:
            return None

        return os.path.join("uploads", d["saved_as"])

    except Exception:
        return None


# =========================
# 📄 EXPORT CSV
# =========================
@export_bp.route("/csv/<dataset_id>", methods=["GET"])
@jwt_required()
def export_csv(dataset_id):
    try:
        user_id = get_jwt_identity()  # 🔥 ADD

        path = get_dataset_path(dataset_id, user_id)  # 🔥 FIX
        if not path or not os.path.exists(path):
            return jsonify({"error": "Dataset not found or access denied"}), 403

        df = load_and_clean(path)

        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)

        response = make_response(output.getvalue())
        response.headers["Content-Disposition"] = f"attachment; filename=export_{dataset_id}.csv"
        response.headers["Content-Type"] = "text/csv"

        return response

    except Exception as e:
        return jsonify({
            "error": "Failed to export CSV",
            "details": str(e)
        }), 500


# =========================
# 📑 EXPORT PDF
# =========================
@export_bp.route("/pdf/<dataset_id>", methods=["GET"])
@jwt_required()
def export_pdf(dataset_id):
    try:
        user_id = get_jwt_identity()  # 🔥 ADD

        path = get_dataset_path(dataset_id, user_id)  # 🔥 FIX
        if not path or not os.path.exists(path):
            return jsonify({"error": "Dataset not found or access denied"}), 403

        df = load_and_clean(path)
        stats = get_summary_stats(df)

        pdf = FPDF()
        pdf.add_page()

        # Title
        pdf.set_font("Helvetica", "B", 16)
        pdf.cell(0, 12, "AI Insights Report", ln=True)

        # Basic Info
        pdf.set_font("Helvetica", "", 12)
        pdf.cell(0, 8, f"Dataset: {dataset_id}", ln=True)
        pdf.cell(0, 8, f"Total rows: {len(df)}", ln=True)
        pdf.ln(4)

        # Stats
        pdf.set_font("Helvetica", "B", 13)
        pdf.cell(0, 10, "Column Summary Statistics", ln=True)

        pdf.set_font("Helvetica", "", 11)
        for col, s in stats.items():
            pdf.cell(
                0,
                8,
                f"{col}: mean={s['mean']}, min={s['min']}, max={s['max']}",
                ln=True
            )

        # Generate response
        response = make_response(pdf.output(dest="S").encode("latin-1"))
        response.headers["Content-Disposition"] = f"attachment; filename=report_{dataset_id}.pdf"
        response.headers["Content-Type"] = "application/pdf"

        return response

    except Exception as e:
        return jsonify({
            "error": "Failed to export PDF",
            "details": str(e)
        }), 500