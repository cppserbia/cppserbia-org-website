import fs from "fs";
import matter from "gray-matter";
import path from "path";
import sharp from "sharp";

const EVENTS_DIR = path.join(process.cwd(), "events");
const IMAGES_DIR = path.join(process.cwd(), "images", "events");
const IMAGE_BASE_URL = "https://images.cppserbia.org/events";

async function main() {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`Images directory not found: ${IMAGES_DIR}`);
    console.error("Run the download script first: npx tsx scripts/download-meetup-images.ts");
    process.exit(1);
  }

  const imageFiles = new Set(
    fs.readdirSync(IMAGES_DIR).filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
  );

  const eventFiles = fs
    .readdirSync(EVENTS_DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"));

  console.log(`Found ${imageFiles.size} images and ${eventFiles.length} event files.\n`);

  let updated = 0;
  let skipped = 0;

  for (const file of eventFiles) {
    const slug = file.replace(/\.md$/, "");

    // Find matching image (try common extensions)
    const imageFile = [`${slug}.jpg`, `${slug}.jpeg`, `${slug}.png`, `${slug}.webp`].find((f) =>
      imageFiles.has(f)
    );

    if (!imageFile) {
      continue;
    }

    const filePath = path.join(EVENTS_DIR, file);
    const raw = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(raw);

    if (data.imageUrl) {
      skipped++;
      continue;
    }

    data.imageUrl = `${IMAGE_BASE_URL}/${imageFile}`;
    // The event page declares this as og:image:width/height.
    const { width, height } = await sharp(path.join(IMAGES_DIR, imageFile)).metadata();
    data.imageWidth = width;
    data.imageHeight = height;

    const updatedContent = matter.stringify(content, data);
    fs.writeFileSync(filePath, updatedContent);

    console.log(`[updated] ${slug} → ${data.imageUrl}`);
    updated++;
  }

  console.log(`\nDone: ${updated} updated, ${skipped} already had imageUrl.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
