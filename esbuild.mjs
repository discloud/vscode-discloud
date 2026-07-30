import { context } from "esbuild";

/** @type {import("esbuild").Plugin} */
const esbuildProblemMatcherPlugin = {
  name: "esbuild-problem-matcher",

  setup(build) {
    build.onStart(() => console.log("[watch] build started"));

    build.onEnd((result) => {
      if (result.warnings.length) {
        /** @type {[string[], unknown[]]} */
        const [messages, params] = result.warnings.reduce((acc, m) => {
          acc[0].push("⚠ [WARN] %s\n    %s:%s:%s:");
          acc[1].push(m.text, m.location.file, m.location.line, m.location.column);
          return acc;
        }, [[], []]);

        console.warn(messages.join("\n"), ...params);
      }

      if (result.errors.length) {
        /** @type {[string[], unknown[]]} */
        const [messages, params] = result.errors.reduce((acc, m) => {
          acc[0].push("✘ [ERROR] %s\n    %s:%s:%s:");
          acc[1].push(m.text, m.location.file, m.location.line, m.location.column);
          return acc;
        }, [[], []]);

        console.error(messages.join("\n"), ...params);
      }

      console.log("[watch] build finished");
    });
  },
};

async function main() {
  const argv = new Set(process.argv);
  const production = argv.has("--production");
  const watch = argv.has("--watch");

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
