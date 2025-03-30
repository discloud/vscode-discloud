import { context } from "esbuild";
import { esbuildPluginVersionInjector } from "esbuild-plugin-version-injector";

async function main() {
  const production = process.argv.includes("--production");
  const watch = process.argv.includes("--watch");

  const ctx = await context({
    entryPoints: ["src/extension.ts"],
    bundle: true,
    format: "cjs",
    minify: production,
    sourcemap: "inline",
    sourcesContent: production,
    platform: "node",
    outfile: "out/extension.js",
    keepNames: !production,
    logLevel: "warning",
    external: ["vscode"],
    plugins: [
      esbuildPluginVersionInjector(),
      esbuildProblemMatcherPlugin,
    ],
  });

  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

/** @type {import("esbuild").Plugin} */
const esbuildProblemMatcherPlugin = {
  name: "esbuild-problem-matcher",

  setup(build) {
    const logPrefix = process.argv.includes("--watch") ? "watch" : "build";

    build.onStart(() => console.log("[%s] build started", logPrefix));

    build.onEnd(result => {
      for (let i = 0; i < result.errors.length; i++) {
        const error = result.errors[i];

        console.error("✘ [ERROR] %s", error.text);

        if (error.location)
          console.error("    %s:%s:%s:", error.location.file, error.location.line, error.location.column);
      }

      console.log("[%s] build finished", logPrefix);
    });
  },
};

try {
  await main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
