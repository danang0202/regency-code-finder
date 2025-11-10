import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/helper/auth.helper";

export async function GET(req: NextRequest) {
  try {
    // Get session from cookie
    const sessionId = req.cookies.get('session')?.value;
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "No session found" },
        { status: 401 }
      );
    }

    // Get session data
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Invalid session" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: session.id,
          username: session.username,
          email: session.email
        }
      }
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { success: false, error: "Session check failed" },
      { status: 500 }
    );
  }
}