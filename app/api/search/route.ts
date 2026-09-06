import { NextResponse } from "next/server";
import { LlmError } from "@/lib/gemini";
import { searchRequestSchema } from "@/lib/schemas";
import { executeSearch } from "@/lib/search-service";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = searchRequestSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json(
        { error: "Enter a specific role requirement and check the edited filters.", code: "INVALID_REQUEST" },
        { status: 400 },
      );
    }
    return NextResponse.json(await executeSearch(body.data.query, body.data.definition));
  } catch (error) {
    if (error instanceof LlmError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }
    console.error("Search failed", error);
    return NextResponse.json(
      { error: "Something unexpected interrupted the search. Please try again.", code: "SEARCH_FAILED" },
      { status: 500 },
    );
  }
}
