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
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from sqlalchemy import func
from werkzeug.security import check_password_hash, generate_password_hash

# ---------------------------------------------------------------------------
# Configuração
# ---------------------------------------------------------------------------

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

app = Flask(__name__)

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

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name or None,
            "email": self.email or None,
            "category": self.category,
            "rating": self.rating,
            "message": self.message,
            "created_at": self.created_at.replace(tzinfo=timezone.utc).isoformat(),
        }


with app.app_context():
    db.create_all()


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


@app.get("/api/categories")
def get_categories():
    return jsonify({"categories": CATEGORIES})


@app.post("/api/feedback")
def create_feedback():
    data = request.get_json(silent=True) or {}
    errors, clean = validate_feedback_payload(data)
    if errors:
        return jsonify({"errors": errors}), 400

    feedback = Feedback(**clean)
    db.session.add(feedback)
    db.session.commit()

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
