import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { EventFrontmatter } from "./types";

export function readEventFile(eventFile: string): {
  frontmatter: EventFrontmatter;
  content: string;
  slug: string;
} {
  const resolvedPath = path.resolve(eventFile);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found: ${resolvedPath}`);
  }

  const fileContents = fs.readFileSync(resolvedPath, "utf8");
  const { data, content } = matter(fileContents);

  if (!data.title || !data.date) {
    throw new Error(
      `Event file missing required frontmatter fields (title, date): ${resolvedPath}`
    );
  }

  if (typeof data.title !== "string") {
    throw new Error(`Expected title to be a string in ${resolvedPath}`);
  }

  return {
    frontmatter: data as EventFrontmatter,
    content,
    slug: path.basename(eventFile, ".md"),
  };
}
