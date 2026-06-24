import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["cjs", "esm"],
    dts: true,
    outDir: "dist",
    tsconfig: "tsconfig.json",
    noExternal: [
      "@tokenfly/core",
      "@tokenfly/shared",
      "@tokenfly/router",
      "@tokenfly/budget"
    ],
    minify: true,
    clean: true
  },
  {
    entry: ["src/bin.ts"],
    format: ["cjs"],
    dts: false,
    outDir: "dist",
    tsconfig: "tsconfig.json",
    noExternal: [
      "@tokenfly/core",
      "@tokenfly/shared",
      "@tokenfly/router",
      "@tokenfly/budget"
    ],
    minify: true,
    clean: false
  }
]);
