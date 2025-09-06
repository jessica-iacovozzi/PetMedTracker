import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";

// Only allow in test environment
if (process.env.NODE_ENV === "production") {
  throw new Error("Test endpoints are not available in production");
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { pet_name, medication_name, dosage, scheduled_time, status } = body;

    // Get test user and pet
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("email", "test@example.com")
      .single();

    if (!user) {
      throw new Error("Test user not found");
    }

    const { data: pet } = await supabase
      .from("pets")
      .select("*")
      .eq("user_id", user.user_id)
      .eq("name", pet_name)
      .single();

    if (!pet) {
      throw new Error("Test pet not found");
    }

    // Create or find medication
    let medication;
    const { data: existingMed } = await supabase
      .from("medications")
      .select("*")
      .eq("pet_id", pet.id)
      .eq("name", medication_name)
      .single();

    if (existingMed) {
      medication = existingMed;
    } else {
      const { data: newMed } = await supabase
        .from("medications")
        .insert({
          user_id: user.user_id,
          pet_id: pet.id,
          name: medication_name,
          dosage: dosage,
          frequency: "daily",
          timing: "09:00",
        })
        .select()
        .single();
      medication = newMed;
    }

    // Create reminder
    const { data: reminder, error } = await supabase
      .from("reminders")
      .insert({
        user_id: user.user_id,
        pet_id: pet.id,
        medication_id: medication.id,
        scheduled_time: scheduled_time,
        status: status || "pending",
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Test reminder created successfully",
      reminder,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create test reminder", details: error.message },
      { status: 500 },
    );
  }
}
