import { NextResponse } from "next/server";
import { LlmError } from "@/lib/gemini";
import { refineRequestSchema } from "@/lib/schemas";
import { refineSearch } from "@/lib/search-service";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = refineRequestSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json(
        { error: "Add feedback about the candidates or search criteria before refining.", code: "INVALID_REQUEST" },
        { status: 400 },
      );
    }
    return NextResponse.json(await refineSearch(body.data));
  } catch (error) {
    if (error instanceof LlmError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }
    console.error("Refinement failed", error);
    return NextResponse.json(
      { error: "Something unexpected interrupted refinement. Your current search is unchanged.", code: "REFINE_FAILED" },
      { status: 500 },
    );
  }
}
