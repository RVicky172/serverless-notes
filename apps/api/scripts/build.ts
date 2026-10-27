/**
 * Bundles every file in src/handlers into its own Lambda package:
 *   dist/<handlerName>/index.mjs  (+ source map)
 *
 * Terraform zips each folder and deploys it with handler "index.handler".
 * Run with Node 24+, which executes TypeScript directly.
 */
import { build } from "esbuild";
import { readdir, rm } from "node:fs/promises";
import { basename, join } from "node:path";

const root = join(import.meta.dirname, "..");
const handlersDir = join(root, "src", "handlers");
const outDir = join(root, "dist");

const handlerNames = (await readdir(handlersDir))
  .filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"))
  .map((file) => basename(file, ".ts"));

await rm(outDir, { recursive: true, force: true });

await Promise.all(
  handlerNames.map((name) =>
    build({
      entryPoints: [join(handlersDir, `${name}.ts`)],
      outfile: join(outDir, name, "index.mjs"),
      bundle: true,
      platform: "node",
      target: "node24",
      format: "esm",
      minify: true,
      sourcemap: true,
      legalComments: "none",
      // Some AWS SDK dependencies still call require(); give ESM bundles a working one.
      banner: {
        js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
      },
    }),
  ),
);

console.info(`Built ${handlerNames.length} Lambda handlers: ${handlerNames.join(", ")}`);
