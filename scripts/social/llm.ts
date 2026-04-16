import { generateSocialDraft as geminiGenerate } from "./gemini";
import { generateSocialDraft as githubGenerate } from "./github-models";
import type { LlmError, Result } from "./types";
import { err } from "./types";

export type Provider = "gemini" | "github" | "auto";

export async function generateWithFallback(
  provider: Provider,
  prompt: string
): Promise<Result<string, LlmError>> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const githubToken = process.env.GITHUB_TOKEN;

  if (provider === "gemini") {
    if (!geminiKey) {
      return err({
        kind: "client",
        message: "Missing GEMINI_API_KEY environment variable.",
        status: 0,
      });
    }
    return geminiGenerate(geminiKey, prompt);
  }

  if (provider === "github") {
    return githubGenerate(githubToken, prompt);
  }

  // Auto mode: try available providers with fallback
  if (!geminiKey) {
    console.error("GEMINI_API_KEY not set, using GitHub Models directly.");
    return githubGenerate(githubToken, prompt);
  }

  // Try Gemini first, fall back to GitHub on timeout or server errors
  const geminiResult = await geminiGenerate(geminiKey, prompt);
  if (geminiResult.ok) {
    return geminiResult;
  }

  const { kind } = geminiResult.error;
  if (kind === "timeout" || kind === "server") {
    const reason =
      kind === "timeout"
        ? "timed out"
        : `returned ${(geminiResult.error as { status: number }).status}`;
    console.error(`Gemini ${reason}, falling back to GitHub Models...`);
    return githubGenerate(githubToken, prompt);
  }

  return geminiResult;
}
