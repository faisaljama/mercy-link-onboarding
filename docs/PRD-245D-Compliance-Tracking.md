# Product Requirements Document (PRD)
## 245D Compliance Document Tracking System

**Version:** 1.0
**Date:** January 8, 2026
**Product:** Mercy Link Onboarding Dashboard
**Feature:** 245D Meeting Compliance Tracking

---

## 1. Executive Summary

The 245D Compliance Document Tracking System is a per-client document management feature for tracking required compliance documents under Minnesota Statutes Chapter 245D for Intensive Support Services. The system organizes documents by meeting type and service year, providing staff with a structured checklist approach to ensure all regulatory requirements are met.

---

## 2. Problem Statement

### Current Challenges
- Staff struggle to track which 245D compliance documents have been completed for each client
- No centralized system to organize documents by meeting type (Admission, 45/60 Day, Semi-Annual, Annual)
- Difficulty tracking multi-year compliance across a client's service tenure
- Case manager absence scenarios require manual tracking of document forwarding
- No way to generate compliance checklists for meetings or audits

### Impact
- Risk of regulatory non-compliance
- Audit preparation is time-consuming and error-prone
- Staff uncertainty about which documents are pending vs. completed
- Potential gaps in required signatures and documentation

---

## 3. Goals & Objectives

### Primary Goals
1. Provide a structured checklist system for each 245D meeting type
2. Track document completion status across multiple service years (Year 1-5+)
3. Enable document upload and storage linked to specific meetings
4. Generate PDF compliance checklists for meetings and audits

### Success Metrics
- 100% of required 245D documents tracked per client
- Reduction in audit preparation time by 50%
- Zero missed compliance deadlines due to tracking gaps

---

## 4. User Personas

### Designated Coordinator (DC)
- Primary user responsible for compliance management
- Creates meetings, tracks checklist completion, uploads documents
- Generates PDF reports for case managers and audits

### Lead Staff
- View access to client compliance status
- Cannot delete documents or meetings
- Assists with checklist completion

### Administrator
- Full access to all features
- Manages user permissions
- Oversees compliance across all houses

---

## 5. Features & Functionality

### 5.1 Meeting Management

#### Create New Meeting
- Select meeting type from predefined options:
  - **Admission Meeting** - Initial intake documents
  - **Initial Planning (45/60 Day)** - Follow-up planning meeting
  - **Semi-Annual Review** - 6-month review
  - **Annual Meeting** - Yearly renewal
- Set meeting date
- System auto-calculates service year based on client admission date
- Prevents duplicate meetings (same type + year combination)
- Add optional meeting notes

#### View Meetings
- Year-based tab filtering (Year 1, Year 2, Year 3, Year 4, Year 5, All)
- Expandable accordion cards showing:
  - Meeting type and year badge
  - Meeting date
  - Completion progress (e.g., "3/11")
  - Visual indicator when all required items complete

#### Delete Meeting
- Confirmation dialog required
- Cascades to delete associated documents
- Audit logged
- Restricted from Lead Staff role

---

### 5.2 Compliance Checklists

Each meeting type has a predefined checklist of required documents based on 245D regulations:

#### Admission Meeting Checklist (11 items)
| Document | Sublabel | Signers | Optional |
|----------|----------|---------|----------|
| Service Recipient Rights | Give copy, explain rights | Person, Legal Rep | No |
| Policy Orientation | Grievance, Data Privacy, EUMR, Suspension, Termination, VAA, MOMA, PAPP | Person, Legal Rep, Case Manager | No |
| Funds & Property Authorization | Include frequency of itemized statements | Person, Legal Rep, Case Manager | No |
| Authorization to Act in Medical Emergency | - | Person, Legal Rep | No |
| Medication Administration Authorization | - | Person, Legal Rep | No |
| Injectable Medication Agreement | Ex: Epi-Pen | Person, Legal Rep | Yes |
| Residency Agreement | CRS/FRS only | Person, Legal Rep, Provider | Yes |
| Release(s) of Information | - | Person, Legal Rep | No |
| Admission Form/Data Sheet | - | Person, Legal Rep | No |
| Individual Abuse Prevention Plan (IAPP) | - | Person, Legal Rep, Case Manager, Provider | No |
| Support Plan Preliminary Addendum | Complete within 15 days after meeting | Person, Legal Rep, Case Manager, Provider | No |

#### Initial Planning (45/60 Day) Checklist (4 items)
| Document | Signers | Optional |
|----------|---------|----------|
| Individual Abuse Prevention Plan (IAPP) | Person, Legal Rep, Case Manager, Provider | No |
| Support Plan Addendum | Person, Legal Rep, Case Manager, Provider | No |
| Self-Management Assessment | Person, Legal Rep, Case Manager, Provider | No |
| Outcome | - | No |

#### Semi-Annual Review Checklist (6 items)
| Document | Signers | Optional |
|----------|---------|----------|
| Progress Report | - | Yes |
| Support Plan Addendum | Person, Legal Rep, Case Manager, Provider | Yes |
| IAPP | Person, Legal Rep, Case Manager, Provider | Yes |
| Self-Management Assessment | Person, Legal Rep, Case Manager, Provider | Yes |
| Six-month Review for Positive Support Strategies | - | No |
| Six-month Review for Rights Restrictions | - | Yes |

#### Annual Meeting Checklist (9 items)
| Document | Sublabel | Signers | Optional |
|----------|----------|---------|----------|
| Service Recipient Rights | Give copy, explain rights | Person, Legal Rep | No |
| Residency Agreement | CRS/FRS only | Person, Legal Rep, Provider | Yes |
| Release(s) of Information | - | Person, Legal Rep | No |
| Funds & Property Authorization | Include frequency of itemized statements | Person, Legal Rep, Case Manager | No |
| Individual Abuse Prevention Plan (IAPP) | - | Person, Legal Rep, Case Manager, Provider | No |
| Support Plan Addendum | - | Person, Legal Rep, Case Manager, Provider | No |
| Self-Management Assessment | - | Person, Legal Rep, Case Manager, Provider | No |
| Outcome | - | - | No |
| Progress Report | - | - | No |

#### Checklist Interactions
- Click checkbox to toggle completion status
- Completion date auto-recorded
- Visual distinction for optional items (lighter styling, "if applicable" label)
- Shows required signers for each document
- Progress tracked as "completed/total" and "required complete/required total"

---

### 5.3 Case Manager Absence Handling

When a case manager cannot attend the meeting:
- Toggle "Case Manager was not present at meeting" checkbox
- Reveals additional fields:
  - Date documents were sent to case manager
  - Notes about what was sent
- Reminder text: "Send copies to case manager and request dated signatures"
- Captured in PDF export

---

### 5.4 Document Upload & Management

#### Upload Documents
- Single "Upload Document" button per meeting
- Accepted file types: PDF, DOC, DOCX, JPG, JPEG, PNG
- Maximum file size: 10MB
- Files stored in Vercel Blob storage
- Document metadata stored in database:
  - File name
  - File path (URL)
  - File type
  - File size
  - Upload timestamp

#### View Documents
- Documents listed within expanded meeting card
- Shows: file name, file size, upload date
- Download button to view/download file
- Delete button (with confirmation)

#### Delete Documents
- Confirmation required
- Removes from storage and database
- Restricted from Lead Staff role

---

### 5.5 PDF Export

#### Meeting Compliance PDF
- Generated on-demand per meeting
- Contains:
  - Header with meeting type and client name
  - Client info section (name, house, meeting date, admission date)
  - Summary stats (completed, remaining, total, required completion)
  - Full checklist with check/uncheck status and completion dates
  - Signed by information per item
  - Case manager absence section (if applicable)
  - Meeting notes (if any)
  - Signature lines for Person/Legal Rep, Case Manager, Provider
  - Confidential footer

#### File Naming Convention
`{ClientName}_{MeetingType}_Year{N}.pdf`
Example: `John_Doe_Admission_Meeting_Year1.pdf`

---

### 5.6 Dashboard Integration

#### Client Detail Page Layout
- **Stats Row** (3 cards):
  - Total Meetings count
  - Documents Uploaded count
  - Days Since Admission

- **Two-Column Layout**:
  - Left (1/3): Client Information card (DOB, admission date, case managers, legal rep)
  - Right (2/3): 245D Compliance Documents card with year tabs and meeting list

- **Additional Sections**:
  - Monthly Summaries
  - Support Plans

---

## 6. Technical Architecture

### 6.1 Tech Stack
- **Frontend**: Next.js 16 (App Router), React, TypeScript
- **UI Components**: shadcn/ui, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **File Storage**: Vercel Blob
- **PDF Generation**: @react-pdf/renderer
- **Hosting**: Vercel

### 6.2 Data Model

```prisma
enum MeetingType {
  ADMISSION
  INITIAL_45_60_DAY
  SEMI_ANNUAL
  ANNUAL
}

model ClientMeetingCompliance {
  id                String      @id @default(cuid())
  clientId          String
  meetingType       MeetingType
  meetingDate       DateTime    @db.Date
  year              Int
  checklistItems    String      @default("{}")  // JSON
  notes             String?
  caseManagerAbsent Boolean     @default(false)
  docsSentDate      DateTime?
  docsSentNotes     String?
  createdById       String
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  client            Client      @relation(...)
  createdBy         User        @relation(...)
  documents         Document[]

  @@unique([clientId, meetingType, year])
  @@index([clientId])
}

model Document {
  id                  String   @id @default(cuid())
  fileName            String
  filePath            String
  fileType            String
  fileSize            Int
  uploadedAt          DateTime @default(now())
  uploadedById        String
  meetingComplianceId String?

  uploadedBy          User     @relation(...)
  meetingCompliance   ClientMeetingCompliance? @relation(...)
}
```

### 6.3 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clients/[id]/meeting-compliance` | List all meetings for client |
| POST | `/api/clients/[id]/meeting-compliance` | Create new meeting |
| GET | `/api/clients/[id]/meeting-compliance/[meetingId]` | Get single meeting |
| PUT | `/api/clients/[id]/meeting-compliance/[meetingId]` | Update meeting (checklist, notes, etc.) |
| DELETE | `/api/clients/[id]/meeting-compliance/[meetingId]` | Delete meeting |
| POST | `/api/upload` | Upload document (with meetingComplianceId) |
| DELETE | `/api/documents/[id]` | Delete document |

---

## 7. User Interface

### 7.1 Component Hierarchy

```
MeetingCompliance (main component)
├── Year Tabs (All, Year 1-5)
├── New Meeting Dialog
│   ├── Meeting Type Select
│   ├── Meeting Date Input
│   └── Notes Textarea
└── Meeting Cards (accordion)
    ├── Header (type, year badge, date, progress, actions)
    └── Expanded Content
        ├── Checklist Items
        │   └── ChecklistItemRow (checkbox, label, sublabel, signers, date)
        ├── Case Manager Absent Section
        │   ├── Checkbox toggle
        │   └── Docs sent fields
        ├── Meeting Notes
        └── Documents Section
            ├── Upload button
            └── Document list (name, size, date, download, delete)
```

### 7.2 Visual States

- **Empty State**: "No meeting records yet" with prompt to create
- **Year Filter Empty**: "No meeting records for Year X"
- **Complete Meeting**: Green border and background tint, "Complete" badge
- **In Progress Meeting**: Gray badge with progress count
- **Optional Items**: Lighter text, "(if applicable)" label
- **Completed Items**: Strikethrough text, green checkmark with date

---

## 8. Security & Permissions

### Role-Based Access

| Action | Admin | DC | Lead Staff |
|--------|-------|----|-----------|
| View meetings | ✓ | ✓ | ✓ |
| Create meetings | ✓ | ✓ | ✓ |
| Update checklists | ✓ | ✓ | ✓ |
| Upload documents | ✓ | ✓ | ✓ |
| Delete meetings | ✓ | ✓ | ✗ |
| Delete documents | ✓ | ✓ | ✗ |
| Download PDFs | ✓ | ✓ | ✓ |

### Data Access
- Users can only access clients in houses they are assigned to
- House assignment verified on all API requests
- Session-based authentication required

### Audit Logging
- All CREATE, UPDATE, DELETE actions logged
- Captures: user ID, action type, entity type, entity ID, details JSON, timestamp

---

## 9. Future Enhancements

### Phase 2 (Planned)
- [ ] Email notifications for upcoming meeting due dates
- [ ] Bulk document upload (multiple files at once)
- [ ] Document categorization by checklist item
- [ ] Digital signature capture integration
- [ ] Compliance dashboard with cross-client analytics

### Phase 3 (Considered)
- [ ] Template customization per organization
- [ ] Integration with external case management systems
- [ ] Mobile app for on-site document capture
- [ ] OCR for automatic document classification
- [ ] Compliance calendar with automated reminders

---

## 10. Appendix

### A. Signer Legend
- **Person**: The client/service recipient
- **Legal Rep**: Guardian or legal representative (if applicable)
- **Case Manager**: MH or CADI case manager
- **Provider**: Mercy Link staff/Designated Coordinator

### B. 245D Reference
Minnesota Statutes Chapter 245D governs home and community-based services for persons with disabilities. This system tracks compliance with documentation requirements for Intensive Support Services (245D.10).

### C. File Structure
```
src/
├── app/
│   ├── api/clients/[id]/meeting-compliance/
│   │   ├── route.ts              # GET list, POST create
│   │   └── [meetingId]/route.ts  # GET, PUT, DELETE
│   └── dashboard/clients/[id]/
│       ├── page.tsx              # Client detail page
│       └── meeting-compliance.tsx # Meeting compliance component
├── lib/
│   ├── meeting-compliance-templates.ts  # Checklist definitions
│   └── pdf-templates/
│       └── meeting-compliance-pdf.tsx   # PDF template
└── prisma/
    └── schema.prisma             # Database schema
```

---

**Document Prepared By:** Claude Code
**Last Updated:** January 8, 2026
