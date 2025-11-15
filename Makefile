# Makefile for running frontend and backend dev servers

FRONTEND_DIR=frontend
BACKEND_DIR=backend

.PHONY: frontend backend both clean

frontend:
	cd $(FRONTEND_DIR) && npm run dev

backend:
	cd $(BACKEND_DIR) && python manage.py runserver

# Run both frontend + backend in parallel
both:
	make frontend & \
	make backend

# Kill background processes (if needed)
clean:
	pkill -f "npm run dev" || true
	pkill -f "manage.py runserver" || true
