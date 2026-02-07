import { NextRequest, NextResponse } from "next/server";

// Define the target backend URL
const TARGET_URL = process.env.SOCIAL_API_URL || "https://microservice-console.onrender.com";

async function handleProxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    const pathStr = path.join("/");
    const queryString = request.nextUrl.search;
    const targetUrl = `${TARGET_URL}/${pathStr}${queryString}`;

    console.log(`[Proxy] Forwarding ${request.method} request to: ${targetUrl}`);

    try {
        // Clone headers to modify them
        const headers = new Headers(request.headers);
        headers.delete("host"); // Avoid host header mismatch issues
        headers.delete("content-length"); // Let fetch calculate this

        const body = request.body; // Stream

        const response = await fetch(targetUrl, {
            method: request.method,
            headers: headers,
            body: body,
            // @ts-ignore: Required for streaming bodies in some Next.js versions
            duplex: "half",
        });

        console.log(`[Proxy] Response status: ${response.status}`);

        const responseBody = await response.blob();

        return new NextResponse(responseBody, {
            status: response.status,
            headers: response.headers
        });

    } catch (error) {
        console.error("[Proxy] Error:", error);
        return NextResponse.json({ error: "Internal Proxy Error" }, { status: 500 });
    }
}

export async function GET(request: NextRequest, context: any) {
    return handleProxy(request, context);
}

export async function POST(request: NextRequest, context: any) {
    return handleProxy(request, context);
}

export async function PUT(request: NextRequest, context: any) {
    return handleProxy(request, context);
}

export async function DELETE(request: NextRequest, context: any) {
    return handleProxy(request, context);
}

export async function PATCH(request: NextRequest, context: any) {
    return handleProxy(request, context);
}
