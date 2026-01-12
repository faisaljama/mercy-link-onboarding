# Quick Reference Guide

## Common Operations

### Adding a New Client

1. Navigate to Dashboard → Clients → Add Client
2. Required fields:
   - First Name, Last Name
   - Date of Birth
   - Admission Date
   - Assigned House
3. Optional but recommended:
   - Case Manager information
   - Legal Representative
   - Waiver Type (DD, CADI, BI)

**Auto-generated compliance items on client creation:**
- Abuse Prevention Plan (due: admission day)
- Service Recipient Rights (due: admission day)
- Preliminary CSSP Addendum (due: 15 days)
- Functional Assessment (due: 60 days)
- 45/60-Day Planning Meeting (due: 60 days)
- Service Plan CSSP Addendum (due: 74 days)
- Q1 Progress Review (due: 90 days)

---

### Adding a New Employee

1. Navigate to Dashboard → Employees → Add Employee
2. Required fields:
   - First Name, Last Name
   - Hire Date
   - Position (DSP, Lead DSP, DC, DM)
   - Assigned Houses (select one or more)
3. Optional:
   - Email, Phone
   - Years of Experience (affects annual training requirement)

**Auto-generated compliance items:**
- Background Study (due: hire day)
- Maltreatment Reporting Training (due: 3 days)
- First Aid/CPR (due: 30 days)
- Orientation Training (due: 60 days)
- Annual Training (due: anniversary date)

---

### Marking Compliance Items Complete

1. Go to Client or Employee detail page
2. Find the compliance item in the checklist
3. Click the checkbox or "Complete" button
4. Optionally add completion notes
5. Upload supporting documentation if required

**Best Practice**: Always upload documentation before marking complete.

---

### Uploading Documents

**From Client/Employee Detail Page:**
1. Go to the Documents tab
2. Click "Upload Document"
3. Select file(s)
4. Choose associated compliance item (optional)
5. Click Upload

**Supported file types:**
- PDF (recommended)
- Word documents (.doc, .docx)
- Images (.jpg, .png)
- Spreadsheets (.xlsx)

**File naming convention:**
`ClientLastName_DocumentType_Date.pdf`
Example: `Anderson_CSSP_2024-03-15.pdf`

---

### Creating New System Users

1. Navigate to Settings → Add User
2. Required fields:
   - Name
   - Email
   - Password
   - Role

**Roles:**
| Role | Access |
|------|--------|
| Admin | All houses, all features, user management |
| Designated Coordinator | Assigned houses only |
| Lead Staff | Assigned houses, cannot delete docs |

3. For non-Admin roles, assign specific houses

---

### Generating Deadline Notifications

1. Go to Settings (Admin only)
2. Click "Generate Notifications"
3. System will create notifications for:
   - Items overdue
   - Items due within 7 days
   - Items due within 14 days

**Note**: Run this at least weekly to keep notifications current.

---

## Filtering Data

### Client Filters
- By House: Select specific house
- By Status: Active / Discharged
- Search: Type client name

### Employee Filters
- By House: Staff assigned to specific house
- By Position: DSP, Lead DSP, DC, DM
- By Status: Active / Inactive / Terminated

### Document Filters
- By Type: Client or Employee documents
- Search: Search by filename

---

## Understanding Dashboard Statistics

| Stat | Meaning |
|------|---------|
| Total Clients | Active service recipients |
| Total Employees | Active staff members |
| Overdue Items | Compliance items past due date |
| Compliance Rate | % of items completed vs total |
| Due This Week | Items due in next 7 days |

**Color Coding:**
- 🔴 Red: Overdue / Critical
- 🟠 Orange: Due soon (within 7 days)
- 🟡 Yellow: Upcoming (within 14 days)
- 🟢 Green: Completed / Compliant
- 🔵 Blue: Pending (not urgent)

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Global Search | `/` or `Ctrl+K` |
| Go to Dashboard | `G` then `D` |
| Go to Clients | `G` then `C` |
| Go to Employees | `G` then `E` |
| Save Form | `Ctrl+S` |

*Note: Keyboard shortcuts are planned for future release.*

---

## Troubleshooting

### "Session Expired" Error
- Sessions last 8 hours
- Log out and log back in
- Check if cookies are enabled

### Document Upload Fails
- Check file size (max 10MB)
- Ensure supported file type
- Try refreshing the page

### Client/Employee Not Visible
- Check if assigned to your houses
- Verify you have correct role
- Admin can see all; DC/Staff see assigned only

### Compliance Items Missing
- Items are auto-generated on entity creation
- For existing clients, check if admission date is correct
- Contact admin to manually add missing items

---

## Emergency Contacts

**System Issues:**
- Contact: Faisal (Admin)
- Email: faisal@mercylink.com

**Compliance Questions:**
- DHS Licensing: 651-431-6500

**Incident Reporting:**
- Minnesota Adult Abuse: 844-880-1574

---

## Daily Checklist

☐ Check Dashboard for overdue items  
☐ Review "Due This Week" section  
☐ Process any new notifications  
☐ Verify new staff have background studies initiated  
☐ Check for incomplete documentation  

## Weekly Checklist

☐ Run notification generator (Admin)  
☐ Review all houses for compliance status  
☐ Follow up on overdue items  
☐ Audit upcoming planning meetings  

## Monthly Checklist

☐ Review training hour progress for all staff  
☐ Check for upcoming CSSP annual reviews  
☐ Audit document organization  
☐ Generate compliance summary for leadership  
