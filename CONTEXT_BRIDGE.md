# Synod Project - Context Bridge

> **Last Updated:** 2026-04-07
> **Current Phase:** Phase 9 Complete - Ready for Phase 10

---

## Project Overview

**Synod** is a collaboration platform for community leaders across multiple organizations to:
- Send professional newsletters to their combined member base
- Build forms to collect member data with advanced validation
- Plan collaborative events that require unanimous leader approval
- Maintain transparency through activity logs visible to all leaders

---

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| **Frontend** | Next.js 16, TypeScript, Tailwind v4, shadcn/ui, pnpm | Port 3000 |
| **Backend** | .NET 8, ASP.NET Core Web API, Entity Framework Core | Port 5048 |
| **Database** | PostgreSQL 16 (Docker) | Port 5432 |
| **Cache** | Redis 7 (Docker) | Port 6379 |
| **Email** | MailKit + MailHog (dev) | SMTP 1025, UI 8025 |
| **Auth** | JWT + BCrypt | Access + Refresh tokens |

---

## Docker Services
```bash
docker-compose up -d
```

| Service | Port | Credentials |
|---------|------|-------------|
| PostgreSQL | 5432 | synod / synod_dev_password / synod |
| Redis | 6379 | - |
| MailHog SMTP | 1025 | - |
| MailHog UI | 8025 | http://localhost:8025 |
| pgAdmin | 5050 | admin@synod.dev / admin |

---

## Completed Phases

### Phase 0-4: Foundation ✅
- Project setup, Docker, backend/frontend foundation
- Authentication with JWT
- Admin panel with organization/leader management

### Phase 5: Form Builder ✅
- Drag-and-drop form builder
- Public form rendering (`/f/[slug]`)
- Form submissions with member auto-creation

### Phase 6: Member Management ✅
- Members list with search, filter, pagination
- CSV export, resubscribe/delete

### Phase 7: Newsletter Studio ✅
- TipTap rich text editor
- Preview (desktop/mobile), send test email
- Send to all subscribers with personalization

### Phase 8: Event Collaboration ✅
- Event CRUD with approval workflow
- Only Leaders participate in approvals (not SuperAdmin)
- All other Leaders must approve for event confirmation
- Email notifications: approval request, approved, rejected, event updated
- Only event creator can edit

### Phase 9: Activity & Audit Logs ✅
- Comprehensive logging across all modules
- Activity page for Leaders (`/dashboard/activity`)
- Audit Logs page for Admin (`/admin/activity`)
- Settings pages for both Admin and Leaders
- Route protection middleware (SuperAdmin → /admin, Leader → /dashboard)

---

## Route Protection

| User Role | Allowed Routes | Redirect |
|-----------|----------------|----------|
| SuperAdmin | `/admin/*` | `/dashboard` → `/admin` |
| Leader | `/dashboard/*` | `/admin` → `/dashboard` |
| Unauthenticated | `/login`, `/f/*`, `/invite/*` | Protected routes → `/login` |

---

## API Endpoints Summary

### Auth (`/api/auth`)
- `POST /login`, `/refresh`, `/logout`, `/accept-invite`
- `GET /me`
- `PUT /profile` - Update name/email
- `PUT /password` - Change password

### Admin (`/api/admin`) - SuperAdmin only
- Organizations CRUD, Leaders invite/manage

### Forms (`/api/forms`)
- CRUD, publish/close, submissions

### Public Forms (`/api/public/forms`)
- `GET /{slug}`, `POST /{slug}/submit`

### Members (`/api/members`)
- List, stats, export, resubscribe, delete

### Newsletters (`/api/newsletters`)
- CRUD, templates, preview, send-test, send

### Events (`/api/events`)
- CRUD, approve, reject, cancel

### Activity (`/api/activity`)
- `GET /` - All activities (paginated, filterable)
- `GET /my` - Current user's activities

---

## Frontend Pages

### Admin Pages (`/admin/*`)
| Route | Description |
|-------|-------------|
| `/admin` | Admin dashboard |
| `/admin/organizations` | Manage organizations |
| `/admin/leaders` | Manage leaders |
| `/admin/activity` | Audit logs |
| `/admin/settings` | Admin profile settings |

### Leader Pages (`/dashboard/*`)
| Route | Description |
|-------|-------------|
| `/dashboard` | Leader home |
| `/dashboard/forms` | Forms list, builder |
| `/dashboard/members` | Members management |
| `/dashboard/newsletters` | Newsletter studio |
| `/dashboard/events` | Events list |
| `/dashboard/events/new` | Create event |
| `/dashboard/events/[id]` | Event detail + approve/reject |
| `/dashboard/events/[id]/edit` | Edit event (creator only) |
| `/dashboard/activity` | Activity feed |
| `/dashboard/settings` | Profile settings |

### Public Pages
| Route | Description |
|-------|-------------|
| `/login` | Login page |
| `/f/[slug]` | Public form |
| `/invite/[token]` | Accept invitation |

---

## Credentials

| Account | Email | Password | Role |
|---------|-------|----------|------|
| Super Admin | admin@synod.dev | Admin123! | SuperAdmin |

---

## Remaining Phases

### Phase 10: Polish & Testing
- [ ] Loading states audit
- [ ] Error boundaries
- [ ] Mobile responsiveness
- [ ] Accessibility

### Phase 11: Production Deployment
- [ ] Vercel, Render, Neon, Upstash, Gmail SMTP, Sentry

---

## Quick Commands
```powershell
# Backend
cd C:\Projects\Synod\backend\src\Synod.Api
dotnet build
dotnet run

# Frontend  
cd C:\Projects\Synod\frontend
pnpm dev

# Git
cd C:\Projects\Synod
git add .
git commit -m "message"
git push origin main
```

