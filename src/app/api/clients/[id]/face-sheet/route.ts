import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and DCs can update face sheets
    if (session.role === "LEAD_STAFF") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const houseIds = await getUserHouseIds(session.id);

    // Check if client exists and user has access
    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        houseId: { in: houseIds },
      },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const data = await request.json();
    const {
      // Personal Info
      middleName,
      ssn,
      gender,
      ethnicity,
      preferredLanguage,
      maritalStatus,
      // Guardian
      hasGuardian,
      guardianName,
      guardianPhone,
      guardianAddress,
      guardianRelationship,
      // Rep Payee
      hasRepPayee,
      repPayeeName,
      repPayeePhone,
      repPayeeAddress,
      // Financial
      rentAmount,
      checkDeliveryLocation,
      // Insurance
      pmiNumber,
      insuranceName,
      insurancePolicyNumber,
      insuranceGroupNumber,
      insurancePhone,
      // Emergency Contacts
      emergencyContact1Name,
      emergencyContact1Phone,
      emergencyContact1Relationship,
      emergencyContact2Name,
      emergencyContact2Phone,
      emergencyContact2Relationship,
      // Medical Providers
      pharmacyName,
      pharmacyPhone,
      pharmacyAddress,
      primaryCareName,
      primaryCarePhone,
      primaryCareAddress,
      psychiatristName,
      psychiatristPhone,
      psychiatristAddress,
      dentalName,
      dentalPhone,
      dentalAddress,
      visionName,
      visionPhone,
      visionAddress,
      // Medical Info
      allergies,
      dietaryRestrictions,
      diagnoses,
      medications,
    } = data;

    // Update client face sheet fields
    const client = await prisma.client.update({
      where: { id },
      data: {
        middleName: middleName || null,
        ssn: ssn || null,
        gender: gender || null,
        ethnicity: ethnicity || null,
        preferredLanguage: preferredLanguage || null,
        maritalStatus: maritalStatus || null,
        // Guardian
        hasGuardian: hasGuardian || false,
        guardianName: guardianName || null,
        guardianPhone: guardianPhone || null,
        guardianAddress: guardianAddress || null,
        guardianRelationship: guardianRelationship || null,
        // Rep Payee
        hasRepPayee: hasRepPayee || false,
        repPayeeName: repPayeeName || null,
        repPayeePhone: repPayeePhone || null,
        repPayeeAddress: repPayeeAddress || null,
        // Financial
        rentAmount: rentAmount ? parseFloat(rentAmount) : null,
        checkDeliveryLocation: checkDeliveryLocation || null,
        // Insurance
        pmiNumber: pmiNumber || null,
        insuranceName: insuranceName || null,
        insurancePolicyNumber: insurancePolicyNumber || null,
        insuranceGroupNumber: insuranceGroupNumber || null,
        insurancePhone: insurancePhone || null,
        emergencyContact1Name: emergencyContact1Name || null,
        emergencyContact1Phone: emergencyContact1Phone || null,
        emergencyContact1Relationship: emergencyContact1Relationship || null,
        emergencyContact2Name: emergencyContact2Name || null,
        emergencyContact2Phone: emergencyContact2Phone || null,
        emergencyContact2Relationship: emergencyContact2Relationship || null,
        pharmacyName: pharmacyName || null,
        pharmacyPhone: pharmacyPhone || null,
        pharmacyAddress: pharmacyAddress || null,
        primaryCareName: primaryCareName || null,
        primaryCarePhone: primaryCarePhone || null,
        primaryCareAddress: primaryCareAddress || null,
        psychiatristName: psychiatristName || null,
        psychiatristPhone: psychiatristPhone || null,
        psychiatristAddress: psychiatristAddress || null,
        dentalName: dentalName || null,
        dentalPhone: dentalPhone || null,
        dentalAddress: dentalAddress || null,
        visionName: visionName || null,
        visionPhone: visionPhone || null,
        visionAddress: visionAddress || null,
        allergies: allergies || null,
        dietaryRestrictions: dietaryRestrictions || null,
        diagnoses: diagnoses || null,
        medications: medications || null,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "UPDATE",
        entityType: "CLIENT",
        entityId: client.id,
        details: JSON.stringify({
          type: "FACE_SHEET_UPDATE",
          fields: Object.keys(data),
        }),
      },
    });

    return NextResponse.json({ client });
  } catch (error) {
    console.error("Error updating face sheet:", error);
    return NextResponse.json(
      { error: "Failed to update face sheet" },
      { status: 500 }
    );
  }
}
