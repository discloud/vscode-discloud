import { context } from "esbuild";

/** @type {import("esbuild").Plugin} */
const esbuildProblemMatcherPlugin = {
  name: "esbuild-problem-matcher",

  setup(build) {
    build.onStart(() => console.log("[watch] build started"));

    build.onEnd((result) => {
      const messages = [];
      const params = [];

      for (const error of result.errors) {
        messages.push("✘ [ERROR] %s\n    %s:%s:%s:");
        params.push(
          error.text,
          error.location.file,
          error.location.line,
          error.location.column,
        );
      }

      console.error(messages.join("\n"), ...params);

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
    plugins: [...(watch ? [esbuildProblemMatcherPlugin] : [])],
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
