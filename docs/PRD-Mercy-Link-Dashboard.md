# Product Requirements Document (PRD)
## Mercy Link 245D Compliance Dashboard

**Version:** 2.0
**Date:** January 8, 2026
**Product:** Mercy Link Onboarding Dashboard
**Organization:** Mercy Link (HCBS Provider - Minnesota)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Objectives](#3-goals--objectives)
4. [User Personas](#4-user-personas)
5. [Features & Functionality](#5-features--functionality)
6. [Technical Architecture](#6-technical-architecture)
7. [Data Model](#7-data-model)
8. [API Reference](#8-api-reference)
9. [User Interface & Experience](#9-user-interface--experience)
10. [Security & Compliance](#10-security--compliance)
11. [Deployment & Infrastructure](#11-deployment--infrastructure)
12. [Monitoring & Maintenance](#12-monitoring--maintenance)
13. [Future Roadmap](#13-future-roadmap)
14. [Appendix](#14-appendix)

---

## 1. Executive Summary

### 1.1 Product Overview

The Mercy Link 245D Compliance Dashboard is a comprehensive web-based application designed for Home and Community-Based Services (HCBS) providers operating under Minnesota Statutes Chapter 245D. The platform centralizes compliance tracking, document management, operational reporting, and staff/client management into a single, intuitive interface.

### 1.2 Key Value Propositions

- **Regulatory Compliance**: Automated tracking of 245D compliance requirements for clients and employees
- **Operational Efficiency**: Streamlined daily operations, weekly reports, and DC checklists
- **Document Management**: Centralized storage for all compliance documents, support plans, and meeting records
- **Real-time Visibility**: Dashboard views for compliance status, upcoming deadlines, and alerts
- **Multi-house Support**: Role-based access for managing multiple residential sites

### 1.3 Target Market

- Community Residential Settings (CRS)
- Intensive Community Services (ICS)
- In-Home Services (IHS)
- Adult Foster Care providers
- 245D Licensed Service Providers in Minnesota

---

## 2. Problem Statement

### 2.1 Industry Challenges

Minnesota HCBS providers face significant operational challenges:

1. **Compliance Complexity**: 245D regulations require tracking dozens of deadlines per client/employee across multiple timeframes (45-day, semi-annual, annual)
2. **Paper-Based Systems**: Many providers still use spreadsheets or paper tracking, leading to missed deadlines and audit failures
3. **Fragmented Tools**: Operations are split across multiple platforms (scheduling, documentation, billing) with no unified view
4. **Staff Turnover**: High turnover in DSP positions makes consistent compliance tracking difficult
5. **Audit Preparation**: Gathering documentation for DHS audits is time-consuming and error-prone

### 2.2 Specific Pain Points

| Challenge | Impact |
|-----------|--------|
| Missed compliance deadlines | Risk of citations, fines, license revocation |
| Lost or misfiled documents | Failed audits, inability to prove compliance |
| No centralized client information | Staff spend excessive time searching for information |
| Manual tracking of meetings | 245D meetings (45/60-day, semi-annual, annual) are often missed |
| Inconsistent documentation | Quality varies by staff member, incomplete records |
| No visibility across houses | Administrators cannot see overall compliance status |

### 2.3 Business Impact

- Average provider spends 15+ hours/week on compliance tracking
- 30% of audit findings relate to documentation gaps
- Staff frustration leads to turnover
- Delayed billing due to documentation backlogs

---

## 3. Goals & Objectives

### 3.1 Primary Goals

| Goal | Success Metric |
|------|----------------|
| Eliminate missed compliance deadlines | 0 overdue items at any time |
| Reduce audit preparation time | From 40 hours to <10 hours |
| Centralize all documentation | 100% of required docs accessible in-app |
| Improve staff efficiency | 50% reduction in administrative time |
| Ensure regulatory compliance | 100% passing audit rate |

### 3.2 Secondary Goals

- Enable real-time visibility into compliance status across all houses
- Provide proactive notifications for upcoming deadlines
- Create audit-ready documentation with one click
- Support multi-house operations with role-based access
- Reduce training time for new staff

### 3.3 Key Performance Indicators (KPIs)

1. **Compliance Rate**: Percentage of items completed on time (Target: >95%)
2. **Document Upload Rate**: Average time to upload required documents (Target: <24 hours)
3. **User Adoption**: Daily active users / total users (Target: >80%)
4. **Notification Response Time**: Time to address overdue items (Target: <48 hours)
5. **Audit Readiness Score**: Percentage of required documents present (Target: 100%)

---

## 4. User Personas

### 4.1 Administrator (Admin)

**Profile:**
- Organization owner or director
- Oversees all houses and operations
- Responsible for regulatory compliance

**Needs:**
- Organization-wide compliance visibility
- User management capabilities
- Audit preparation tools
- Cross-house reporting

**Access Level:** Full access to all features and all houses

### 4.2 Designated Coordinator (DC)

**Profile:**
- Licensed coordinator managing 1-3 houses
- Primary compliance officer for assigned houses
- Creates and reviews all client documentation

**Needs:**
- Client compliance tracking
- Document management
- Meeting scheduling and tracking
- Daily/weekly operational reporting
- Staff supervision tools

**Access Level:** Full access to assigned houses only

### 4.3 Lead Staff (DSP)

**Profile:**
- Direct Support Professional with additional responsibilities
- Works directly with clients
- Assists with documentation

**Needs:**
- View client information
- Upload documents
- Complete daily operations reports
- Access resource materials

**Access Level:** View access to assigned houses, cannot delete records

---

## 5. Features & Functionality

### 5.1 Dashboard Home

**Purpose:** Provide at-a-glance overview of compliance status and key metrics.

**Features:**
- **Stats Cards**: Total clients, employees, overdue items, compliance rate
- **Quick Stats**: Houses count, items due this week, completed items
- **Upcoming Deadlines**: List of pending compliance items with status badges
- **Filtered Views**: Toggle between all items, clients only, employees only

### 5.2 Client Management

#### 5.2.1 Client List
- Searchable/filterable list of all clients
- Status indicators (Active/Discharged)
- House assignment
- Quick actions (View, Edit)

#### 5.2.2 Client Detail Page
- **Profile Information**: Name, DOB, admission date, photo
- **Service Information**: Service types, service level, waiver type
- **Case Managers**: MH and CADI case manager contacts
- **Stats Row**: Total meetings, documents uploaded, days since admission
- **245D Compliance Documents**: Meeting compliance tracking by year
- **Monthly Summaries**: Upload and manage monthly summary documents
- **Support Plans**: CSSP, Behavior Plans, Addendums with date ranges

#### 5.2.3 Face Sheet
Comprehensive client information page including:
- Personal demographics
- Insurance information
- Emergency contacts
- Medical providers (Primary Care, Psychiatry, Dental, Vision, Pharmacy)
- Additional providers (unlimited)
- Rep payee and guardian information
- Staffing and rate information
- MyChart credentials (internal)

#### 5.2.4 245D Meeting Compliance Tracking

**Meeting Types:**
| Meeting | Timing | Documents Required |
|---------|--------|-------------------|
| Admission | At intake | 11 items |
| Initial Planning (45/60 Day) | 45 days post-admission | 4 items |
| Semi-Annual Review | Every 6 months | 6 items |
| Annual Meeting | Every 12 months | 9 items |

**Features:**
- Year-based filtering (Year 1-5)
- Expandable meeting cards with checklists
- Document upload per meeting
- PDF export for audits
- Case manager absence tracking
- Automated due date calculations
- Notification reminders (45, 30, 14, 7 days before)

### 5.3 Employee Management

#### 5.3.1 Employee List
- All staff with position and status
- House assignments
- Hire date and experience

#### 5.3.2 Employee Detail Page
- **Profile**: Name, contact info, position
- **House Assignments**: Multi-select assignment
- **Compliance Items**: Employee-specific compliance tracking
- **Documents**: Employee file storage

#### 5.3.3 Employee Compliance Items
- Background study (annual)
- Maltreatment training
- Orientation training
- Annual training
- Medication administration training
- Person-specific training
- First Aid/CPR certification
- TB test
- Driver's license check

### 5.4 House Management

#### 5.4.1 House List
- All houses with location and capacity
- License information
- Assigned staff count

#### 5.4.2 House Detail Page
- House information (address, county, license)
- Assigned staff list
- Current residents list
- House type (CRS, Out-of-Home)

### 5.5 Calendar

**Purpose:** Track appointments and activities for clients and houses.

**Features:**
- Monthly calendar view
- Event types: Appointments, Activities
- Client-specific or house-wide events
- Quick event creation
- Color-coded by type

### 5.6 Daily Operations

**Purpose:** Track daily operational status at each house.

**Features:**
- Daily report creation per house
- Census tracking
- Shift/staffing information
- Medication notes
- Meal notes
- Activity notes
- Incident reporting
- Maintenance items
- Submit/review workflow
- PDF export

### 5.7 DC Daily Checklist

**Purpose:** Standardized daily oversight checklist for Designated Coordinators.

**Remote Oversight Tasks (15 items):**
- Log notes reviewed
- Gmail checked
- Appointments reviewed
- Calendar updated
- Schedule verified
- Clock-in reviewed
- Controlled substances checked
- Medications administered
- Progress notes reviewed
- PRN documented
- Incident reports reviewed
- Appointment follow-ups
- Staff training checked
- Evening meds reviewed
- Narcotic counts verified

**Onsite Visit Tasks (32 items):**
- Clocked in
- Handoff reviewed
- Verbal handoff
- Narcotic count
- Petty cash count
- Med quantities reviewed
- PRN meds checked
- Overflow bins checked
- Pharmacy delivery reviewed
- Med storage checked
- Glucometer supplies
- Staff interactions
- Rooms clean
- Dietary followed
- Activities observed
- Resident spoken with
- Receipt binder reviewed
- Resident binders reviewed
- After visit summaries
- Outcome tracker
- Fire drill binder
- Common areas cleaned
- Food labeled
- Supplies stocked
- Bathrooms cleaned
- Garbage checked
- iPad charged
- Doors secure
- Water softener checked
- Furnace filter
- Exterior checked
- Staff coaching

### 5.8 Weekly DC Reports

**Purpose:** Weekly summary report from DC to Director/Manager.

**Sections:**
- Overall week rating (1-5)
- Staffing coverage summary
- Staff performance highlights/concerns
- Resident wellbeing overview
- Medication issues
- Maintenance concerns
- Incidents summary
- Appointments completed
- Upcoming concerns
- Supplies needed
- Training needs

**Weekly Tasks:**
- Schedule created/submitted
- House lead meeting completed
- Receipts uploaded
- Notion updated
- Activities reviewed

### 5.9 Rent Tracking

**Purpose:** Track monthly rent payments from clients.

**Features:**
- Monthly rent tracking per client
- Payment recording (amount, date, method, check number)
- Sign-off workflow (entry vs approval)
- Payment history
- Outstanding balance tracking

### 5.10 Expense Tracking

**Purpose:** Track house expenses and bill.com card usage.

**Features:**
- Expense entry with receipts
- Category classification (Groceries, Household, Activities, Medical, Transportation)
- Participant tracking
- Monthly confirmation workflow
- Receipt image storage

### 5.11 Admission/Discharge Register

**Purpose:** Track client movements and census changes.

**Entry Types:**
- Admission
- Discharge
- Transfer In
- Transfer Out

**Captured Information:**
- Date
- From/To location
- Reason
- Discharge type (Planned, Unplanned, Emergency, Death)
- Notes

### 5.12 QA Checklists

**Purpose:** Periodic quality assurance reviews.

**Checklist Types:**
- Monthly House Review
- Quarterly Client Review
- Annual Review
- Incident Follow-up

**Features:**
- Customizable checklist items
- Yes/No/N/A responses with notes
- Follow-up tracking
- PDF export

### 5.13 Resource Hub

**Purpose:** Central repository for policies, forms, and training materials.

**Resource Categories:**
- Policies (Company policies)
- DHS Forms (Required DHS forms)
- Health Forms (Medical forms)
- Program Forms (Service-related forms)
- Renewal Packets (DC renewal materials)
- Training Materials
- Other

**Additional Features:**
- Video tutorials (YouTube, Vimeo, Scribe embeds)
- Searchable document library
- Custom ordering

### 5.14 Notifications

**Purpose:** Proactive alerts for compliance items.

**Notification Types:**
| Type | Description | Timing |
|------|-------------|--------|
| DEADLINE_WARNING | Upcoming compliance item | 7, 14, 30 days before |
| OVERDUE | Past-due compliance item | Day after due date |
| MEETING_REMINDER | Upcoming 245D meeting | 7, 14, 30, 45 days before |
| MEETING_OVERDUE | Missed 245D meeting | Day after due date |
| SYSTEM | General system notifications | As needed |

**Features:**
- In-app notification bell with unread count
- Mark as read
- Click to navigate to relevant page
- Automated generation via cron job (daily at 8 AM UTC)

### 5.15 Settings & Administration

**Features:**
- User management (create, edit, deactivate)
- House assignments
- Role management
- Site settings (Resource Hub customization)
- Audit logs viewer

---

## 6. Technical Architecture

### 6.1 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Frontend | Next.js | 16.1.1 | React framework with App Router |
| UI Library | React | 19.2.3 | Component library |
| UI Components | shadcn/ui | Latest | Pre-built accessible components |
| Styling | Tailwind CSS | 4.x | Utility-first CSS |
| Icons | Lucide React | 0.562.0 | Icon library |
| Backend | Next.js API Routes | 16.1.1 | Server-side API endpoints |
| Database | PostgreSQL | 15+ | Primary data store |
| ORM | Prisma | 6.19.1 | Database access layer |
| File Storage | Vercel Blob | 2.0.0 | Document/image storage |
| PDF Generation | @react-pdf/renderer | 4.3.2 | PDF document creation |
| Authentication | jose + bcryptjs | 6.1.3 / 3.0.3 | JWT tokens + password hashing |
| Date Handling | date-fns | 4.1.0 | Date manipulation |
| Hosting | Vercel | - | Serverless deployment |
| Database Hosting | Neon | - | Serverless PostgreSQL |

### 6.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                               │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Browser   │  │   Mobile    │  │   Tablet    │  │   Desktop   │    │
│  │   (Any)     │  │  (Safari)   │  │   (Any)     │  │   (Any)     │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         └────────────────┴────────────────┴────────────────┘           │
│                                   │                                     │
│                              HTTPS/TLS                                  │
└───────────────────────────────────┼─────────────────────────────────────┘
                                    │
┌───────────────────────────────────┼─────────────────────────────────────┐
│                          VERCEL EDGE NETWORK                            │
├───────────────────────────────────┼─────────────────────────────────────┤
│                    ┌──────────────┴──────────────┐                      │
│                    │        CDN / Edge Cache      │                      │
│                    └──────────────┬──────────────┘                      │
└───────────────────────────────────┼─────────────────────────────────────┘
                                    │
┌───────────────────────────────────┼─────────────────────────────────────┐
│                           APPLICATION LAYER                             │
├───────────────────────────────────┼─────────────────────────────────────┤
│  ┌────────────────────────────────┴────────────────────────────────┐   │
│  │                    Next.js 16 Application                        │   │
│  ├──────────────────────────────────────────────────────────────────┤   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │   │
│  │  │  Server         │  │  API Routes     │  │  Static         │  │   │
│  │  │  Components     │  │  (/api/*)       │  │  Assets         │  │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│  ┌─────────────────────────────────┼─────────────────────────────────┐  │
│  │                         Middleware                                 │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │  │
│  │  │ Auth Check   │  │ Route Guard  │  │ Session Mgmt │            │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │  │
│  └─────────────────────────────────┼─────────────────────────────────┘  │
└───────────────────────────────────┼─────────────────────────────────────┘
                                    │
┌───────────────────────────────────┼─────────────────────────────────────┐
│                             DATA LAYER                                  │
├───────────────────────────────────┼─────────────────────────────────────┤
│  ┌────────────────────────────────┴────────────────────────────────┐   │
│  │                      Prisma ORM Client                           │   │
│  └──────────────┬─────────────────────────────────┬────────────────┘   │
│                 │                                 │                     │
│  ┌──────────────┴──────────────┐  ┌──────────────┴──────────────┐     │
│  │     PostgreSQL (Neon)       │  │     Vercel Blob Storage     │     │
│  │  ┌────────────────────────┐ │  │  ┌────────────────────────┐ │     │
│  │  │ Users, Clients,        │ │  │  │ Documents, PDFs,       │ │     │
│  │  │ Employees, Houses,     │ │  │  │ Images, Receipts       │ │     │
│  │  │ Compliance, etc.       │ │  │  │                        │ │     │
│  │  └────────────────────────┘ │  │  └────────────────────────┘ │     │
│  └─────────────────────────────┘  └─────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
┌───────────────────────────────────┼─────────────────────────────────────┐
│                          EXTERNAL SERVICES                              │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │  Vercel Cron    │  │  (Future)       │  │  (Future)       │         │
│  │  Daily @ 8 AM   │  │  Email Service  │  │  SMS Service    │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Directory Structure

```
mercy-link-onboarding/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seeding
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── clients/       # Client CRUD + nested resources
│   │   │   ├── employees/     # Employee CRUD
│   │   │   ├── houses/        # House CRUD
│   │   │   ├── notifications/ # Notification endpoints
│   │   │   ├── upload/        # File upload handling
│   │   │   └── ...            # Other API routes
│   │   ├── dashboard/         # Dashboard pages
│   │   │   ├── clients/       # Client pages
│   │   │   ├── employees/     # Employee pages
│   │   │   ├── houses/        # House pages
│   │   │   ├── calendar/      # Calendar page
│   │   │   ├── daily-operations/
│   │   │   ├── dc-checklist/
│   │   │   ├── weekly-reports/
│   │   │   ├── rent/
│   │   │   ├── expenses/
│   │   │   ├── register/
│   │   │   ├── qa-checklist/
│   │   │   ├── resources/
│   │   │   ├── notifications/
│   │   │   ├── settings/
│   │   │   └── page.tsx       # Dashboard home
│   │   ├── login/             # Login page
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Root redirect
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── sidebar.tsx        # Navigation sidebar
│   │   ├── notification-bell.tsx
│   │   └── ...                # Other components
│   └── lib/
│       ├── auth.ts            # Authentication utilities
│       ├── prisma.ts          # Prisma client instance
│       ├── meeting-compliance-templates.ts
│       ├── pdf-service.tsx    # PDF generation
│       └── pdf-templates/     # PDF template components
├── docs/                      # Documentation
├── vercel.json                # Vercel configuration
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

### 6.4 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Next.js App Router | Server components for performance, API routes for backend |
| PostgreSQL over MongoDB | Relational data with complex joins, ACID compliance |
| Vercel Blob over S3 | Simpler integration, automatic CDN, no CORS issues |
| JWT over Sessions | Stateless authentication, works with serverless |
| shadcn/ui over Material UI | Accessible, customizable, smaller bundle |
| @react-pdf/renderer | Pure JS, works in serverless, no external dependencies |

---

## 7. Data Model

### 7.1 Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │───────│  UserHouse  │───────│    House    │
│             │ 1   n │             │ n   1 │             │
│ - id        │       │ - userId    │       │ - id        │
│ - email     │       │ - houseId   │       │ - name      │
│ - password  │       └─────────────┘       │ - address   │
│ - name      │                             │ - county    │
│ - role      │                             │ - capacity  │
└─────────────┘                             └──────┬──────┘
                                                   │
                                                   │ 1
                                                   │
                                                   │ n
                                            ┌──────┴──────┐
                                            │   Client    │
                                            │             │
                                            │ - id        │
                                            │ - firstName │
                                            │ - lastName  │
                                            │ - houseId   │
                                            │ - ...       │
                                            └──────┬──────┘
                                                   │
              ┌────────────────────────────────────┼────────────────────────────────────┐
              │                                    │                                    │
              │ n                                  │ n                                  │ n
       ┌──────┴──────┐                      ┌──────┴──────┐                     ┌───────┴──────┐
       │ Compliance  │                      │  Meeting    │                     │   Support    │
       │    Item     │                      │ Compliance  │                     │    Plan      │
       │             │                      │             │                     │              │
       │ - dueDate   │                      │ - meetingType                     │ - planType   │
       │ - status    │                      │ - year      │                     │ - startDate  │
       │ - itemName  │                      │ - checklist │                     │ - endDate    │
       └─────────────┘                      └─────────────┘                     └──────────────┘
```

### 7.2 Core Models

#### User
- Primary authentication entity
- Roles: ADMIN, DESIGNATED_COORDINATOR, LEAD_STAFF
- Relations to houses via UserHouse junction table

#### House
- Residential site/location
- Contains clients and is assigned employees
- Types: CRS (residential), OUT_OF_HOME (ICS/IHS)

#### Client
- Service recipient/person served
- Contains comprehensive personal, medical, and service information
- Face sheet data embedded in model

#### Employee
- Staff member (DSP, Lead DSP, DC, DM)
- Assigned to houses via EmployeeHouse junction table

#### ComplianceItem
- Individual compliance requirement
- Can be linked to client or employee
- Tracks due date, status, completion

#### ClientMeetingCompliance
- 245D meeting record with document checklist
- Types: ADMISSION, INITIAL_45_60_DAY, SEMI_ANNUAL, ANNUAL
- Checklist stored as JSON

#### Document
- File metadata with blob storage URL
- Can be linked to compliance items, meetings, clients, or employees

### 7.3 Complete Schema

See [Appendix A](#a-database-schema) for full Prisma schema.

---

## 8. API Reference

### 8.1 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Authenticate user, return session token |
| POST | `/api/auth/logout` | Clear session cookie |
| GET | `/api/auth/session` | Get current session user |

### 8.2 Clients

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clients` | List all clients (filtered by house access) |
| POST | `/api/clients` | Create new client |
| GET | `/api/clients/[id]` | Get client details |
| PUT | `/api/clients/[id]` | Update client |
| DELETE | `/api/clients/[id]` | Delete client |
| GET | `/api/clients/[id]/face-sheet` | Get face sheet data |
| PUT | `/api/clients/[id]/face-sheet` | Update face sheet |
| GET | `/api/clients/[id]/meeting-compliance` | List meetings |
| POST | `/api/clients/[id]/meeting-compliance` | Create meeting |
| PUT | `/api/clients/[id]/meeting-compliance/[meetingId]` | Update meeting |
| DELETE | `/api/clients/[id]/meeting-compliance/[meetingId]` | Delete meeting |
| GET | `/api/clients/[id]/summaries` | List monthly summaries |
| POST | `/api/clients/[id]/summaries` | Upload summary |
| DELETE | `/api/clients/[id]/summaries/[summaryId]` | Delete summary |
| GET | `/api/clients/[id]/support-plans` | List support plans |
| POST | `/api/clients/[id]/support-plans` | Upload plan |
| DELETE | `/api/clients/[id]/support-plans/[planId]` | Delete plan |
| GET | `/api/clients/[id]/providers` | List additional providers |
| POST | `/api/clients/[id]/providers` | Add provider |
| PUT | `/api/clients/[id]/providers/[providerId]` | Update provider |
| DELETE | `/api/clients/[id]/providers/[providerId]` | Delete provider |

### 8.3 Employees

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees` | List all employees |
| POST | `/api/employees` | Create employee |
| GET | `/api/employees/[id]` | Get employee details |
| PUT | `/api/employees/[id]` | Update employee |
| DELETE | `/api/employees/[id]` | Delete employee |

### 8.4 Houses

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/houses` | List all houses |
| POST | `/api/houses` | Create house |
| GET | `/api/houses/[id]` | Get house details |
| PUT | `/api/houses/[id]` | Update house |
| DELETE | `/api/houses/[id]` | Delete house |

### 8.5 Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/daily-operations` | List daily reports |
| POST | `/api/daily-operations` | Create daily report |
| PUT | `/api/daily-operations/[id]` | Update daily report |
| POST | `/api/daily-operations/[id]/submit` | Submit for review |
| POST | `/api/daily-operations/[id]/review` | Mark as reviewed |
| GET | `/api/dc-checklist` | List DC checklists |
| POST | `/api/dc-checklist` | Create checklist |
| PUT | `/api/dc-checklist/[id]` | Update checklist |
| GET | `/api/weekly-reports` | List weekly reports |
| POST | `/api/weekly-reports` | Create weekly report |
| PUT | `/api/weekly-reports/[id]` | Update weekly report |

### 8.6 Financial

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rent` | List rent payments |
| POST | `/api/rent` | Record payment |
| PUT | `/api/rent/[id]` | Update payment |
| POST | `/api/rent/[id]/sign-off` | Sign off on payment |
| GET | `/api/expenses` | List expenses |
| POST | `/api/expenses` | Record expense |
| PUT | `/api/expenses/[id]` | Update expense |
| DELETE | `/api/expenses/[id]` | Delete expense |

### 8.7 Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calendar` | List calendar events |
| POST | `/api/calendar` | Create event |
| PUT | `/api/calendar/[id]` | Update event |
| DELETE | `/api/calendar/[id]` | Delete event |
| GET | `/api/register` | List admission/discharge records |
| POST | `/api/register` | Create record |
| GET | `/api/qa-checklist` | List QA checklists |
| POST | `/api/qa-checklist` | Create checklist |
| PUT | `/api/qa-checklist/[id]` | Update checklist |
| GET | `/api/notifications` | List user notifications |
| POST | `/api/notifications/[id]/read` | Mark as read |
| GET | `/api/notifications/generate` | Generate notifications (cron) |
| POST | `/api/upload` | Upload file to blob storage |
| DELETE | `/api/upload/delete` | Delete file from storage |
| GET | `/api/hub/resources` | List resources |
| POST | `/api/hub/resources` | Upload resource |
| GET | `/api/hub/tutorials` | List tutorials |
| POST | `/api/hub/tutorials` | Create tutorial |
| GET | `/api/settings` | Get site settings |
| PUT | `/api/settings` | Update site settings |
| GET | `/api/users` | List users (admin) |
| POST | `/api/users` | Create user (admin) |
| PUT | `/api/users/[id]` | Update user (admin) |

---

## 9. User Interface & Experience

### 9.1 Design System

**Color Palette:**
| Color | Hex | Usage |
|-------|-----|-------|
| Primary Blue | #2563eb | Primary actions, links |
| Success Green | #16a34a | Completed status, success messages |
| Warning Orange | #ea580c | Upcoming deadlines, caution |
| Error Red | #dc2626 | Overdue items, errors |
| Slate Gray | #64748b | Secondary text, borders |

**Typography:**
- Font Family: Inter (system fallback: -apple-system, sans-serif)
- Headings: Bold, 1.5rem - 2rem
- Body: Regular, 0.875rem - 1rem
- Monospace: For dates, IDs

**Spacing:**
- Base unit: 4px
- Consistent padding: 16px (cards), 24px (pages)
- Gap: 8px (tight), 16px (normal), 24px (loose)

### 9.2 Component Library

Built on shadcn/ui with customizations:

| Component | Usage |
|-----------|-------|
| Card | Content containers, stats display |
| Button | Primary/secondary/destructive actions |
| Dialog | Modal forms, confirmations |
| Tabs | Content organization |
| Badge | Status indicators |
| Alert | Notifications, warnings |
| Checkbox | Checklists, toggles |
| Select | Dropdowns, filters |
| Input | Form fields |
| Label | Form labels |
| Separator | Visual dividers |
| ScrollArea | Scrollable containers |
| Avatar | User/client images |
| DropdownMenu | Action menus |

### 9.3 Navigation Structure

```
┌─────────────────────────────────────────────────────────────┐
│ ≡ Mercy Link                              🔔 User ▼        │
├───────────────┬─────────────────────────────────────────────┤
│               │                                             │
│ Dashboard     │  [Main Content Area]                        │
│ Clients       │                                             │
│ Employees     │                                             │
│ Houses        │                                             │
│ Calendar      │                                             │
│ ───────────── │                                             │
│ Daily Ops     │                                             │
│ DC Checklist  │                                             │
│ Weekly Reports│                                             │
│ ───────────── │                                             │
│ Rent          │                                             │
│ Expenses      │                                             │
│ Register      │                                             │
│ ───────────── │                                             │
│ QA Checklist  │                                             │
│ Documents     │                                             │
│ Resources     │                                             │
│ ───────────── │                                             │
│ Notifications │                                             │
│ Settings      │                                             │
│               │                                             │
└───────────────┴─────────────────────────────────────────────┘
```

### 9.4 Responsive Design

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile | <768px | Single column, collapsible sidebar |
| Tablet | 768-1024px | Two columns, visible sidebar |
| Desktop | >1024px | Three columns, full sidebar |

### 9.5 Key User Flows

#### Flow 1: Complete 245D Meeting Checklist
1. Navigate to Client Detail page
2. Click "New Meeting" button
3. Select meeting type and date
4. System creates meeting with pre-populated checklist
5. User checks off items as completed
6. Upload supporting documents
7. Export PDF for audit

#### Flow 2: Daily DC Operations
1. DC logs in
2. Navigate to DC Checklist
3. Select house and date
4. Choose visit type (Remote/Onsite)
5. Complete checklist items
6. Add notes and follow-up items
7. Save checklist

#### Flow 3: Employee Compliance Tracking
1. Navigate to Employee Detail
2. View compliance items list
3. Click item to update
4. Mark complete with date
5. Upload supporting document
6. System updates status

---

## 10. Security & Compliance

### 10.1 Authentication

**Implementation:**
- JWT-based authentication using `jose` library
- Tokens signed with HS256 algorithm
- 8-hour expiration time
- HTTP-only, secure cookies
- Password hashing with bcryptjs (12 rounds)

**Session Management:**
```typescript
// Token creation
const token = await new SignJWT({ user })
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime("8h")
  .sign(SECRET_KEY);

// Cookie settings
cookieStore.set("session", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 60 * 60 * 8, // 8 hours
  path: "/",
});
```

### 10.2 Authorization

**Role-Based Access Control (RBAC):**

| Permission | Admin | DC | Lead Staff |
|------------|-------|-----|------------|
| View all houses | ✓ | Own only | Own only |
| Create/edit clients | ✓ | ✓ | ✓ |
| Delete clients | ✓ | ✓ | ✗ |
| Create/edit employees | ✓ | ✓ | ✗ |
| Delete records | ✓ | ✓ | ✗ |
| User management | ✓ | ✗ | ✗ |
| System settings | ✓ | ✗ | ✗ |

**House-Level Access:**
- Non-admin users only see data for assigned houses
- Verified on every API request via `getUserHouseIds()`

### 10.3 Data Protection

**Sensitive Data Handling:**
- SSN: Only last 4 digits stored
- Passwords: bcrypt hashed, never stored plain
- MyChart credentials: Encrypted at rest (database-level)

**File Security:**
- Vercel Blob: Private by default
- Signed URLs for document access
- File type validation on upload
- Maximum file size: 10MB

### 10.4 HIPAA Considerations

While not fully HIPAA-compliant without additional measures, the application includes:

| Control | Implementation |
|---------|----------------|
| Access Control | Role-based permissions, house-level isolation |
| Audit Logging | All CRUD actions logged with user, timestamp, details |
| Data Encryption | TLS in transit, encryption at rest (Neon, Vercel) |
| Session Timeout | 8-hour automatic logout |
| Minimum Necessary | Users only see houses they're assigned to |

**Recommended for Full HIPAA:**
- BAA with Vercel and Neon
- Enhanced audit logging
- Data loss prevention policies
- Employee security training documentation
- Incident response procedures

### 10.5 Audit Logging

**Logged Actions:**
- CREATE, UPDATE, DELETE for all entities
- LOGIN, LOGOUT events
- UPLOAD, STATUS_CHANGE events

**Log Entry Structure:**
```typescript
{
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  details: JSON, // before/after values
  ipAddress: string,
  createdAt: timestamp
}
```

---

## 11. Deployment & Infrastructure

### 11.1 Hosting Architecture

**Vercel:**
- Serverless functions for API routes
- Edge network for static assets
- Automatic SSL certificates
- Git-based deployments

**Neon (PostgreSQL):**
- Serverless PostgreSQL
- Automatic scaling
- Point-in-time recovery
- Connection pooling

**Vercel Blob:**
- S3-compatible object storage
- Global CDN distribution
- Simple API for uploads

### 11.2 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Neon PostgreSQL connection string | Yes |
| `AUTH_SECRET` | JWT signing secret | Yes |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob access token | Yes |
| `CRON_SECRET` | Secret for cron job authentication | Recommended |

### 11.3 CI/CD Pipeline

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   GitHub    │────▶│   Vercel    │────▶│ Production  │
│   Push      │     │   Build     │     │   Deploy    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │                   ├── prisma generate
       │                   ├── next build
       │                   └── Type checking
       │
       └── Preview deployments for PRs
```

### 11.4 Cron Jobs

**Notification Generation:**
- Schedule: Daily at 8:00 AM UTC
- Endpoint: `/api/notifications/generate`
- Configuration: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/notifications/generate",
      "schedule": "0 8 * * *"
    }
  ]
}
```

### 11.5 Database Migrations

Using Prisma:
```bash
# Development: Push schema changes
npx prisma db push

# Production: Generate migration
npx prisma migrate dev --name description

# Deploy migration
npx prisma migrate deploy
```

---

## 12. Monitoring & Maintenance

### 12.1 Performance Monitoring

**Vercel Analytics:**
- Core Web Vitals tracking
- Function execution times
- Error rates

**Key Metrics to Monitor:**
| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| First Contentful Paint | <1.8s | >3s |
| API Response Time | <500ms | >2s |
| Error Rate | <0.1% | >1% |
| Database Query Time | <100ms | >500ms |

### 12.2 Error Tracking

**Implementation:**
- Try/catch blocks on all API routes
- Structured error responses
- Console logging for debugging

**Recommended Addition:**
- Sentry integration for production error tracking

### 12.3 Backup Strategy

**Database:**
- Neon automatic daily backups
- Point-in-time recovery (7 days)

**Documents:**
- Vercel Blob redundant storage
- Consider periodic export to secondary storage

### 12.4 Maintenance Tasks

| Task | Frequency | Responsible |
|------|-----------|-------------|
| Review audit logs | Weekly | Admin |
| Check overdue items | Daily | DC/Admin |
| Database backup verification | Monthly | Admin |
| Security updates | As released | Developer |
| User access review | Quarterly | Admin |

---

## 13. Future Roadmap

### 13.1 Phase 2: Enhanced Notifications

- [ ] Email notifications for critical alerts
- [ ] SMS notifications for urgent items
- [ ] Configurable notification preferences
- [ ] Daily/weekly digest emails

### 13.2 Phase 3: Advanced Reporting

- [ ] Compliance analytics dashboard
- [ ] Cross-house comparison reports
- [ ] Trend analysis over time
- [ ] Exportable compliance reports
- [ ] DHS audit report generator

### 13.3 Phase 4: Integration

- [ ] Electronic signature integration (DocuSign/HelloSign)
- [ ] Calendar sync (Google/Outlook)
- [ ] Billing system integration
- [ ] EHR integration
- [ ] Time tracking integration

### 13.4 Phase 5: Mobile App

- [ ] Native mobile app (React Native)
- [ ] Offline support for site visits
- [ ] Photo capture for documentation
- [ ] Push notifications

### 13.5 Phase 6: AI Enhancements

- [ ] Document OCR and classification
- [ ] Compliance risk prediction
- [ ] Automated progress note generation
- [ ] Smart deadline recommendations

---

## 14. Appendix

### A. Database Schema

See `/prisma/schema.prisma` for complete schema definition.

**Model Count:** 22 models
- User, UserHouse, House
- Client, ClientProvider, ClientMonthlySummary, ClientSupportPlan, ClientMeetingCompliance
- Employee, EmployeeHouse
- ComplianceItem, Document
- AdmissionDischarge, RentPayment, HouseExpense
- HouseCalendarEvent, DailyOperationsReport, DCDailyChecklist, WeeklyDCReport
- QAChecklist, Notification, AuditLog
- HubResource, HubTutorial, SiteSetting

### B. 245D Compliance Reference

**Key Statute Sections:**
- 245D.07: Service recipient rights
- 245D.09: Individual abuse prevention plan
- 245D.10: Service planning (CSSP, assessments)
- 245D.11: Progress reviews and reporting

**Timeline Requirements:**
| Item | Deadline |
|------|----------|
| Preliminary CSSP | At admission |
| Functional Assessment | 60 days |
| Full CSSP | 60 days |
| Progress Review | Every 6 months |
| Annual Planning | Every 12 months |
| Rights Orientation | At admission + annually |

### C. Signer Legend

| Code | Description |
|------|-------------|
| Person | The client/service recipient |
| Legal Rep | Guardian or legal representative |
| Case Manager | MH or CADI case manager |
| Provider | Mercy Link staff/Designated Coordinator |

### D. Service Types

| Code | Description |
|------|-------------|
| CRS | Community Residential Settings |
| ICS | Intensive Community Services |
| IHS_WITH_TRAINING | In-Home Services with Training |
| IHS_WITHOUT_TRAINING | In-Home Services without Training |
| NIGHT_SUPERVISION | Overnight supervision services |
| HOMEMAKING | Homemaking services |
| EA_24_HOUR | 24-hour emergency assistance |

### E. Glossary

| Term | Definition |
|------|------------|
| 245D | Minnesota statute governing HCBS |
| CSSP | Coordinated Service and Support Plan |
| DC | Designated Coordinator |
| DHS | Minnesota Department of Human Services |
| DSP | Direct Support Professional |
| HCBS | Home and Community-Based Services |
| IAPP | Individual Abuse Prevention Plan |
| PMI | Person's Medical Insurance number |
| SMA | Self-Management Assessment |

---

**Document Prepared By:** Claude Code
**Last Updated:** January 8, 2026
**Version:** 2.0
