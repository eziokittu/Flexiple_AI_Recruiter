import type { ZodType } from "zod";

const DEFAULT_MODEL = "gemini-3.1-flash-lite";
const REQUEST_TIMEOUT_MS = 24_000;
const NETWORK_RETRY_DELAY_MS = 400;

type GeminiResponse = {
  candidates?: Array<{
    finishReason?: string;
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { code?: number; message?: string; status?: string };
};

export class LlmError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 502,
    public readonly code = "LLM_ERROR",
  ) {
    super(message);
  }
}

function friendlyApiError(status: number, payload: GeminiResponse): LlmError {
  if (status === 429) {
    return new LlmError(
      "The free model is at its rate limit. Wait a moment and try again; your search has not been lost.",
      429,
      "RATE_LIMITED",
    );
  }
  if (status === 401 || status === 403) {
    return new LlmError("The Gemini API key is invalid or does not have access to this model.", 502, "INVALID_API_KEY");
  }
  return new LlmError(payload.error?.message || "The model could not complete this request.");
}

function errorCauseCode(error: unknown): string | undefined {
  if (!(error instanceof Error)) return undefined;
  const cause = error.cause;
  if (cause && typeof cause === "object" && "code" in cause && typeof cause.code === "string") {
    return cause.code;
  }
  return undefined;
}

async function fetchGemini(endpoint: string, apiKey: string, body: string): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        cache: "no-store",
      });
    } catch (error) {
      if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
        throw new LlmError("The model took too long to respond. Try the search again.", 504, "TIMEOUT");
      }
      lastError = error;
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, NETWORK_RETRY_DELAY_MS));
      }
    }
  }

  const causeCode = errorCauseCode(lastError);
  console.error("Gemini transport failure", {
    name: lastError instanceof Error ? lastError.name : "UnknownError",
    message: lastError instanceof Error ? lastError.message : "Unknown transport failure",
    causeCode,
  });
  const diagnostic = causeCode ? ` (${causeCode})` : "";
  throw new LlmError(
    `The server could not connect to Gemini${diagnostic}. This is usually temporary; retry the search.`,
    502,
    "CONNECTION_FAILED",
  );
}

async function requestJson(
  systemPrompt: string,
  prompt: string,
  jsonSchema: object,
  temperature: number,
): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new LlmError(
      "GEMINI_API_KEY is missing. Add it to .env.local, then restart the development server.",
      503,
      "MISSING_API_KEY",
    );
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      responseMimeType: "application/json",
      responseJsonSchema: jsonSchema,
    },
  });
  const response = await fetchGemini(endpoint, apiKey, body);

  const payload = (await response.json().catch(() => ({}))) as GeminiResponse;
  if (!response.ok) throw friendlyApiError(response.status, payload);

  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  if (!text) {
    throw new LlmError("The model returned no usable content. Try again with a more specific request.", 502, "EMPTY_RESPONSE");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new LlmError("The model returned malformed data. Try again; the app rejected it safely.", 502, "MALFORMED_RESPONSE");
  }
}

export async function generateStructured<T>(options: {
  systemPrompt: string;
  prompt: string;
  jsonSchema: object;
  schema: ZodType<T>;
  temperature?: number;
}): Promise<T> {
  const raw = await requestJson(
    options.systemPrompt,
    options.prompt,
    options.jsonSchema,
    options.temperature ?? 0.2,
  );
  const parsed = options.schema.safeParse(raw);
  if (!parsed.success) {
    throw new LlmError(
      "The model returned data that failed validation. Try again; invalid filters were not applied.",
      502,
      "VALIDATION_FAILED",
    );
  }
  return parsed.data;
}
