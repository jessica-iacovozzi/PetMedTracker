import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";

// Only allow in test environment
if (process.env.NODE_ENV === "production") {
  throw new Error("Test endpoints are not available in production");
}

// Additional safety check for CI environment
if (process.env.CI && !process.env.NODE_ENV?.includes("test")) {
  console.warn("⚠️ Test endpoint accessed in CI without test environment");
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Clear all test data
    await supabase
      .from("reminder_logs")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("reminders")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("history")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("medications")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("pets")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("notification_preferences")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("subscriptions")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("users")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    // Seed test data
    const testUserId = "test-user-123";
    const testUser2Id = "test-user-456";

    // Create test users
    const { data: user1 } = await supabase
      .from("users")
      .insert({
        id: testUserId,
        user_id: testUserId,
        email: "test@example.com",
        name: "Test User",
        full_name: "Test User",
        token_identifier: "test@example.com",
      })
      .select()
      .single();

    const { data: user2 } = await supabase
      .from("users")
      .insert({
        id: testUser2Id,
        user_id: testUser2Id,
        email: "premium@example.com",
        name: "Premium User",
        full_name: "Premium User",
        token_identifier: "premium@example.com",
      })
      .select()
      .single();

    // Create premium subscription for user2
    await supabase.from("subscriptions").insert({
      user_id: testUser2Id,
      stripe_id: "sub_test_premium",
      status: "active",
      amount: 500, // $5.00
      interval: "month",
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
    });

    // Create test pets
    const { data: pet1 } = await supabase
      .from("pets")
      .insert({
        user_id: testUserId,
        name: "Buddy",
        species: "dog",
        photo:
          "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&q=80",
      })
      .select()
      .single();

    const { data: pet2 } = await supabase
      .from("pets")
      .insert({
        user_id: testUser2Id,
        name: "Whiskers",
        species: "cat",
        photo:
          "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80",
      })
      .select()
      .single();

    // Create test medications
    const { data: med1 } = await supabase
      .from("medications")
      .insert({
        user_id: testUserId,
        pet_id: pet1.id,
        name: "Heartgard Plus",
        dosage: "1 tablet",
        frequency: "daily",
        timing: "09:00",
        duration: "ongoing",
      })
      .select()
      .single();

    const { data: med2 } = await supabase
      .from("medications")
      .insert({
        user_id: testUserId,
        pet_id: pet1.id,
        name: "Apoquel",
        dosage: "16mg",
        frequency: "twice-daily",
        timing: "18:00",
        duration: "2 weeks",
      })
      .select()
      .single();

    // Create test reminders for today
    const today = new Date();
    const morningTime = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      9,
      0,
      0,
    );
    const eveningTime = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      18,
      0,
      0,
    );

    await supabase.from("reminders").insert([
      {
        user_id: testUserId,
        pet_id: pet1.id,
        medication_id: med1.id,
        scheduled_time: morningTime.toISOString(),
        status: "pending",
      },
      {
        user_id: testUserId,
        pet_id: pet1.id,
        medication_id: med2.id,
        scheduled_time: eveningTime.toISOString(),
        status: "pending",
      },
    ]);

    // Create notification preferences
    await supabase.from("notification_preferences").insert([
      {
        user_id: testUserId,
        email_enabled: true,
        push_enabled: true,
      },
      {
        user_id: testUser2Id,
        email_enabled: false,
        push_enabled: true,
      },
    ]);

    return NextResponse.json({
      success: true,
      message: "Test database reset and seeded successfully",
      testUsers: {
        freeUser: { id: testUserId, email: "test@example.com" },
        premiumUser: { id: testUser2Id, email: "premium@example.com" },
      },
    });
  } catch (error: any) {
    console.error("Database reset error:", error);
    return NextResponse.json(
      { error: "Failed to reset test database", details: error.message },
      { status: 500 },
    );
  }
}
