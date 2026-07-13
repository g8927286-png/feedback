# Voz Institucional — Sistema de Recolha de Feedback

Sistema simples e completo para recolher e gerir feedback do público sobre
os serviços de uma instituição.

- **Frontend:** React + TypeScript (Vite) + Tailwind CSS
- **Backend:** Python + Flask + SQLite (via SQLAlchemy)
- **Autenticação de administração:** password + token com expiração de 8h

## Estrutura do projeto

```
feedback-institucional/
├── backend/              API Flask + base de dados SQLite
│   ├── app.py
│   ├── requirements.txt
│   └── .env.example
└── frontend/              Aplicação React (TypeScript)
    ├── src/
    └── .env.example
```

## Funcionalidades

**Página pública (`/`)**
- Formulário de feedback com classificação por estrelas (1–5), área/categoria,
  mensagem e identificação opcional (nome/email).
- Validação em tempo real e confirmação de envio.
- Mostrador de satisfação institucional em destaque.

**Área de administração (`/admin`)**
- Login protegido por password.
- Painel com índice de satisfação, distribuição por classificação e por área.
- Lista de feedback com pesquisa e filtros (área, classificação).
- Remoção de registos.

## Como correr localmente

### 1. Backend (Flask)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # edite a password de admin dentro do ficheiro
python app.py
```

O servidor arranca em `http://localhost:5000`. A base de dados SQLite
(`feedback.db`) é criada automaticamente na primeira execução.

### 2. Frontend (React)

Em um novo terminal:

```bash
cd frontend
npm install
cp .env.example .env            # ajuste apenas se o backend não estiver em localhost:5000
npm run dev
```

A aplicação fica disponível em `http://localhost:5173`.

### 3. Aceder

- Formulário público: `http://localhost:5173`
- Área reservada: `http://localhost:5173/admin`
  (password definida em `backend/.env`, por omissão `admin123` — **altere antes de usar em produção**)

## Build para produção

```bash
cd frontend
npm run build
```

Os ficheiros estáticos ficam em `frontend/dist/` e podem ser servidos por
qualquer servidor web (Nginx, Vercel, Netlify, etc.). O backend Flask pode
ser colocado atrás de um servidor WSGI como o Gunicorn:

```bash
cd backend
pip install gunicorn
gunicorn -w 2 -b 0.0.0.0:5000 app:app
```

Lembre-se de definir `SECRET_KEY` e `ADMIN_PASSWORD` como variáveis de
ambiente reais em produção (não use os valores de exemplo).

## Personalização rápida

- **Nome da instituição:** variável `INSTITUTION_NAME` no `backend/.env`
  e textos em `frontend/src/pages/Home.tsx`.
- **Categorias de feedback:** lista `CATEGORIES` em `backend/app.py`
  (e o mesmo array em `frontend/src/pages/AdminDashboard.tsx`).
- **Cores e tipografia:** tokens de design em `frontend/tailwind.config.js`.

## Endpoints da API

| Método | Rota                  | Acesso  | Descrição                          |
|--------|------------------------|---------|-------------------------------------|
| GET    | `/api/categories`      | Público | Lista de categorias disponíveis     |
| POST   | `/api/feedback`         | Público | Submeter novo feedback              |
| POST   | `/api/admin/login`     | Público | Autenticação de administrador       |
| GET    | `/api/feedback`         | Admin   | Listar feedback (filtros opcionais) |
| DELETE | `/api/feedback/<id>`   | Admin   | Remover um registo                  |
| GET    | `/api/stats`            | Admin   | Estatísticas agregadas              |

---

Feito para ser simples de instalar, seguro por omissão e fácil de adaptar
à identidade de qualquer instituição.
