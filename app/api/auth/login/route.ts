import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // In a real application, you would verify the password hash here
    // For example: const isPasswordValid = await bcrypt.compare(password, user.password);

    // For now, we'll do a simple comparison (NOT SECURE for production)
    const isPasswordValid = password === user.password;

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // In a real application, you would create a session or JWT token here
    // For example: const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    return NextResponse.json({
      user: userWithoutPassword,
      // token: token, // You would include this in a real application
    });
  } catch (error) {
    console.error("Error logging in:", error);
    return NextResponse.json({ error: "Failed to log in" }, { status: 500 });
  }
}
