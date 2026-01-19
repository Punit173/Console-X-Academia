import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { netid, password } = body;

        if (!netid || !password) {
            return NextResponse.json(
                { error: 'NetID and Password are required' },
                { status: 400 }
            );
        }

        // Use the deployed scraper URL from env
        const constScraperUrl = process.env.SCRAPER_API_URL;

        if (!constScraperUrl) {
            console.error("SCRAPER_API_URL not defined in env");
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        console.log(`Proxying scrape request for ${netid} to ${constScraperUrl}`);

        const response = await fetch(constScraperUrl, {
            method: "POST",
            headers: {
                "accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                netid,
                password
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Scraper Error:", response.status, errorText);
            return NextResponse.json(
                { error: `Scraper failed with status: ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Proxy Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
