import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import {
  baseStyles,
  colors,
  PDFHeader,
  PDFFooter,
  Section,
  Field,
  TwoColumn,
} from "../pdf-service";

interface ComplianceItem {
  id: string;
  itemType: string;
  itemName: string;
  dueDate: Date | string;
  status: string;
}

interface ClientSummary {
  id: string;
  firstName: string;
  lastName: string;
  waiverType: string | null;
  status: string;
  complianceItems: ComplianceItem[];
  _count: {
    complianceItems: number; // overdue count
  };
}

interface EmployeeSummary {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  complianceItems: ComplianceItem[];
  _count: {
    complianceItems: number; // overdue count
  };
}

interface AssignedUser {
  user: {
    name: string;
    role: string;
  };
}

interface HouseComplianceData {
  id: string;
  name: string;
  address: string;
  county: string;
  capacity: number;
  licenseNumber: string | null;
  clients: ClientSummary[];
  employees: { employee: EmployeeSummary }[];
  assignedUsers: AssignedUser[];
}

interface HouseCompliancePDFProps {
  house: HouseComplianceData;
}

const styles = StyleSheet.create({
  summaryBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  statBox: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primary,
  },
  statLabel: {
    fontSize: 9,
    color: colors.secondary,
    marginTop: 2,
  },
  statNumberGood: {
    color: colors.success,
  },
  statNumberWarning: {
    color: colors.warning,
  },
  statNumberBad: {
    color: colors.error,
  },
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 4,
    minHeight: 28,
  },
  tableRowAlt: {
    backgroundColor: "#f8fafc",
  },
  tableRowOverdue: {
    backgroundColor: "#fef2f2",
  },
  colName: {
    width: "30%",
    paddingRight: 4,
  },
  colType: {
    width: "15%",
    paddingRight: 4,
  },
  colStatus: {
    width: "15%",
    paddingRight: 4,
  },
  colOverdue: {
    width: "15%",
    paddingRight: 4,
  },
  colNextDeadline: {
    width: "25%",
    paddingRight: 4,
  },
  headerText: {
    fontSize: 8,
    fontWeight: "bold",
    color: colors.text,
  },
  cellText: {
    fontSize: 8,
    color: colors.text,
  },
  cellTextSmall: {
    fontSize: 7,
    color: colors.secondary,
  },
  statusBadge: {
    fontSize: 7,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    textAlign: "center",
  },
  statusOnTrack: {
    backgroundColor: "#dcfce7",
    color: colors.success,
  },
  statusOverdue: {
    backgroundColor: "#fee2e2",
    color: colors.error,
  },
  houseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  houseName: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  houseAddress: {
    fontSize: 10,
    color: colors.secondary,
    marginTop: 2,
  },
  countyBadge: {
    fontSize: 10,
    color: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  alertBox: {
    marginTop: 16,
    padding: 10,
    backgroundColor: "#fef2f2",
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  alertTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.error,
    marginBottom: 4,
  },
  alertText: {
    fontSize: 8,
    color: "#991b1b",
  },
  staffList: {
    marginTop: 8,
  },
  staffItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  staffName: {
    fontSize: 9,
    color: colors.text,
  },
  staffRole: {
    fontSize: 8,
    color: colors.secondary,
  },
  occupancyBar: {
    marginTop: 8,
    height: 8,
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  occupancyFill: {
    height: "100%",
    borderRadius: 4,
  },
  occupancyLabel: {
    fontSize: 8,
    color: colors.secondary,
    marginTop: 4,
    textAlign: "center",
  },
});

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MM/dd/yyyy");
}

function getPositionLabel(position: string): string {
  switch (position) {
    case "DSP":
      return "DSP";
    case "LEAD_DSP":
      return "Lead DSP";
    case "DC":
      return "DC";
    case "DM":
      return "DM";
    default:
      return position;
  }
}

function getRoleLabel(role: string): string {
  return role.replace("_", " ");
}

export function HouseCompliancePDF({ house }: HouseCompliancePDFProps) {
  // Calculate statistics
  const totalClients = house.clients.length;
  const totalEmployees = house.employees.length;

  const clientOverdue = house.clients.reduce((a, c) => a + c._count.complianceItems, 0);
  const employeeOverdue = house.employees.reduce((a, e) => a + e.employee._count.complianceItems, 0);
  const totalOverdue = clientOverdue + employeeOverdue;

  const clientsOnTrack = house.clients.filter((c) => c._count.complianceItems === 0).length;
  const employeesOnTrack = house.employees.filter((e) => e.employee._count.complianceItems === 0).length;

  const occupancyRate = house.capacity > 0 ? Math.round((totalClients / house.capacity) * 100) : 0;
  const clientComplianceRate = totalClients > 0 ? Math.round((clientsOnTrack / totalClients) * 100) : 100;
  const employeeComplianceRate = totalEmployees > 0 ? Math.round((employeesOnTrack / totalEmployees) * 100) : 100;

  // Find items that are overdue or due soon
  const urgentItems: { name: string; type: "client" | "employee"; item: string; dueDate: string }[] = [];

  house.clients.forEach((client) => {
    client.complianceItems.forEach((item) => {
      if (item.status === "OVERDUE") {
        urgentItems.push({
          name: `${client.firstName} ${client.lastName}`,
          type: "client",
          item: item.itemName,
          dueDate: formatDate(item.dueDate),
        });
      }
    });
  });

  house.employees.forEach((eh) => {
    eh.employee.complianceItems.forEach((item) => {
      if (item.status === "OVERDUE") {
        urgentItems.push({
          name: `${eh.employee.firstName} ${eh.employee.lastName}`,
          type: "employee",
          item: item.itemName,
          dueDate: formatDate(item.dueDate),
        });
      }
    });
  });

  return (
    <Document>
      <Page size="LETTER" style={baseStyles.page}>
        <PDFHeader title="House Compliance Overview" subtitle={house.name} />

        {/* House Header */}
        <View style={styles.houseHeader}>
          <View>
            <Text style={styles.houseName}>{house.name}</Text>
            <Text style={styles.houseAddress}>{house.address}</Text>
          </View>
          <Text style={styles.countyBadge}>{house.county} County</Text>
        </View>

        {/* House Info */}
        <Section title="House Information">
          <TwoColumn
            left={
              <>
                <Field label="Address" value={house.address} />
                <Field label="County" value={house.county} />
                <Field label="Capacity" value={`${house.capacity} residents`} />
              </>
            }
            right={
              <>
                <Field label="License Number" value={house.licenseNumber || "—"} />
                <Field label="Current Occupancy" value={`${totalClients} / ${house.capacity}`} />
                <Field label="Occupancy Rate" value={`${occupancyRate}%`} />
              </>
            }
          />
        </Section>

        {/* Summary Statistics */}
        <Section title="Compliance Summary">
          <View style={styles.summaryBox}>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber]}>{totalClients}</Text>
              <Text style={styles.statLabel}>Clients</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber]}>{totalEmployees}</Text>
              <Text style={styles.statLabel}>Staff</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, totalOverdue > 0 ? styles.statNumberBad : styles.statNumberGood]}>
                {totalOverdue}
              </Text>
              <Text style={styles.statLabel}>Overdue Items</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, clientComplianceRate >= 80 ? styles.statNumberGood : clientComplianceRate >= 50 ? styles.statNumberWarning : styles.statNumberBad]}>
                {clientComplianceRate}%
              </Text>
              <Text style={styles.statLabel}>Client Compliance</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, employeeComplianceRate >= 80 ? styles.statNumberGood : employeeComplianceRate >= 50 ? styles.statNumberWarning : styles.statNumberBad]}>
                {employeeComplianceRate}%
              </Text>
              <Text style={styles.statLabel}>Staff Compliance</Text>
            </View>
          </View>
        </Section>

        {/* Urgent Items Alert */}
        {urgentItems.length > 0 && (
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Overdue Compliance Items ({urgentItems.length})</Text>
            {urgentItems.slice(0, 5).map((item, index) => (
              <Text key={index} style={styles.alertText}>
                • {item.name} ({item.type}): {item.item} - Due {item.dueDate}
              </Text>
            ))}
            {urgentItems.length > 5 && (
              <Text style={[styles.alertText, { fontStyle: "italic", marginTop: 4 }]}>
                ... and {urgentItems.length - 5} more items
              </Text>
            )}
          </View>
        )}

        {/* Clients Table */}
        <Section title={`Clients (${totalClients})`}>
          {totalClients === 0 ? (
            <Text style={styles.cellText}>No clients assigned to this house</Text>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <View style={styles.colName}>
                  <Text style={styles.headerText}>Name</Text>
                </View>
                <View style={styles.colType}>
                  <Text style={styles.headerText}>Waiver</Text>
                </View>
                <View style={styles.colStatus}>
                  <Text style={styles.headerText}>Status</Text>
                </View>
                <View style={styles.colOverdue}>
                  <Text style={styles.headerText}>Overdue</Text>
                </View>
                <View style={styles.colNextDeadline}>
                  <Text style={styles.headerText}>Next Deadline</Text>
                </View>
              </View>

              {house.clients.map((client, index) => {
                const hasOverdue = client._count.complianceItems > 0;
                const nextItem = client.complianceItems[0];
                const rowStyle = hasOverdue
                  ? [styles.tableRow, styles.tableRowOverdue]
                  : index % 2 === 1
                  ? [styles.tableRow, styles.tableRowAlt]
                  : styles.tableRow;
                return (
                  <View
                    key={client.id}
                    style={rowStyle}
                  >
                    <View style={styles.colName}>
                      <Text style={styles.cellText}>
                        {client.lastName}, {client.firstName}
                      </Text>
                    </View>
                    <View style={styles.colType}>
                      <Text style={styles.cellTextSmall}>{client.waiverType || "—"}</Text>
                    </View>
                    <View style={styles.colStatus}>
                      <Text style={[styles.statusBadge, hasOverdue ? styles.statusOverdue : styles.statusOnTrack]}>
                        {hasOverdue ? "Overdue" : "On Track"}
                      </Text>
                    </View>
                    <View style={styles.colOverdue}>
                      <Text style={hasOverdue ? [styles.cellText, { color: colors.error, fontWeight: "bold" }] : styles.cellText}>
                        {client._count.complianceItems}
                      </Text>
                    </View>
                    <View style={styles.colNextDeadline}>
                      <Text style={styles.cellTextSmall}>
                        {nextItem ? `${nextItem.itemName} (${formatDate(nextItem.dueDate)})` : "—"}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </Section>

        {/* Employees Table */}
        <Section title={`Staff (${totalEmployees})`}>
          {totalEmployees === 0 ? (
            <Text style={styles.cellText}>No staff assigned to this house</Text>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <View style={styles.colName}>
                  <Text style={styles.headerText}>Name</Text>
                </View>
                <View style={styles.colType}>
                  <Text style={styles.headerText}>Position</Text>
                </View>
                <View style={styles.colStatus}>
                  <Text style={styles.headerText}>Status</Text>
                </View>
                <View style={styles.colOverdue}>
                  <Text style={styles.headerText}>Overdue</Text>
                </View>
                <View style={styles.colNextDeadline}>
                  <Text style={styles.headerText}>Next Deadline</Text>
                </View>
              </View>

              {house.employees.map((eh, index) => {
                const employee = eh.employee;
                const hasOverdue = employee._count.complianceItems > 0;
                const nextItem = employee.complianceItems[0];
                const rowStyle = hasOverdue
                  ? [styles.tableRow, styles.tableRowOverdue]
                  : index % 2 === 1
                  ? [styles.tableRow, styles.tableRowAlt]
                  : styles.tableRow;
                return (
                  <View
                    key={employee.id}
                    style={rowStyle}
                  >
                    <View style={styles.colName}>
                      <Text style={styles.cellText}>
                        {employee.lastName}, {employee.firstName}
                      </Text>
                    </View>
                    <View style={styles.colType}>
                      <Text style={styles.cellTextSmall}>{getPositionLabel(employee.position)}</Text>
                    </View>
                    <View style={styles.colStatus}>
                      <Text style={[styles.statusBadge, hasOverdue ? styles.statusOverdue : styles.statusOnTrack]}>
                        {hasOverdue ? "Overdue" : "On Track"}
                      </Text>
                    </View>
                    <View style={styles.colOverdue}>
                      <Text style={hasOverdue ? [styles.cellText, { color: colors.error, fontWeight: "bold" }] : styles.cellText}>
                        {employee._count.complianceItems}
                      </Text>
                    </View>
                    <View style={styles.colNextDeadline}>
                      <Text style={styles.cellTextSmall}>
                        {nextItem ? `${nextItem.itemName} (${formatDate(nextItem.dueDate)})` : "—"}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </Section>

        {/* Assigned System Users */}
        {house.assignedUsers.length > 0 && (
          <Section title="Assigned System Users">
            <View style={styles.staffList}>
              {house.assignedUsers.map((au, index) => (
                <View key={index} style={styles.staffItem}>
                  <Text style={styles.staffName}>{au.user.name}</Text>
                  <Text style={styles.staffRole}>{getRoleLabel(au.user.role)}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        <PDFFooter />
      </Page>
    </Document>
  );
}

export function getHouseComplianceFilename(house: { name: string }): string {
  const date = format(new Date(), "yyyy-MM-dd");
  const name = house.name.replace(/[^a-zA-Z0-9]/g, "_");
  return `HouseCompliance_${name}_${date}.pdf`;
}
