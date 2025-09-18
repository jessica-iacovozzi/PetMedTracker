import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../../supabase/server";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const reminderId = params.id;

    // Get reminder details first
    const { data: reminder, error: fetchError } = await supabase
      .from("reminders")
      .select(
        `
        *,
        pets!inner(name),
        medications!inner(name, dosage)
      `,
      )
      .eq("id", reminderId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !reminder) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 },
      );
    }

    // Update reminder status
    const { error: updateError } = await supabase
      .from("reminders")
      .update({ status: "given" })
      .eq("id", reminderId)
      .eq("user_id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Add to history log
    const { error: historyError } = await supabase.from("history").insert({
      user_id: user.id,
      pet_id: reminder.pet_id,
      medication_id: reminder.medication_id,
      dosage: reminder.medications.dosage,
      scheduled_time: reminder.scheduled_time,
      status: "given",
    });

    if (historyError) {
      return NextResponse.json(
        { error: historyError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
