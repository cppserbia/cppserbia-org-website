import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { ok, err } from "./types";
import type { EventFrontmatter, Result } from "./types";

export function readEventFile(eventFile: string): Result<
  { frontmatter: EventFrontmatter; content: string; slug: string },
  string
> {
  const resolvedPath = path.resolve(eventFile);

  if (!fs.existsSync(resolvedPath)) {
    return err(`File not found: ${resolvedPath}`);
  }

  const fileContents = fs.readFileSync(resolvedPath, "utf8");
  const { data, content } = matter(fileContents);

  if (!data.title || !data.date) {
    return err(
      `Event file missing required frontmatter fields (title, date): ${resolvedPath}`
    );
  }

  if (typeof data.title !== "string") {
    return err(`Expected title to be a string in ${resolvedPath}`);
  }

  return ok({
    frontmatter: data as EventFrontmatter,
    content,
    slug: path.basename(eventFile, ".md"),
  });
}
