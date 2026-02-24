import { readFileSync } from "fs";
import { parseSocialText } from "./extract";

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  const metadataPath = process.argv[2];
  if (!metadataPath) {
    console.error("Usage: cat social-text.txt | npx tsx scripts/social/merge-payload.ts metadata.json");
    process.exit(1);
  }

  const socialText = await readStdin();
  const { en, sr } = parseSocialText(socialText);

  console.error(`Parsed social text — EN: ${en.length} chars, SR: ${sr.length} chars`);

  const metadata = JSON.parse(readFileSync(metadataPath, "utf8"));

  const payload = {
    social_text_en: en,
    social_text_sr: sr,
    ...metadata,
  };

  console.log(JSON.stringify(payload));
}

main();
