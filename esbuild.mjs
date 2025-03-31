import { context } from "esbuild";

/** @type {import("esbuild").Plugin} */
const esbuildProblemMatcherPlugin = {
  name: "esbuild-problem-matcher",

  setup(build) {
    build.onStart(() => console.log("[watch] build started"));

    build.onEnd((result) => {
      for (let i = 0; i < result.errors.length; i++) {
        const error = result.errors[i];

        console.error("✘ [ERROR] %s", error.text);

        console.error("    %s:%s:%s:", location.file, location.line, location.column);
      }

      console.log("[watch] build finished");
    });
  },
};

async function main() {
  const production = process.argv.includes("--production");
  const watch = process.argv.includes("--watch");

  const ctx = await context({
    entryPoints: ["src/extension.ts"],
    bundle: true,
    format: "cjs",
    minify: production,
    sourcemap: "inline",
    sourcesContent: false,
    platform: "node",
    outfile: "out/extension.js",
    keepNames: !production,
    external: ["vscode"],
    logLevel: "silent",
    plugins: [...watch ? [esbuildProblemMatcherPlugin] : []],
  });

  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
