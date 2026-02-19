import { debugDatabase } from "@/lib/debug-db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const result = await debugDatabase();
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
