/**
 * Reduces inline Markdown to plain text: `[text](url)` becomes `text`, emphasis and
 * code markers are removed, images collapse to their alt text.
 *
 * Event descriptions are excerpted from Markdown bodies but consumed as plain text
 * everywhere — cards, `<meta>` descriptions, OpenGraph, JSON-LD — so the markup has
 * to come off at extraction time, before the excerpt is truncated. Stripping first
 * also keeps truncation from cutting a link in half and leaving `[text](https://…`
 * in the output.
 *
 * Inline constructs only: block-level Markdown (headings, list markers, tables)
 * never reaches the extractor, which walks paragraph lines.
 */
export function stripInlineMarkdown(text: string): string {
  return (
    text
      // Images first so the link pass doesn't eat `![alt](url)` as a link
      .replace(/!\[([^\]]*)\]\((?:<[^>]*>|[^)]*)\)/g, "$1")
      // `<url>` destinations exist to protect parentheses inside the URL
      .replace(/\[([^\]]+)\]\((?:<[^>]*>|[^)]*)\)/g, "$1")
      .replace(/<(https?:\/\/[^>\s]+)>/g, "$1")
      // `***text***` sheds the bold pair here and the italic pair below
      .replace(/(\*\*|__)(?=\S)([^*_](?:.*?\S)?)\1/g, "$2")
      .replace(/~~(?=\S)((?:[^~]*\S)?)~~/g, "$1")
      .replace(/\*(?=\S)((?:[^*]*\S)?)\*/g, "$1")
      // Word-boundary guards keep identifiers like `lower_bound` intact
      .replace(/(?<![\w\\])_(?=\S)((?:[^_]*\S)?)_(?!\w)/g, "$1")
      .replace(/`([^`]*)`/g, "$1")
      .trim()
  );
}
