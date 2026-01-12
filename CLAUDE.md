# Mercy Link 245D Compliance Portal

## Project Overview

This is Mercy Link LLC's 245D Compliance Dashboard - a Next.js application for managing compliance tracking across 8 Community Residential Settings (CRS) in Dakota and Hennepin Counties, Minnesota. The organization serves 55 individuals with developmental disabilities under Minnesota's 245D licensing framework.

**Live URL**: https://mercylinkportal.com  
**Repository**: https://github.com/faisaljama/mercy-link-onboarding

## Tech Stack

- **Framework**: Next.js 16.1.1 (App Router with Turbopack)
- **Database**: PostgreSQL (Neon) with Prisma ORM
- **Authentication**: Custom JWT-based auth with bcryptjs
- **Styling**: Tailwind CSS 4 with Radix UI components
- **Deployment**: Vercel

## Key Features

### Current Implementation
- Dashboard with compliance statistics and deadline tracking
- Client management (55 service recipients across 8 houses)
- Employee management with training compliance tracking
- House/CRS management for 8 locations
- Document upload and management
- Notification system for deadline warnings
- Role-based access control (Admin, Designated Coordinator, Lead Staff)
- Compliance item tracking per 245D statute requirements

### Compliance Items Tracked

**Client Compliance (per 245D requirements)**:
- Abuse Prevention Plan (admission day) - 245D.071, Subd. 2
- Preliminary CSSP Addendum (15 days) - 245D.071, Subd. 3(a)
- Functional Assessment (60 days) - 245D.071, Subd. 3(b)
- 45/60-Day Planning Meeting - 245D.071, Subd. 3(c)
- Service Plan CSSP Addendum (74 days) - 245D.071, Subd. 4(a)
- Service Recipient Rights Review - 245D.04
- Quarterly Progress Reviews - 245D.071, Subd. 5

**Employee Compliance**:
- Background Study (NETStudy 2.0) - 245C.04
- Maltreatment Reporting Training (3 days) - 245D.09, Subd. 4(5)
- Orientation Training (60 days) - 245D.09, Subd. 4
- First Aid/CPR Certification (30 days) - 245D.09, Subd. 4(9)
- Annual Training (12/24 hours based on experience) - 245D.09, Subd. 5

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/         # Login, logout, session management
│   │   ├── clients/      # Client CRUD operations
│   │   ├── employees/    # Employee CRUD operations
│   │   ├── houses/       # House CRUD operations
│   │   ├── documents/    # Document management
│   │   ├── compliance/   # Compliance item updates
│   │   ├── notifications/# Notification management
│   │   ├── uploads/      # File serving
│   │   └── users/        # User management (admin only)
│   ├── dashboard/
│   │   ├── page.tsx      # Main dashboard with stats
│   │   ├── clients/      # Client listing and details
│   │   ├── employees/    # Employee listing and details
│   │   ├── houses/       # House listing and details
│   │   ├── documents/    # Document library
│   │   ├── notifications/# Notification center
│   │   └── settings/     # User management (admin)
│   ├── login/            # Login page
│   └── layout.tsx        # Root layout
├── components/
│   ├── ui/               # Radix-based UI components
│   ├── sidebar.tsx       # Navigation sidebar
│   ├── notification-bell.tsx
│   ├── document-upload.tsx
│   └── document-list.tsx
├── lib/
│   ├── auth.ts           # Authentication utilities
│   ├── prisma.ts         # Prisma client
│   └── utils.ts          # Helper functions
└── prisma/
    ├── schema.prisma     # Database schema
    └── seed.ts           # Seed data
```

## Database Schema

### Core Models
- **User**: System users with role-based access
- **House**: CRS locations (8 houses)
- **Client**: Service recipients (55 individuals)
- **Employee**: Staff members (DSP, Lead DSP, DC, DM positions)
- **ComplianceItem**: Deadline tracking for both clients and employees
- **Document**: Uploaded files linked to clients/employees/compliance items
- **Notification**: System notifications for deadline warnings
- **AuditLog**: Activity tracking

### Key Relationships
- Users can be assigned to specific houses (UserHouse)
- Employees can work at multiple houses (EmployeeHouse)
- Clients belong to one house
- Compliance items link to either a client OR an employee
- Documents can be linked to clients, employees, and/or compliance items

## Authentication & Authorization

### Roles
1. **ADMIN**: Full access to all houses, can manage users
2. **DESIGNATED_COORDINATOR**: Access only to assigned houses
3. **LEAD_STAFF**: Limited access to assigned houses, cannot delete documents

### Session Management
- JWT tokens stored in httpOnly cookies
- 8-hour session duration
- Role-based route protection

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Database operations
npm run db:seed      # Seed database with sample data
npm run db:reset     # Reset and reseed database
npm run db:studio    # Open Prisma Studio

# Build for production
npm run build
npm start
```

## Environment Variables

Required in `.env`:
```
DATABASE_URL=postgresql://...
AUTH_SECRET=your-secret-key-here
```

## API Patterns

### Standard CRUD Endpoints
- `GET /api/[resource]` - List with filtering
- `POST /api/[resource]` - Create new
- `GET /api/[resource]/[id]` - Get single
- `PUT /api/[resource]/[id]` - Update
- `DELETE /api/[resource]/[id]` - Delete

### Special Endpoints
- `POST /api/compliance/[id]/complete` - Mark compliance item complete
- `POST /api/notifications/generate` - Generate deadline notifications
- `PATCH /api/notifications/[id]/read` - Mark notification as read

## Business Context

### Organization Details
- **Company**: Mercy Link LLC
- **License**: Minnesota 245D Provider
- **Status**: Currently under conditional license with DHS
- **Services**: CRS, ICS, IRTS, and other waiver services
- **Coverage**: Dakota and Hennepin Counties

### Waiver Types Served
- DD (Developmental Disabilities)
- CADI (Community Access for Disability Inclusion)
- BI (Brain Injury)

## Compliance Priority Areas

Due to conditional license status, these areas require immediate attention:
1. Ensuring all client documentation is complete and current
2. Staff training compliance tracking
3. Quarterly progress review documentation
4. Background study verification
5. Abuse prevention plan updates

## Testing Credentials

```
Admin: faisal@mercylink.com / admin123
DC: dc@mercylink.com / dc123
```

## Future Enhancements Planned

1. PDF generation for compliance reports
2. Automated email notifications
3. Integration with NETStudy 2.0
4. Mobile app for staff
5. Billing/MHCP integration
6. Advanced reporting and analytics
