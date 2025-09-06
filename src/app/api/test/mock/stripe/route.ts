import { NextRequest, NextResponse } from "next/server";

// Only allow in test environment
if (process.env.NODE_ENV === "production") {
  throw new Error("Test endpoints are not available in production");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, user_id } = body;

    switch (action) {
      case "create_checkout_session":
        // Mock Stripe checkout session creation
        return NextResponse.json({
          success: true,
          url: `http://localhost:3000/test/stripe-success?session_id=cs_test_${user_id}&user_id=${user_id}`,
          session_id: `cs_test_${user_id}`,
        });

      case "create_customer_portal":
        // Mock Stripe customer portal
        return NextResponse.json({
          success: true,
          url: `http://localhost:3000/test/stripe-portal?user_id=${user_id}`,
        });

      case "webhook_checkout_completed":
        // Mock successful checkout webhook
        return NextResponse.json({
          success: true,
          event: {
            type: "checkout.session.completed",
            data: {
              object: {
                id: `cs_test_${user_id}`,
                customer: `cus_test_${user_id}`,
                subscription: `sub_test_${user_id}`,
                metadata: {
                  user_id: user_id,
                },
              },
            },
          },
        });

      case "webhook_subscription_deleted":
        // Mock subscription cancellation webhook
        return NextResponse.json({
          success: true,
          event: {
            type: "customer.subscription.deleted",
            data: {
              object: {
                id: `sub_test_${user_id}`,
                customer: `cus_test_${user_id}`,
                status: "canceled",
                metadata: {
                  user_id: user_id,
                },
              },
            },
          },
        });

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: "Mock Stripe API error", details: error.message },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const session_id = searchParams.get("session_id");
  const user_id = searchParams.get("user_id");

  if (session_id?.includes("success")) {
    return NextResponse.json({
      success: true,
      session: {
        id: session_id,
        payment_status: "paid",
        customer: `cus_test_${user_id}`,
        subscription: `sub_test_${user_id}`,
      },
    });
  }

  if (session_id?.includes("cancel")) {
    return NextResponse.json({
      success: false,
      session: {
        id: session_id,
        payment_status: "unpaid",
      },
    });
  }

  return NextResponse.json({ error: "Session not found" }, { status: 404 });
}
