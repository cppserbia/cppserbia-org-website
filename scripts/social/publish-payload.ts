const USAGE = `Usage:
  npx tsx scripts/social/publish-payload.ts payload.json          # read from file
  cat payload.json | npx tsx scripts/social/publish-payload.ts    # read from stdin

Env vars:
  MAKE_WEBHOOK_URL  — Make.com webhook URL (required unless DRY_RUN=true)
  MAKE_API_KEY      — Make.com API key (required unless DRY_RUN=true)
  DRY_RUN           — set to "true" to log payload without sending`;

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function stripCodeFences(input: string): string {
  return input.replace(/```\w*\n?/g, "").trim();
}

async function main() {
  const filePath = process.argv[2];

  let raw: string;
  if (filePath) {
    const { readFileSync } = await import("fs");
    raw = readFileSync(filePath, "utf8");
  } else {
    raw = await readStdin();
  }

  const cleaned = stripCodeFences(raw);
  const payload = JSON.parse(cleaned);

  const dryRun = process.env.DRY_RUN === "true";

  if (dryRun) {
    console.log("DRY RUN — payload that would be sent to Make.com:");
    console.log(JSON.stringify(payload, null, 2));
    process.exit(0);
  }

  const webhookUrl = process.env.MAKE_WEBHOOK_URL;
  const apiKey = process.env.MAKE_API_KEY;

  if (!webhookUrl) {
    console.error("Missing MAKE_WEBHOOK_URL environment variable.");
    process.exit(1);
  }
  if (!apiKey) {
    console.error("Missing MAKE_API_KEY environment variable.");
    process.exit(1);
  }

  console.log("Sending payload to Make.com...");
  console.log(JSON.stringify(payload, null, 2));

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-make-apikey": apiKey,
    },
    body: JSON.stringify(payload),
  });

  const body = await response.text();
  console.log(`Response status: ${response.status}`);
  console.log(body);

  if (!response.ok) {
    console.error(`Webhook request failed with status ${response.status}`);
    process.exit(1);
  }

  console.log("Posts dispatched successfully!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
