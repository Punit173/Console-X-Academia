// app/api/login/route.ts
import { NextRequest, NextResponse } from "next/server";


// Adjust this to your exact endpoint
// Adjust this to your exact endpoint
const ACADEMIA_SCRAPPER_URL = process.env.ACADEMIA_SCRAPPER_URL || "";

async function fetchFromApi(url: string, payload: any) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    const payload = { email, password };
    let apiRes: Response | null = null;
    let usedSource = "LOCAL";

    // 1. Try Configured API
    if (ACADEMIA_SCRAPPER_URL) {
      console.log(`Attempting API: ${ACADEMIA_SCRAPPER_URL} for ${email}`);
      apiRes = await fetchFromApi(ACADEMIA_SCRAPPER_URL, payload);
    } else {
      // Fallback or Error if no env var is set
      throw new Error("ACADEMIA_SCRAPPER_URL not configured.");
    }

    if (!apiRes) {
      return NextResponse.json({ error: "Failed to connect to any scraper service" }, { status: 503 });
    }

    if (!apiRes.ok) {
      const text = await apiRes.text();
      console.error(`Upstream API (${usedSource}) failed with status ${apiRes.status}. Body: ${text}`);
      let errorMessage = text;
      try {
        const jsonError = JSON.parse(text);
        if (jsonError.detail) {
          errorMessage = jsonError.detail;
        } else if (jsonError.error) {
          errorMessage = jsonError.error;
        }
      } catch {
        // use raw text if not json
      }

      console.error(`API Error (${usedSource}):`, errorMessage);

      // Map specific errors to user-friendly messages if needed
      if (errorMessage === "User lookup failed") {
        errorMessage = "Invalid email or password";
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: apiRes.status }
      );
    }

    const data = await apiRes.json();
    return NextResponse.json(data);

  } catch (err: any) {
    console.error("Login Route Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
