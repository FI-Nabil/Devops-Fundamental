# Dockerized Notes Application

A simple full-stack Notes app built with React, Node.js (Express), and PostgreSQL — all running in Docker containers.

---

## Architecture

```
[ Browser ]
    │
    │ (Port 3000)
    ▼
┌────────────────────────────────────────────────────────┐
│  frontend (Nginx / React)        [frontend_net]        │
└──────────────────────────┬───────────────────────────────┘
                            │
                            │ (Internal Network Routing)
                            ▼
┌────────────────────────────────────────────────────────┐
│  backend (Express API)   [frontend_net & backend_net]  │
└──────────────────────────┬───────────────────────────────┘
                            │
                            │ (Internal Network Routing)
                            ▼
┌────────────────────────────────────────────────────────┐
│  db (PostgreSQL)                 [backend_net]         │
└──────────────────────────────────────────────────────────┘
```

- The **frontend** serves the web UI and talks to the backend API.
- The **backend** handles requests and talks to the database.
- The **database** stores the notes data in a Docker volume, so data isn't lost when containers restart.

---

## Prerequisites

- [Docker & Docker Compose](https://docs.docker.com/get-docker/) installed
- [Git](https://git-scm.com/downloads) installed

---

## Setup (Clean Clone)

1. **Clone the repository**

   ```bash
   git clone https://github.com/FI-Nabil/Devops-Fundamental.git
   cd Devops-Fundamental/Assignment-06-07
   ```

2. **Set up environment variables**

   Copy the example file to create your own local `.env`:

   ```bash
   cp .env.example .env
   ```

   The defaults work out of the box for local development — no changes needed.

3. **Build and start everything**

   ```bash
   docker compose up -d --build
   ```

   This builds the images and starts the frontend, backend, and database containers in the background.

---

## Using the App

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000/notes |
| Database | localhost:5433 |

---

## Stopping the App

```bash
docker compose down
```

To also delete the saved database data:

```bash
docker compose down -v
```
