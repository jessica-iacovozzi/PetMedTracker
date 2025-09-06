import { NextRequest, NextResponse } from "next/server";

// Only allow in test environment
if (process.env.NODE_ENV === "production") {
  throw new Error("Test endpoints are not available in production");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reminder_id, pet_name, medication_name, dosage, scheduled_time } =
      body;

    // Simulate sending notifications based on user preferences
    // In a real app, this would check the user's notification preferences
    // and send actual notifications

    // Mock sending email notification
    await fetch("http://localhost:3000/api/test/mock/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "email",
        recipient: "test@example.com",
        subject: `Time for ${pet_name}'s ${medication_name}`,
        message: `It's time to give ${pet_name} their ${dosage} of ${medication_name}.`,
        pet_name,
        medication_name,
        scheduled_time,
      }),
    });

    // Mock sending push notification
    await fetch("http://localhost:3000/api/test/mock/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "push",
        recipient: "test-user-123",
        subject: `${pet_name} - ${medication_name}`,
        message: `Time for ${dosage}`,
        pet_name,
        medication_name,
        scheduled_time,
      }),
    });

    return NextResponse.json({
      success: true,
      message: "Reminder notifications triggered successfully",
      reminder_id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to trigger reminder", details: error.message },
      { status: 500 },
    );
  }
}
