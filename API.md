# API Reference

## Authentication

All protected routes require a valid JWT session cookie.

### POST /api/auth/login
Authenticate user and create session.

**Request Body:**
```json
{
  "email": "user@mercylink.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "clx...",
    "email": "user@mercylink.com",
    "name": "User Name",
    "role": "ADMIN"
  }
}
```

### POST /api/auth/logout
Clear session cookie.

**Response (200):**
```json
{ "success": true }
```

### GET /api/auth/session
Get current session user.

**Response (200):**
```json
{
  "user": {
    "id": "clx...",
    "email": "user@mercylink.com",
    "name": "User Name",
    "role": "ADMIN"
  }
}
```

---

## Clients

### GET /api/clients
List clients accessible to current user.

**Query Parameters:**
- `houseId` (optional): Filter by house
- `status` (optional): Filter by status (ACTIVE, DISCHARGED)
- `search` (optional): Search by name

**Response (200):**
```json
{
  "clients": [
    {
      "id": "clx...",
      "firstName": "John",
      "lastName": "Doe",
      "dob": "1980-05-15T00:00:00.000Z",
      "admissionDate": "2024-01-15T00:00:00.000Z",
      "houseId": "cedar-house",
      "waiverType": "DD",
      "status": "ACTIVE",
      "house": { "id": "cedar-house", "name": "Cedar House" },
      "_count": { "complianceItems": 8 }
    }
  ]
}
```

### POST /api/clients
Create new client. Requires ADMIN or DC role.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dob": "1980-05-15",
  "admissionDate": "2024-01-15",
  "houseId": "cedar-house",
  "caseManagerName": "Jane Smith",
  "caseManagerEmail": "jane@county.gov",
  "caseManagerPhone": "(612) 555-1234",
  "legalRepName": "Parent Name",
  "legalRepPhone": "(612) 555-5678",
  "waiverType": "DD"
}
```

**Response (201):**
Returns created client object.

### GET /api/clients/[id]
Get single client with compliance items and documents.

**Response (200):**
```json
{
  "id": "clx...",
  "firstName": "John",
  "lastName": "Doe",
  "house": { ... },
  "complianceItems": [...],
  "documents": [...]
}
```

### PUT /api/clients/[id]
Update client. Requires ADMIN or DC role.

### DELETE /api/clients/[id]
Delete client. Requires ADMIN role.

---

## Employees

### GET /api/employees
List employees accessible to current user.

**Query Parameters:**
- `houseId` (optional): Filter by assigned house
- `status` (optional): Filter by status
- `position` (optional): Filter by position (DSP, LEAD_DSP, DC, DM)

### POST /api/employees
Create new employee. Requires ADMIN role.

**Request Body:**
```json
{
  "firstName": "Alex",
  "lastName": "Thompson",
  "email": "alex@mercylink.com",
  "phone": "(651) 555-1234",
  "hireDate": "2024-01-01",
  "position": "DSP",
  "experienceYears": 2,
  "houseIds": ["cedar-house", "maple-house"]
}
```

### GET /api/employees/[id]
Get single employee with training items and documents.

### PUT /api/employees/[id]
Update employee.

### DELETE /api/employees/[id]
Delete employee. Requires ADMIN role.

---

## Houses

### GET /api/houses
List houses accessible to current user.

### POST /api/houses
Create new house. Requires ADMIN role.

**Request Body:**
```json
{
  "name": "New House",
  "address": "123 Main St, City, MN 55555",
  "county": "Dakota",
  "licenseNumber": "245D-123456",
  "capacity": 4
}
```

### GET /api/houses/[id]
Get house with clients and assigned staff.

### PUT /api/houses/[id]
Update house. Requires ADMIN role.

### DELETE /api/houses/[id]
Delete house. Requires ADMIN role. House must have no clients.

---

## Compliance

### POST /api/compliance/[id]/complete
Mark compliance item as complete.

**Request Body:**
```json
{
  "completedDate": "2024-03-15",
  "notes": "Training completed successfully"
}
```

**Response (200):**
```json
{
  "id": "clx...",
  "status": "COMPLETED",
  "completedDate": "2024-03-15T00:00:00.000Z"
}
```

---

## Documents

### GET /api/documents
List documents accessible to current user.

**Query Parameters:**
- `entityType` (optional): "client" or "employee"
- `search` (optional): Search by filename

### POST /api/documents
Upload document.

**Request Body (multipart/form-data):**
- `file`: File to upload
- `clientId` (optional): Associate with client
- `employeeId` (optional): Associate with employee
- `complianceItemId` (optional): Link to compliance item

**Response (201):**
```json
{
  "id": "clx...",
  "fileName": "document.pdf",
  "filePath": "/uploads/2024/03/abc123.pdf",
  "fileType": "application/pdf",
  "fileSize": 102400
}
```

### DELETE /api/documents/[id]
Delete document. Requires ADMIN or DC role.

---

## Notifications

### GET /api/notifications
Get notifications for current user.

**Query Parameters:**
- `unreadOnly` (optional): Only return unread notifications

### POST /api/notifications/generate
Generate notifications for upcoming/overdue deadlines. Requires ADMIN role.

**Response (200):**
```json
{
  "created": 15,
  "message": "Generated 15 new notifications"
}
```

### PATCH /api/notifications/[id]/read
Mark notification as read.

---

## Users (Admin Only)

### GET /api/users
List all users. Requires ADMIN role.

### POST /api/users
Create new user. Requires ADMIN role.

**Request Body:**
```json
{
  "email": "newuser@mercylink.com",
  "password": "securepassword",
  "name": "New User",
  "role": "DESIGNATED_COORDINATOR",
  "houseIds": ["cedar-house", "maple-house"]
}
```

### GET /api/users/[id]
Get single user.

### PUT /api/users/[id]
Update user.

### DELETE /api/users/[id]
Delete user. Cannot delete yourself.

---

## File Serving

### GET /api/uploads/[...path]
Serve uploaded files. Requires authentication.

---

## Error Responses

All endpoints return consistent error format:

**401 Unauthorized:**
```json
{ "error": "Unauthorized" }
```

**403 Forbidden:**
```json
{ "error": "Access denied" }
```

**404 Not Found:**
```json
{ "error": "Resource not found" }
```

**400 Bad Request:**
```json
{ "error": "Validation error message" }
```

**500 Server Error:**
```json
{ "error": "Internal server error" }
```

---

## Rate Limits

Currently no rate limits implemented. Consider adding for production:
- API routes: 100 requests/minute per user
- File uploads: 10 uploads/minute per user
- Auth attempts: 5 attempts/15 minutes per IP

---

## Webhooks (Planned)

Future webhook support for:
- Compliance item status changes
- New document uploads
- Overdue deadline alerts

---

## Versioning

API is currently unversioned. Future versions will use:
- `/api/v1/...` - Current stable
- `/api/v2/...` - Next version with breaking changes
