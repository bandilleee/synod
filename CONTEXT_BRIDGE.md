@'
# Synod Project - Context Bridge

> **Last Updated:** 2026-04-07
> **Current Phase:** Phase 8 - Event Collaboration (Backend Complete)

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
# Start all services
docker-compose up -d

# View services
docker ps
```

| Service | Port | Credentials |
|---------|------|-------------|
| PostgreSQL | 5432 | synod / synod_dev_password / synod |
| Redis | 6379 | - |
| MailHog SMTP | 1025 | - |
| MailHog UI | 8025 | http://localhost:8025 |
| pgAdmin | 5050 | admin@synod.dev / admin |

---

## Project Structure

C:\Projects\Synod
├── frontend/
│   └── src/
│       ├── app/                    # Next.js pages
│       │   ├── (auth)/            
│       │   ├── admin/             
│       │   ├── dashboard/         
│       │   └── f/[slug]/          
│       ├── components/
│       │   ├── ui/                
│       │   ├── shared/            
│       │   ├── skeletons/         
│       │   └── newsletter/        
│       └── lib/
│           ├── api/               
│           ├── hooks/             
│           └── utils.ts           
├── backend/
│   └── src/
│       └── Synod.Api/
│           ├── Controllers/       
│           ├── Services/          
│           ├── Models/
│           │   ├── Entities/      
│           │   ├── Requests/      
│           │   └── Responses/     
│           ├── Data/              
│           └── Infrastructure/    
├── docker-compose.yml
└── CONTEXT_BRIDGE.md

---

## Completed Phases

### Phase 0: Project Setup ✅
- Git repository initialized
- Docker Compose with PostgreSQL, Redis, MailHog, pgAdmin
- Environment configuration

### Phase 1: Backend Foundation ✅
- .NET 8 Web API project structure
- Entity Framework Core with PostgreSQL
- All database entities created
- DbContext with configurations

### Phase 2: Frontend Foundation ✅
- Next.js 16 with App Router
- Tailwind CSS v4 + shadcn/ui components
- API client with axios (interceptors for auth)
- React Query for data fetching

### Phase 3: Authentication ✅
- JWT authentication with refresh tokens
- Login page
- Invitation acceptance flow
- Protected routes middleware
- Auth store with Zustand

### Phase 4: Admin Panel ✅
- Super Admin dashboard with stats
- Organization management (CRUD)
- Leader invitation system
- Leader management (view, suspend, remove)

### Phase 5: Form Builder ✅
- Drag-and-drop form builder
- Field types: text, email, phone, number, textarea, select, radio, checkbox, date
- Field validation and conditional logic
- Public form rendering (`/f/[slug]`)
- Form submissions with member auto-creation
- Submissions table with field labels

### Phase 6: Member Management ✅
- Members auto-created from form submissions (email field detection)
- Members list with search, filter, pagination
- Stats cards (total, subscribed, unsubscribed, new this month)
- CSV export
- Resubscribe/delete members
- Confirm delete dialog (reusable component)

### Phase 7: Newsletter Studio ✅
- TipTap rich text editor with full toolbar
- Newsletter CRUD (create, edit, delete drafts)
- TipTap JSON → HTML conversion
- Preview page (desktop/mobile toggle)
- Send test email
- Send to all subscribers with personalization
- Email templates with unsubscribe link

### Phase 8: Event Collaboration 🔄 (Backend Complete)
- Event CRUD API
- Approval workflow (all leaders must approve)
- Email notifications for approval requests
- Approve/reject with comments
- **Next:** Frontend event pages

---

## Current Database Entities

| Entity | Table | Description |
|--------|-------|-------------|
| User | Users | Leaders and SuperAdmin |
| Organization | Organizations | Chapters, clubs, societies |
| Invitation | Invitations | Leader invitations |
| Form | Forms | Form builder forms |
| FormSubmission | FormSubmissions | Form responses |
| Member | Members | Collected from form submissions |
| Newsletter | Newsletters | Email campaigns |
| NewsletterRecipient | NewsletterRecipients | Delivery tracking |
| NewsletterTemplate | NewsletterTemplates | Pre-built templates |
| Event | Events | Collaborative events |
| EventApproval | EventApprovals | Approval workflow |
| AuditLog | AuditLogs | Activity tracking |

---

## API Endpoints

### Auth (`/api/auth`)
- `POST /login` - Login with email/password
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout
- `POST /accept-invite` - Accept leader invitation
- `GET /me` - Get current user

### Admin (`/api/admin`) - SuperAdmin only
- `GET /stats` - Dashboard statistics
- `GET /organizations` - List organizations
- `POST /organizations` - Create organization
- `PUT /organizations/{id}` - Update organization
- `DELETE /organizations/{id}` - Delete organization
- `GET /leaders` - List leaders
- `POST /leaders/invite` - Invite leader
- `POST /leaders/{id}/suspend` - Suspend leader
- `DELETE /leaders/{id}` - Remove leader

### Forms (`/api/forms`)
- `GET /` - List forms
- `GET /{id}` - Get form
- `POST /` - Create form
- `PUT /{id}` - Update form
- `DELETE /{id}` - Delete form
- `POST /{id}/publish` - Publish form
- `POST /{id}/close` - Close form
- `GET /{id}/submissions` - Get submissions

### Public Forms (`/api/public/forms`)
- `GET /{slug}` - Get public form
- `POST /{slug}/submit` - Submit form

### Members (`/api/members`)
- `GET /` - List members (with search, filter, pagination)
- `GET /stats` - Member statistics
- `GET /{id}` - Get member
- `POST /{id}/resubscribe` - Resubscribe member
- `DELETE /{id}` - Delete member
- `GET /export` - Export to CSV

### Newsletters (`/api/newsletters`)
- `GET /` - List newsletters
- `GET /stats` - Newsletter statistics
- `GET /templates` - List templates
- `GET /{id}` - Get newsletter
- `POST /` - Create newsletter
- `PUT /{id}` - Update newsletter
- `DELETE /{id}` - Delete newsletter
- `GET /{id}/preview` - Get HTML preview
- `POST /{id}/send-test` - Send test email
- `POST /{id}/send` - Send to all subscribers

### Events (`/api/events`)
- `GET /` - List events
- `GET /pending` - Get pending approvals for current user
- `GET /{id}` - Get event with approvals
- `POST /` - Create event
- `PUT /{id}` - Update event
- `DELETE /{id}` - Delete event
- `POST /{id}/approve` - Approve event
- `POST /{id}/reject` - Reject event
- `POST /{id}/cancel` - Cancel event

---

## Frontend Hooks

All hooks are in `frontend/src/lib/hooks/`:

| File | Hooks |
|------|-------|
| `useAdmin.ts` | useAdminStats, useOrganizations, useLeaders, useInviteLeader, etc. |
| `useForms.ts` | useForms, useForm, useCreateForm, usePublishForm, useFormSubmissions, etc. |
| `useMembers.ts` | useMembers, useMemberStats, useDeleteMember, useExportMembers, etc. |
| `useNewsletters.ts` | useNewsletters, useNewsletter, useCreateNewsletter, useSendNewsletter, etc. |

---

## Key Files Reference

### Backend Services
- `Services/AuthService.cs` - Authentication logic
- `Services/AdminService.cs` - Admin operations
- `Services/FormService.cs` - Form CRUD + submissions + member creation
- `Services/MemberService.cs` - Member management
- `Services/NewsletterService.cs` - Newsletter + TipTap HTML conversion
- `Services/EventService.cs` - Event + approval workflow
- `Services/EmailService.cs` - MailKit email sending

### Frontend Components
- `components/shared/ConfirmDialog.tsx` - Reusable confirmation dialog
- `components/shared/PageHeader.tsx` - Page header with title/description/actions
- `components/newsletter/NewsletterEditor.tsx` - TipTap rich text editor
- `app/dashboard/forms/FormBuilder.tsx` - Drag-and-drop form builder

---

## Common Patterns

### API Client Import
```typescript
import { api } from "@/lib/api/client"
```

### React Query Hook Pattern
```typescript
export function useItems() {
  return useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const response = await api.get("/items")
      return response.data.data
    },
  })
}

export function useCreateItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateItemData) => {
      const response = await api.post("/items", data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
    },
  })
}
```

### PowerShell File Creation
```powershell
# For simple content
@'
file content here
'@ | Out-File -FilePath "path/to/file.ts" -Encoding UTF8

# For string replacement
$content = Get-Content "path/to/file.ts" -Raw
$content = $content -replace "old text", "new text"
$content | Set-Content "path/to/file.ts" -Encoding UTF8

# For paths with brackets
Get-Content "app/f/`[slug`]/page.tsx" -Raw
```

### Service Registration in Program.cs
```csharp
builder.Services.AddScoped<IServiceName, ServiceName>();
```

---

## Credentials

| Account | Email | Password |
|---------|-------|----------|
| Super Admin | admin@synod.dev | Admin123! |

---

## Commands Quick Reference
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

# Database
docker exec -it synod-postgres psql -U synod -d synod
# Then: SELECT * FROM "TableName";
# Exit: \q

# EF Migrations
dotnet ef migrations add MigrationName
dotnet ef database update
```

---

## Remaining Phases

### Phase 8: Event Collaboration (Frontend) - IN PROGRESS
- [ ] Event hooks (useEvents.ts)
- [ ] Events list page
- [ ] Create event page
- [ ] Event detail page with approvals
- [ ] Approve/reject UI

### Phase 9: Activity & Audit Logs
- [ ] Audit log service
- [ ] Activity feed API
- [ ] Activity page for leaders
- [ ] Admin audit log view

### Phase 10: Polish & Testing
- [ ] Loading states audit
- [ ] Error boundaries
- [ ] Mobile responsiveness
- [ ] Accessibility
- [ ] E2E tests

### Phase 11: Production Deployment
- [ ] Vercel (frontend)
- [ ] Render (backend)
- [ ] Neon (PostgreSQL)
- [ ] Upstash (Redis)
- [ ] Gmail SMTP
- [ ] Sentry monitoring

---

## Notes

- TipTap editor requires `immediatelyRender: false` for SSR
- Public forms are at `/f/[slug]` (not `/forms/[slug]` due to route conflicts)
- Member auto-creation detects email fields by `type: "email"` in form field definitions
- All DateTime values sent to PostgreSQL must have `DateTimeKind.Utc`
- API responses wrap data in `{ success: true, data: {...} }` format

'@ | Out-File -FilePath "CONTEXT_BRIDGE.md" -Encoding UTF8