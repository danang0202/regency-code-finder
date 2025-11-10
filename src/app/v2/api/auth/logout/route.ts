import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/helper/auth.helper";

export async function POST(req: NextRequest) {
  try {
    // Get session from cookie
    const sessionId = req.cookies.get('session')?.value;
    
    if (sessionId) {
      // Delete session from database
      await deleteSession(sessionId);
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully"
    });

    // Remove session cookie
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: "Logout failed" },
      { status: 500 }
    );
  }
}