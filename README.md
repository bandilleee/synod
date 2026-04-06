# Synod

> **Synod** (noun): An assembly of leaders who come together to govern, deliberate, and act in unity.

A collaboration platform for community leaders across multiple organizations to send newsletters, build forms, plan events, and maintain transparency.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | .NET 8, ASP.NET Core Web API, Entity Framework Core |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Email | MailKit (MailHog for development) |

---

## Getting Started

### Prerequisites

- Docker Desktop
- Node.js 20+
- .NET 8 SDK
- Git

### Setup

1. Clone the repository:
git clone https://github.com/bandilleee/synod.git cd synod
2. Copy environment file:
cp .env.example .env
3. Start infrastructure services:
docker-compose up -d
4. Verify services are running:
docker-compose ps
---

## Development Services

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | - |
| Backend API | http://localhost:5048 | - |
| API Docs (Swagger) | http://localhost:5048/swagger | - |
| MailHog (Email UI) | http://localhost:8025 | - |
| pgAdmin | http://localhost:5050 | admin@synod.dev / admin |
| PostgreSQL | localhost:5432 | synod / synod_dev_password |
| Redis | localhost:6379 | - |

---

## Common Commands
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f postgres

# Stop all services
docker-compose down

# Stop and remove all data (fresh start)
docker-compose down -v
```

---

## Project Structure

synod/
├── frontend/           # Next.js application
├── backend/            # .NET 8 Web API
├── docker/             # Dockerfile configs
├── docs/               # Documentation
├── scripts/            # Helper scripts
├── docker-compose.yml  # Development services
├── .env.example        # Environment template
└── README.md           # This file

---

## License

Private - All rights reserved.
