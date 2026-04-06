import type { 
  UserRole, 
  UserStatus, 
  OrganizationType,
  NewsletterStatus,
  FormStatus,
  EventStatus,
  ApprovalStatus,
  InvitationStatus
} from "./enums"

export interface Organization {
  id: string
  name: string
  slug: string
  type: OrganizationType
  description?: string
  logoUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  status: UserStatus
  avatarUrl?: string
  lastLoginAt?: string
  organizationId?: string
  organization?: Organization
  createdAt: string
  updatedAt: string
}

export interface Newsletter {
  id: string
  title: string
  subject: string
  previewText?: string
  contentJson?: string
  htmlContent?: string
  status: NewsletterStatus
  sentAt?: string
  scheduledAt?: string
  recipientCount: number
  openCount: number
  clickCount: number
  createdById: string
  createdBy?: User
  createdAt: string
  updatedAt: string
}

export interface Form {
  id: string
  title: string
  description?: string
  slug: string
  fieldsJson: string
  settingsJson?: string
  status: FormStatus
  submissionCount: number
  successMessage?: string
  redirectUrl?: string
  createdById: string
  createdBy?: User
  createdAt: string
  updatedAt: string
}

export interface FormSubmission {
  id: string
  dataJson: string
  ipAddress?: string
  userAgent?: string
  formId: string
  memberId?: string
  createdAt: string
}

export interface Member {
  id: string
  email: string
  name?: string
  phone?: string
  metadataJson?: string
  isSubscribed: boolean
  unsubscribedAt?: string
  sourceFormId?: string
  createdAt: string
  updatedAt: string
}

export interface Event {
  id: string
  title: string
  description?: string
  date: string
  endDate?: string
  location?: string
  status: EventStatus
  requiredApprovals: number
  currentApprovals: number
  createdById: string
  createdBy?: User
  approvals?: EventApproval[]
  createdAt: string
  updatedAt: string
}

export interface EventApproval {
  id: string
  status: ApprovalStatus
  comment?: string
  respondedAt?: string
  eventId: string
  userId: string
  user?: User
  createdAt: string
}

export interface Invitation {
  id: string
  email: string
  role: UserRole
  status: InvitationStatus
  expiresAt: string
  acceptedAt?: string
  organizationId: string
  organization?: Organization
  invitedById: string
  invitedBy?: User
  createdAt: string
}
