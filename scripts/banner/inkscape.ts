import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const INKSCAPE_BIN = process.env.INKSCAPE_BIN ?? "inkscape";

export interface InkscapeError extends Error {
  stderr?: string;
  status?: number;
}

async function runInkscape(args: string[]): Promise<{ stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execFileAsync(INKSCAPE_BIN, args, {
      maxBuffer: 16 * 1024 * 1024,
    });
    return { stdout, stderr };
  } catch (err) {
    const e = err as NodeJS.ErrnoException & { stderr?: string; code?: number };
    if (e.code === "ENOENT") {
      throw new Error(
        `Inkscape binary not found at "${INKSCAPE_BIN}". ` +
          `Install it (brew install inkscape / apt-get install inkscape) ` +
          `or set INKSCAPE_BIN to the right path.`
      );
    }
    const wrapped: InkscapeError = new Error(
      `inkscape ${args.join(" ")} failed: ${e.message}\n${e.stderr ?? ""}`
    );
    wrapped.stderr = e.stderr;
    wrapped.status = typeof e.code === "number" ? e.code : undefined;
    throw wrapped;
  }
}

/**
 * Returns the rendered width (in user units / px) of the element with the given id
 * inside the SVG file. Equivalent to the Python `get_element_width_inkscape`.
 */
export async function queryWidth(svgPath: string, elementId: string): Promise<number> {
  const { stdout } = await runInkscape(["--query-id", elementId, "--query-width", svgPath]);
  const value = parseFloat(stdout.trim());
  if (!Number.isFinite(value)) {
    throw new Error(
      `Inkscape returned non-numeric width for id="${elementId}" in ${svgPath}: ${stdout!.trim()}`
    );
  }
  return value;
}

/**
 * Render an SVG element (by id) to a PNG file at exact pixel dimensions.
 *
 * Mirrors `_step_2_svgs_to_pngs.sh`: `-i ID --export-width=W --export-height=H`.
 */
export async function exportPng(
  svgPath: string,
  elementId: string,
  outPath: string,
  width: number,
  height: number
): Promise<void> {
  await runInkscape([
    svgPath,
    `--export-filename=${outPath}`,
    "-i",
    elementId,
    `--export-width=${width}`,
    `--export-height=${height}`,
  ]);
}

/**
 * True if Inkscape is callable (used for friendly upfront diagnostics).
 */
export async function isAvailable(): Promise<boolean> {
  try {
    await runInkscape(["--version"]);
    return true;
  } catch {
    return false;
  }
}
