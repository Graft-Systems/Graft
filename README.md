# Graft

Graft is a full-stack application for managing wine distribution, inventory, and sales. It consists of a Django REST API backend and a Next.js frontend.

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Graft-Systems/Graft.git
   cd Graft
   ```

2. (Recommended) Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Set up the backend:
   ```bash
   cd backend
   pip install -r requirements.txt
   python manage.py migrate
   # Optional: Load sample data
   python manage.py load_graft_sample_data
   ```

3. Set up the frontend:
   ```bash
   cd ../frontend
   npm install
   ```

4. Run the development servers:
   ```bash
   # From the root directory
   make both
   ```
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000

### Usage

- Access the application at http://localhost:3000
- Admin panel: http://localhost:8000/admin
- Create a superuser: `python manage.py createsuperuser`

## Project Structure

- `backend/`: Django REST API
- `frontend/`: Next.js application
- `Makefile`: Convenience commands for development

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

[Add license information here]