import { build as esbuild, type Plugin } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@prisma/client",
  "cloudinary",
  "cors",
  "date-fns",
  "dotenv",
  "express",
  "googleapis",
  "pg",
  "prisma",
  "zod",
  "zod-validation-error",
];

// The vite dev middleware is only imported when NODE_ENV !== production.
// Keeping it out of the bundle avoids pulling vite and its plugins (all
// devDependencies) into the production server bundle.
const externalizeDevOnlyModules: Plugin = {
  name: "externalize-dev-only-modules",
  setup(build) {
    build.onResolve({ filter: /^\.\/vite$/ }, () => ({ external: true }));
  },
};

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    target: "node20",
    bundle: true,
    format: "esm",
    outfile: "dist/index.js",
    packages: "external",
    plugins: [externalizeDevOnlyModules],
    // ESM polyfills for CommonJS dependencies
    banner: {
      js: [
        "import { createRequire as __createRequire } from 'module';",
        "import { fileURLToPath as __fileURLToPath } from 'url';",
        "import { dirname as __dirnameFunction } from 'path';",
        "const require = __createRequire(import.meta.url);",
        "const __filename = __fileURLToPath(import.meta.url);",
        "const __dirname = __dirnameFunction(__filename);",
      ].join("\n"),
    },
    logLevel: "info",
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
