import { cpSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const root = fileURLToPath(new URL(".", import.meta.url));
const modules = {
  "virtual:visual-catalog": ["参考图鉴.js", "referenceCatalog"],
  "virtual:atlas-previews": ["图鉴素材/atlas/词条.js", "atlasPreviewData"],
  "virtual:motion-previews": ["图鉴素材/motion/词条.js", "motionPreviewData"],
  "virtual:external-styles": ["图鉴素材/styles/词条.js", "externalStyleCatalog"],
};

function libraryAssets() {
  return {
    name: "visual-library-assets",
    async configureServer(server) {
      const [{ createApi }, { openLibrary }] = await Promise.all([
        import("./server/api.js"),
        import("./server/database.js"),
      ]);
      const store = openLibrary();
      const api = createApi(store);
      server.httpServer?.once("close", () => store.close());
      server.middlewares.use((request, response, next) => {
        if (request.url?.startsWith("/api/") || request.url === "/mcp" || request.url?.startsWith("/mcp?")) void api(request, response);
        else next();
      });
    },
    resolveId(id) {
      if (Object.hasOwn(modules, id)) return "\0" + id;
    },
    load(id) {
      const entry = modules[id.slice(1)];
      if (!id.startsWith("\0") || !entry) return;
      const [file, binding] = entry;
      const source = resolve(root, file);
      this.addWatchFile(source);
      return readFileSync(source, "utf8") + "\nexport default " + binding + ";\n";
    },
    writeBundle({ dir }) {
      if (!dir) return;
      for (const path of ["atlas/参考图", "motion", "贴纸", "cookbook", "design-md"]) {
        cpSync(resolve(root, "图鉴素材", path), resolve(dir, "图鉴素材", path), { recursive: true });
      }
      cpSync(resolve(root, "src/components/react-bits-license.txt"), resolve(dir, "react-bits-license.txt"));
    },
  };
}

export default defineConfig({
  base: "./",
  publicDir: false,
  plugins: [react(), tailwindcss(), libraryAssets()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "ui-primitives", test: /node_modules\/(?:@radix-ui|@floating-ui)\// },
            { name: "atlas-data", test: /virtual:atlas-previews$/ },
            { name: "external-styles-data", test: /virtual:external-styles$/ },
            { name: "catalog-data", test: /(?:virtual:(?:visual-catalog|motion-previews)$|src\/atlas-zh\.js$)/ },
          ],
        },
      },
    },
  },
});
