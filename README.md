# Graft

A wine distribution and retail analytics platform.

## Tech Stack

### Backend
- **Framework**: Django 5.2.8
- **API**: Django REST Framework
- **Authentication**: JWT (Simple JWT)
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Admin**: Jazzmin

### Frontend
- **Framework**: Next.js 16
- **UI**: React 19, Tailwind CSS 4
- **Animations**: Framer Motion
- **Icons**: Heroicons, Lucide React
- **HTTP Client**: Axios

---

## Getting Started

### Prerequisites
- [Docker](https://www.docker.com/get-started) & Docker Compose

### Running with Docker (Recommended)

**Start both frontend and backend:**
```bash
docker-compose up
```

**Start in detached mode (background):**
```bash
docker-compose up -d
```

**Rebuild containers after dependency changes:**
```bash
docker-compose up --build
```

**Stop all services:**
```bash
docker-compose down
```

### Services

| Service  | URL                     | Description          |
|----------|-------------------------|----------------------|
| Frontend | http://localhost:3000   | Next.js application  |
| Backend  | http://localhost:8000   | Django REST API      |
| Admin    | http://localhost:8000/admin | Django Admin Panel |

---

## Running without Docker (Alternative)

### Prerequisites
- Python 3.12+
- Node.js 20+

### Backend Setup
```bash
cd backend  
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Using Make (Legacy)
```bash
# Run both services
make both

# Run frontend only
make frontend

# Run backend only
make backend

# Stop all services
make clean
```

---

## Project Structure

```
├── backend/                 # Django backend
│   ├── graftapi/           # Main API app
│   │   ├── models/         # Database models
│   │   ├── views.py        # API endpoints
│   │   ├── serializers.py  # DRF serializers
│   │   └── urls.py         # API routes
│   ├── graftapp/           # Django project settings
│   └── requirements.txt    # Python dependencies
│
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js app router pages
│   │   └── components/    # React components
│   └── package.json       # Node dependencies
│
├── docker-compose.yml      # Docker orchestration
└── Makefile               # Make commands (legacy)
```

---

## Environment Variables

Create a `.env` file in the `backend/` directory for production:

```env
DEBUG=False
SECRET_KEY=your-secret-key
DATABASE_URL=postgres://user:password@host:5432/dbname
```

---

## License

MIT