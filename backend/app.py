"""
Sistema de Recolha de Feedback — Backend
=========================================
Flask + SQLite (via SQLAlchemy). API REST simples e segura para
recolher feedback do público e permitir consulta/gestão por um
administrador da instituição.
"""

import os
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory, url_for
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from sqlalchemy import func
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename
import time

# ---------------------------------------------------------------------------
# Configuração
# ---------------------------------------------------------------------------

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

app = Flask(__name__)

# Uploads
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
ALLOWED_AUDIO_EXT = {"wav", "mp3", "m4a", "ogg", "webm", "aac"}
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

database_url = os.environ.get("DATABASE_URL")
if database_url:
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+psycopg://", 1)
    elif database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)
    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
else:
    DB_PATH = os.path.join(BASE_DIR, "feedback.db")
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DB_PATH}"

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Segredo usado para assinar os tokens de sessão do administrador.
# Em produção, define a variável de ambiente SECRET_KEY.
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "muda-esta-chave-em-producao")

# Password de acesso à área de administração.
# Em produção, define a variável de ambiente ADMIN_PASSWORD.
ADMIN_PASSWORD_HASH = generate_password_hash(
    os.environ.get("ADMIN_PASSWORD", "admin123")
)

# Nome da instituição, usado apenas para referência/labels no backend.
INSTITUTION_NAME = os.environ.get("INSTITUTION_NAME", "A Nossa Instituição")

TOKEN_MAX_AGE_SECONDS = 60 * 60 * 8  # 8 horas de sessão

CORS(app, resources={r"/api/*": {"origins": "*"}})

db = SQLAlchemy(app)
serializer = URLSafeTimedSerializer(app.config["SECRET_KEY"])

CATEGORIES = [
    "Atendimento",
    "Instalações",
    "Serviços Online",
    "Comunicação",
    "Sugestão",
    "Outro",
]


# ---------------------------------------------------------------------------
# Modelo de dados
# ---------------------------------------------------------------------------

class Feedback(db.Model):
    __tablename__ = "feedback"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=True)
    email = db.Column(db.String(180), nullable=True)
    category = db.Column(db.String(60), nullable=False, default="Outro")
    rating = db.Column(db.Integer, nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    audio_filename = db.Column(db.String(260), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name or None,
            "email": self.email or None,
            "category": self.category,
            "rating": self.rating,
            "message": self.message,
            "created_at": self.created_at.replace(tzinfo=timezone.utc).isoformat(),
            "audio_url": f"/uploads/{self.audio_filename}" if self.audio_filename else None,
        }


with app.app_context():
    db.create_all()
    # Ensure `audio_filename` column exists (for existing SQLite DBs without migrations)
    try:
        inspector = db.inspect(db.engine)
        cols = [c['name'] for c in inspector.get_columns('feedback')]
        if 'audio_filename' not in cols:
            try:
                print('[startup] adding audio_filename column to feedback table')
                if db.engine.dialect.name == 'sqlite':
                    db.engine.execute('ALTER TABLE feedback ADD COLUMN audio_filename VARCHAR(260)')
                else:
                    db.engine.execute('ALTER TABLE feedback ADD COLUMN audio_filename VARCHAR(260)')
                print('[startup] audio_filename column added')
            except Exception:
                print('[startup] failed to add audio_filename column; continuing')
    except Exception:
        # If inspection fails, ignore — application can still run and create models for new DBs
        pass


# ---------------------------------------------------------------------------
# Auxiliares
# ---------------------------------------------------------------------------

def require_admin(fn):
    """Decorator simples que valida o token Bearer emitido no login."""

    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Não autorizado."}), 401

        token = auth_header.split(" ", 1)[1]
        try:
            serializer.loads(token, max_age=TOKEN_MAX_AGE_SECONDS)
        except SignatureExpired:
            return jsonify({"error": "Sessão expirada. Inicie sessão novamente."}), 401
        except BadSignature:
            return jsonify({"error": "Token inválido."}), 401

        return fn(*args, **kwargs)

    wrapper.__name__ = fn.__name__
    return wrapper


def validate_feedback_payload(data):
    errors = {}
    rating = data.get("rating")
    # Try to coerce numeric rating strings to int
    try:
        if rating is not None and not isinstance(rating, int):
            rating = int(rating)
    except Exception:
        rating = None

    if not isinstance(rating, int) or not (1 <= rating <= 5):
        errors["rating"] = "A classificação deve ser um número inteiro entre 1 e 5."

    message = (data.get("message") or "").strip()
    if len(message) < 5:
        errors["message"] = "A mensagem deve ter pelo menos 5 caracteres."
    if len(message) > 2000:
        errors["message"] = "A mensagem não pode exceder 2000 caracteres."

    category = (data.get("category") or "Outro").strip()
    if category not in CATEGORIES:
        category = "Outro"

    email = (data.get("email") or "").strip()
    if email and ("@" not in email or "." not in email.split("@")[-1]):
        errors["email"] = "Indique um email válido ou deixe o campo em branco."

    return errors, {
        "name": (data.get("name") or "").strip()[:120] or None,
        "email": email[:180] or None,
        "category": category,
        "rating": rating,
        "message": message,
    }


# ---------------------------------------------------------------------------
# Rotas públicas
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "institution": INSTITUTION_NAME})


@app.get("/")
def index():
    return jsonify({
        "status": "welcome",
        "message": "Feedback backend is running. Use /api/health or /api/feedback.",
        "documentation": "/api/health"
    })


@app.get("/api/categories")
def get_categories():
    return jsonify({"categories": CATEGORIES})


@app.post("/api/feedback")
def create_feedback():
    # Support JSON and multipart/form-data (with optional audio file)
    if request.content_type and "multipart/form-data" in request.content_type:
        form = request.form or {}
        # convert rating to int when possible
        if "rating" in form:
            try:
                form_data = dict(form)
                form_data["rating"] = int(form["rating"])
            except Exception:
                form_data = dict(form)
        else:
            form_data = dict(form)
        data = form_data
    else:
        data = request.get_json(silent=True) or {}

    # Debugging: log incoming payload
    print("[create_feedback] incoming data:", data)
    if hasattr(request, "files"):
        print("[create_feedback] files:", list(request.files.keys()))

    errors, clean = validate_feedback_payload(data)
    if errors:
        return jsonify({"errors": errors}), 400

    # Handle audio file if present
    audio_file = request.files.get("audio") if hasattr(request, "files") else None
    if audio_file and audio_file.filename:
        filename = secure_filename(audio_file.filename)
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if ext in ALLOWED_AUDIO_EXT:
            unique = f"{int(time.time()*1000)}_{filename}"
            save_path = os.path.join(app.config["UPLOAD_FOLDER"], unique)
            try:
                audio_file.save(save_path)
                clean["audio_filename"] = unique
            except Exception:
                import traceback

                traceback.print_exc()
                # don't fail the whole request just because audio couldn't be saved
                print(f"[create_feedback] failed to save audio to {save_path}")

    # Create model only with actual DB columns (handles existing DB without migrations)
    try:
        if db.engine.dialect.name == "sqlite":
            # pragma returns rows: (cid, name, type, notnull, dflt_value, pk)
            rows = db.session.execute("PRAGMA table_info(feedback)").all()
            db_cols = {r[1] for r in rows}
        else:
            inspector = db.inspect(db.engine)
            db_cols = {c["name"] for c in inspector.get_columns("feedback")}
    except Exception:
        # fallback to model columns if inspection fails
        db_cols = {c.name for c in Feedback.__table__.columns}

    model_kwargs = {k: v for k, v in clean.items() if k in db_cols}
    print("[create_feedback] db_cols:", db_cols)
    print("[create_feedback] model_kwargs:", model_kwargs)
    feedback = Feedback(**model_kwargs)
    db.session.add(feedback)
    try:
        db.session.commit()
    except Exception as e:
        import traceback

        traceback.print_exc()
+        # If failure due to missing audio_filename column, attempt to add column and retry once
+        msg = str(e).lower()
+        if "audio_filename" in msg or "no column named audio_filename" in msg:
+            try:
+                print("[create_feedback] adding missing column audio_filename and retrying commit")
+                if db.engine.dialect.name == "sqlite":
+                    db.session.execute('ALTER TABLE feedback ADD COLUMN audio_filename VARCHAR(260)')
+                else:
+                    db.session.execute('ALTER TABLE feedback ADD COLUMN audio_filename VARCHAR(260)')
+                db.session.commit()
+                return jsonify({"message": "Obrigado pelo seu feedback!", "feedback": feedback.to_dict()}), 201
+            except Exception:
+                traceback.print_exc()
+
        db.session.rollback()
        return (
            jsonify({"error": "Erro interno ao gravar feedback. Verifique os logs do servidor."}),
            500,
        )

    return jsonify({"message": "Obrigado pelo seu feedback!", "feedback": feedback.to_dict()}), 201


# ---------------------------------------------------------------------------
# Autenticação de administrador
# ---------------------------------------------------------------------------

@app.post("/api/admin/login")
def admin_login():
    data = request.get_json(silent=True) or {}
    password = data.get("password", "")

    if not check_password_hash(ADMIN_PASSWORD_HASH, password):
        return jsonify({"error": "Password incorreta."}), 401

    token = serializer.dumps({"role": "admin"})
    return jsonify({"token": token, "institution": INSTITUTION_NAME})


# ---------------------------------------------------------------------------
# Rotas de administração (protegidas)
# ---------------------------------------------------------------------------

@app.get("/api/feedback")
@require_admin
def list_feedback():
    query = Feedback.query

    category = request.args.get("category")
    if category and category in CATEGORIES:
        query = query.filter(Feedback.category == category)

    rating = request.args.get("rating")
    if rating and rating.isdigit():
        query = query.filter(Feedback.rating == int(rating))

    search = request.args.get("search")
    if search:
        like = f"%{search}%"
        query = query.filter(
            db.or_(Feedback.message.ilike(like), Feedback.name.ilike(like))
        )

    items = query.order_by(Feedback.created_at.desc()).all()
    return jsonify({"feedback": [item.to_dict() for item in items], "total": len(items)})


@app.delete("/api/feedback/<int:feedback_id>")
@require_admin
def delete_feedback(feedback_id):
    item = Feedback.query.get_or_404(feedback_id)
    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Feedback removido."})


@app.get("/api/stats")
@require_admin
def stats():
    total = db.session.query(func.count(Feedback.id)).scalar() or 0
    avg_rating = db.session.query(func.avg(Feedback.rating)).scalar() or 0

    by_rating = dict(
        db.session.query(Feedback.rating, func.count(Feedback.id))
        .group_by(Feedback.rating)
        .all()
    )
    rating_distribution = {str(r): by_rating.get(r, 0) for r in range(1, 6)}

    by_category = dict(
        db.session.query(Feedback.category, func.count(Feedback.id))
        .group_by(Feedback.category)
        .all()
    )
    category_distribution = {cat: by_category.get(cat, 0) for cat in CATEGORIES}

    since = datetime.now(timezone.utc) - timedelta(days=13)
    recent = (
        Feedback.query.filter(Feedback.created_at >= since)
        .order_by(Feedback.created_at.asc())
        .all()
    )
    daily_counts = {}
    for item in recent:
        day = item.created_at.strftime("%Y-%m-%d")
        daily_counts[day] = daily_counts.get(day, 0) + 1

    trend = []
    for i in range(13, -1, -1):
        day = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
        trend.append({"date": day, "count": daily_counts.get(day, 0)})

    positive = by_rating.get(4, 0) + by_rating.get(5, 0)
    satisfaction_rate = round((positive / total) * 100, 1) if total else 0.0

    return jsonify(
        {
            "total": total,
            "average_rating": round(avg_rating, 2),
            "satisfaction_rate": satisfaction_rate,
            "rating_distribution": rating_distribution,
            "category_distribution": category_distribution,
            "trend": trend,
        }
    )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=False, host="0.0.0.0", port=port)


@app.get("/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)
