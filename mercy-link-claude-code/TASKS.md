# Development Tasks & Enhancement Roadmap

## Current Status

The Mercy Link 245D Compliance Portal is deployed and functional with core features. This document outlines planned enhancements prioritized by business impact.

---

## Phase 1: Critical Compliance Features (Immediate Priority)

### 1.1 PDF Report Generation
**Why**: DHS audits require paper documentation; currently no way to generate compliance reports.

**Tasks**:
- [ ] Install pdf-lib or puppeteer for PDF generation
- [ ] Create client compliance summary report
- [ ] Create employee training transcript
- [ ] Create house-level compliance overview
- [ ] Add print/download buttons to relevant pages

**Files to modify**:
- Add `/src/app/api/reports/` directory
- Create report templates

### 1.2 Automated Email Notifications
**Why**: Staff need proactive alerts for upcoming deadlines.

**Tasks**:
- [ ] Set up email provider (Resend, SendGrid, or AWS SES)
- [ ] Create notification email templates
- [ ] Add daily cron job for deadline checks
- [ ] Allow users to configure notification preferences

**Implementation**:
```typescript
// Example: Vercel Cron Job
// vercel.json
{
  "crons": [{
    "path": "/api/cron/send-notifications",
    "schedule": "0 8 * * *"  // 8am daily
  }]
}
```

### 1.3 Compliance Audit Trail
**Why**: DHS requires proof of when compliance activities occurred.

**Tasks**:
- [ ] Enhance AuditLog model usage
- [ ] Log all compliance status changes
- [ ] Create audit log viewer in settings
- [ ] Add export functionality for audits

---

## Phase 2: Operational Efficiency (High Priority)

### 2.1 Bulk Document Upload
**Why**: Uploading documents one at a time is time-consuming.

**Tasks**:
- [ ] Add drag-and-drop multi-file upload
- [ ] Auto-detect document type from filename
- [ ] Batch link to compliance items
- [ ] Progress indicator for large uploads

### 2.2 Dashboard Customization
**Why**: Different roles need different views.

**Tasks**:
- [ ] Add dashboard widget configuration
- [ ] Role-specific default dashboards
- [ ] "My assigned clients" quick view for DCs
- [ ] House-specific compliance summary cards

### 2.3 Advanced Search & Filtering
**Why**: Finding specific records in 55+ clients is difficult.

**Tasks**:
- [ ] Global search across all entities
- [ ] Advanced filter builder
- [ ] Save custom filter presets
- [ ] Export filtered results

### 2.4 Mobile Responsive Improvements
**Why**: DSPs need to access on tablets during shifts.

**Tasks**:
- [ ] Audit all pages for mobile responsiveness
- [ ] Add PWA manifest for "Add to Home Screen"
- [ ] Optimize sidebar for mobile (bottom nav or collapsible)
- [ ] Touch-friendly compliance checkboxes

---

## Phase 3: Integration & Automation (Medium Priority)

### 3.1 Calendar Integration
**Why**: Planning meetings and reviews need calendar coordination.

**Tasks**:
- [ ] Add calendar view for deadlines
- [ ] Google Calendar / Outlook sync for planning meetings
- [ ] ICS file export for events
- [ ] Visual timeline for client journey

### 3.2 Case Manager Portal
**Why**: Case managers currently have no visibility into compliance status.

**Tasks**:
- [ ] Create limited-access external user role
- [ ] Case manager dashboard showing their clients only
- [ ] Secure document sharing
- [ ] Progress report auto-send

### 3.3 Signature Capture
**Why**: Many 245D documents require signatures from clients/reps.

**Tasks**:
- [ ] Add signature pad component
- [ ] Store signature images securely
- [ ] Link signatures to specific documents
- [ ] Timestamp and IP logging for signatures

---

## Phase 4: Advanced Features (Future)

### 4.1 MHCP Billing Integration
**Why**: Streamline billing workflow for waiver services.

**Tasks**:
- [ ] Add billing code tracking per client
- [ ] Service hour logging
- [ ] Generate billing reports
- [ ] Export for claims submission

### 4.2 NETStudy 2.0 Integration
**Why**: Manual background study tracking is error-prone.

**Tasks**:
- [ ] Research DHS API availability
- [ ] Auto-import background study results
- [ ] Alert when studies need renewal
- [ ] Track roster submissions

### 4.3 Analytics Dashboard
**Why**: Leadership needs trend visibility for strategic decisions.

**Tasks**:
- [ ] Compliance rate trends over time
- [ ] Staff training completion metrics
- [ ] Document upload velocity
- [ ] Predictive deadline risk analysis

### 4.4 AI-Powered Features
**Why**: Reduce manual work for common tasks.

**Ideas**:
- [ ] Auto-extract data from uploaded documents
- [ ] Smart deadline reminders based on patterns
- [ ] Document classification/tagging
- [ ] Natural language compliance queries

---

## Technical Debt Items

### Code Quality
- [ ] Add comprehensive error boundaries
- [ ] Implement proper form validation with Zod
- [ ] Add loading states to all async operations
- [ ] Create consistent error handling across APIs

### Testing
- [ ] Set up Jest + React Testing Library
- [ ] Write tests for auth flow
- [ ] Write tests for compliance status calculations
- [ ] Add E2E tests with Playwright

### Performance
- [ ] Implement proper data pagination
- [ ] Add database indexes for common queries
- [ ] Optimize Prisma queries (avoid N+1)
- [ ] Add caching for dashboard statistics

### Security
- [ ] Add CSRF protection
- [ ] Implement rate limiting
- [ ] Add request logging
- [ ] Security audit of file upload handling
- [ ] Add 2FA option for admin accounts

---

## Database Schema Enhancements

### Proposed New Models

```prisma
// For signature capture
model Signature {
  id           String   @id @default(cuid())
  imageData    String   // Base64 or file path
  signedAt     DateTime @default(now())
  signedByName String
  signedById   String?  // Reference to User if internal
  ipAddress    String?
  documentId   String
  document     Document @relation(fields: [documentId], references: [id])
}

// For calendar events
model CalendarEvent {
  id          String   @id @default(cuid())
  title       String
  description String?
  startTime   DateTime
  endTime     DateTime
  eventType   String   // PLANNING_MEETING, REVIEW, TRAINING
  clientId    String?
  employeeId  String?
  createdAt   DateTime @default(now())
}

// For case manager access
model ExternalUser {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String
  agency      String
  phone       String?
  accessToken String?
  lastAccess  DateTime?
  clients     ExternalUserClient[]
}

model ExternalUserClient {
  id             String       @id @default(cuid())
  externalUserId String
  clientId       String
  externalUser   ExternalUser @relation(fields: [externalUserId], references: [id])
  client         Client       @relation(fields: [clientId], references: [id])
}
```

---

## File Organization for New Features

```
src/
├── app/
│   ├── api/
│   │   ├── reports/
│   │   │   ├── client-summary/route.ts
│   │   │   ├── training-transcript/route.ts
│   │   │   └── house-overview/route.ts
│   │   ├── cron/
│   │   │   └── send-notifications/route.ts
│   │   └── external/
│   │       └── case-manager/route.ts
│   ├── dashboard/
│   │   ├── calendar/page.tsx
│   │   ├── reports/page.tsx
│   │   └── audit-log/page.tsx
│   └── portal/                    # External user portal
│       └── case-manager/page.tsx
├── components/
│   ├── signature-pad.tsx
│   ├── calendar-view.tsx
│   ├── report-generator.tsx
│   └── file-upload-dropzone.tsx
└── lib/
    ├── email.ts
    ├── pdf.ts
    └── calendar.ts
```

---

## Priority Matrix

| Feature | Business Impact | Development Effort | Priority |
|---------|-----------------|-------------------|----------|
| PDF Reports | Critical | Medium | 🔴 P0 |
| Email Notifications | High | Medium | 🔴 P0 |
| Audit Trail | Critical | Low | 🔴 P0 |
| Bulk Upload | High | Low | 🟠 P1 |
| Mobile Responsive | High | Medium | 🟠 P1 |
| Calendar Integration | Medium | High | 🟡 P2 |
| Case Manager Portal | Medium | High | 🟡 P2 |
| Billing Integration | High | Very High | 🟢 P3 |
| AI Features | Medium | Very High | 🟢 P3 |

---

## Getting Started with Development

1. Clone the repository
2. Copy `.env.example` to `.env` and configure
3. Run `npm install`
4. Run `npm run db:reset` to seed database
5. Run `npm run dev` to start development server
6. Pick a task from Phase 1 to begin
