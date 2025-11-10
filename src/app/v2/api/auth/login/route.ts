import { NextRequest, NextResponse } from "next/server";
import { validateLogin, createSession } from "@/helper/auth.helper";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { credential, password } = body;

    // Validate input
    if (!credential || !password) {
      return NextResponse.json(
        { success: false, error: "Username/email and password are required" },
        { status: 400 }
      );
    }

    // Validate login credentials
    const user = await validateLogin(credential, password);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create session
    const sessionId = await createSession(user);

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        sessionId
      }
    });

    // Set session cookie
    response.cookies.set('session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: "Login failed" },
      { status: 500 }
    );
  }
}