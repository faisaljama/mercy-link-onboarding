import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  UserCog,
  Home,
  Phone,
  Mail,
  Calendar,
  GraduationCap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Award,
} from "lucide-react";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { TrainingChecklist } from "./training-checklist";
import { EmployeeDocuments } from "./employee-documents";

async function getEmployee(id: string, houseIds: string[]) {
  const employee = await prisma.employee.findFirst({
    where: {
      id,
      assignedHouses: {
        some: {
          houseId: { in: houseIds },
        },
      },
    },
    include: {
      assignedHouses: {
        include: { house: true },
      },
      complianceItems: {
        orderBy: { dueDate: "asc" },
        include: {
          documents: true,
        },
      },
      documents: true,
    },
  });

  return employee;
}

function calculateTrainingHours(items: { status: string; itemType: string }[]) {
  // Estimate training hours based on completed items
  const completedTraining = items.filter(
    (i) => i.status === "COMPLETED" && i.itemType.includes("TRAINING")
  ).length;
  return completedTraining * 4; // Rough estimate of 4 hours per training
}

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { id } = await params;
  const houseIds = await getUserHouseIds(session.id);
  const employee = await getEmployee(id, houseIds);

  if (!employee) {
    notFound();
  }

  const overdueCount = employee.complianceItems.filter((i) => i.status === "OVERDUE").length;
  const pendingCount = employee.complianceItems.filter((i) => i.status === "PENDING").length;
  const completedCount = employee.complianceItems.filter((i) => i.status === "COMPLETED").length;
  const trainingHours = calculateTrainingHours(employee.complianceItems);
  const requiredHours = employee.experienceYears >= 5 ? 12 : 24;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/employees">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Employees
          </Button>
        </Link>
      </div>

      {/* Employee Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
            <UserCog className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {employee.firstName} {employee.lastName}
            </h1>
            <div className="flex items-center gap-2 text-slate-500">
              <Badge variant="outline">{employee.position}</Badge>
              <span className="mx-2">•</span>
              <GraduationCap className="h-4 w-4" />
              {employee.experienceYears} years experience
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/employees/${employee.id}/edit`}>
            <Button variant="outline">Edit Employee</Button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Training Hours</p>
                <p className="text-2xl font-bold">{trainingHours}/{requiredHours}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Days Employed</p>
                <p className="text-2xl font-bold">
                  {differenceInDays(new Date(), employee.hireDate)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Employee Info Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Hire Date</p>
              <p className="font-medium">{format(employee.hireDate, "MMMM d, yyyy")}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Position</p>
              <p className="font-medium">
                {employee.position === "DSP" && "Direct Support Professional"}
                {employee.position === "LEAD_DSP" && "Lead DSP"}
                {employee.position === "DC" && "Designated Coordinator"}
                {employee.position === "DM" && "Designated Manager"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Annual Training Requirement</p>
              <p className="font-medium">
                {requiredHours} hours
                <span className="text-slate-500 text-sm ml-1">
                  ({employee.experienceYears >= 5 ? "5+ years" : "<5 years"})
                </span>
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Contact</p>
              <div className="space-y-2">
                {employee.email && (
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    {employee.email}
                  </p>
                )}
                {employee.phone && (
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {employee.phone}
                  </p>
                )}
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Assigned Houses</p>
              <div className="space-y-2">
                {employee.assignedHouses.map((ah) => (
                  <div key={ah.id} className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">{ah.house.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Training Checklist */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Training & Documents</CardTitle>
            <CardDescription>
              Track required training and certifications per Minnesota Statutes Chapter 245D
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="training">
              <TabsList>
                <TabsTrigger value="training">Training</TabsTrigger>
                <TabsTrigger value="documents">
                  Documents ({employee.documents.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="training" className="mt-4">
                <Tabs defaultValue="all">
                  <TabsList>
                    <TabsTrigger value="all">All Items</TabsTrigger>
                    <TabsTrigger value="overdue" className="text-red-600">
                      Overdue ({overdueCount})
                    </TabsTrigger>
                    <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
                    <TabsTrigger value="completed">Completed ({completedCount})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="mt-4">
                    <TrainingChecklist
                      items={employee.complianceItems}
                      employeeId={employee.id}
                    />
                  </TabsContent>

                  <TabsContent value="overdue" className="mt-4">
                    <TrainingChecklist
                      items={employee.complianceItems.filter((i) => i.status === "OVERDUE")}
                      employeeId={employee.id}
                    />
                  </TabsContent>

                  <TabsContent value="pending" className="mt-4">
                    <TrainingChecklist
                      items={employee.complianceItems.filter((i) => i.status === "PENDING")}
                      employeeId={employee.id}
                    />
                  </TabsContent>

                  <TabsContent value="completed" className="mt-4">
                    <TrainingChecklist
                      items={employee.complianceItems.filter((i) => i.status === "COMPLETED")}
                      employeeId={employee.id}
                    />
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="documents" className="mt-4">
                <EmployeeDocuments
                  employeeId={employee.id}
                  complianceItems={employee.complianceItems.map((i) => ({
                    id: i.id,
                    itemName: i.itemName,
                    itemType: i.itemType,
                  }))}
                  canDelete={session.role !== "LEAD_STAFF"}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
