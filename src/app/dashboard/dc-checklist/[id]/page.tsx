import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { notFound } from "next/navigation";
import { ChecklistForm } from "./checklist-form";

async function getChecklist(id: string, houseIds: string[]) {
  const checklist = await prisma.dCDailyChecklist.findFirst({
    where: {
      id,
      houseId: { in: houseIds },
    },
    include: {
      house: true,
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return checklist;
}

export default async function ChecklistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { id } = await params;
  const houseIds = await getUserHouseIds(session.id);
  const checklist = await getChecklist(id, houseIds);

  if (!checklist) {
    notFound();
  }

  return <ChecklistForm checklist={checklist} />;
}
