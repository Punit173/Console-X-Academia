// app/api/login/route.ts
import { NextRequest, NextResponse } from "next/server";


// Adjust this to your exact endpoint
const ACADEMIA_API_URL = process.env.ACADEMIA_SCRAPPER_URL || "";
// Endpoint populated from .env.local

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    // Adjust body/URL according to your API contract
    const apiRes = await fetch(ACADEMIA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!apiRes.ok) {
      const text = await apiRes.text();
      return NextResponse.json(
        { error: "Academia API error", details: text },
        { status: apiRes.status }
      );
    }

    const data = await apiRes.json();

    return NextResponse.json(data);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
