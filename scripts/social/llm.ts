import { generateSocialDraft as geminiGenerate } from "./gemini";
import { generateSocialDraft as githubGenerate } from "./github-models";
import { LlmApiError } from "./llm-error";

export type Provider = "gemini" | "github" | "auto";

export async function generateWithFallback(
  provider: Provider,
  prompt: string
): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const githubToken = process.env.GITHUB_TOKEN;

  if (provider === "gemini") {
    if (!geminiKey) throw new Error("Missing GEMINI_API_KEY environment variable.");
    return geminiGenerate(geminiKey, prompt);
  }

  if (provider === "github") {
    if (!githubToken) throw new Error("Missing GITHUB_TOKEN environment variable.");
    return githubGenerate(githubToken, prompt);
  }

  // Auto mode: try available providers with fallback
  if (!geminiKey && !githubToken) {
    throw new Error(
      "No LLM provider available. Set GEMINI_API_KEY or GITHUB_TOKEN environment variable."
    );
  }

  // If only one provider is available, use it directly
  if (!geminiKey) {
    console.error("GEMINI_API_KEY not set, using GitHub Models directly.");
    return githubGenerate(githubToken!, prompt);
  }
  if (!githubToken) {
    return geminiGenerate(geminiKey, prompt);
  }

  // Both available: try Gemini first, fall back to GitHub on 5xx
  try {
    return await geminiGenerate(geminiKey, prompt);
  } catch (error) {
    if (error instanceof LlmApiError && error.status >= 500) {
      console.error(
        `Gemini returned ${error.status}, falling back to GitHub Models...`
      );
      return githubGenerate(githubToken, prompt);
    }
    throw error;
  }
}
