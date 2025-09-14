import { NextRequest, NextResponse } from "next/server";

// In-memory store for test notifications
interface NotificationLog {
  id: string;
  type: string;
  recipient: string;
  subject: string;
  message: string;
  pet_name: string;
  medication_name: string;
  scheduled_time: string;
  sent_at: string;
  status: string;
}

let notificationLogs: NotificationLog[] = [];

export async function POST(request: NextRequest) {
  // Only allow in test environment
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Test endpoints are not available in production" },
      { status: 403 }
    );
  }
  try {
    const body = await request.json();
    const {
      type,
      recipient,
      subject,
      message,
      pet_name,
      medication_name,
      scheduled_time,
    } = body;

    // Log the notification instead of sending it
    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type, // 'email' or 'push'
      recipient,
      subject,
      message,
      pet_name,
      medication_name,
      scheduled_time,
      sent_at: new Date().toISOString(),
      status: "logged", // Instead of "sent"
    };

    notificationLogs.push(notification);

    return NextResponse.json({
      success: true,
      message: "Notification logged successfully",
      notification_id: notification.id,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Failed to log notification", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  // Only allow in test environment
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Test endpoints are not available in production" },
      { status: 403 }
    );
  }
  
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "clear") {
    notificationLogs = [];
    return NextResponse.json({
      success: true,
      message: "Notification logs cleared",
    });
  }

  if (action === "count") {
    return NextResponse.json({
      success: true,
      count: notificationLogs.length,
    });
  }

  // Return all logged notifications
  return NextResponse.json({
    success: true,
    notifications: notificationLogs,
    count: notificationLogs.length,
  });
}

export async function DELETE() {
  // Only allow in test environment
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Test endpoints are not available in production" },
      { status: 403 }
    );
  }
  
  notificationLogs = [];
  return NextResponse.json({
    success: true,
    message: "All notification logs cleared",
  });
}
