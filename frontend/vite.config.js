import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Função para copiar arquivos de fonte para o diretório público
function copyFontsPlugin() {
  return {
    name: "copy-bootstrap-icons-fonts",
    buildStart() {
      // Verificar se o diretório existe, se não, criar
      const fontDir = path.resolve(__dirname, "public/assets/fonts");
      if (!fs.existsSync(fontDir)) {
        fs.mkdirSync(fontDir, { recursive: true });
      }

      // Caminhos de origem das fontes
      const sourceDir = path.resolve(
        __dirname,
        "../node_modules/bootstrap-icons/font/fonts"
      );
      const files = ["bootstrap-icons.woff", "bootstrap-icons.woff2"];

      // Copiar os arquivos
      files.forEach((file) => {
        const sourcePath = path.join(sourceDir, file);
        const destPath = path.join(fontDir, file);
        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, destPath);
          console.log(`Copiado: ${sourcePath} -> ${destPath}`);
        } else {
          console.warn(`Arquivo não encontrado: ${sourcePath}`);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), copyFontsPlugin()],
  root: __dirname,
  publicDir: path.resolve(__dirname, "public"),
  build: {
    outDir: path.resolve(__dirname, "..", "build"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
      output: {
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split(".");
          const extType = info[info.length - 1];
          if (/\.(woff|woff2|eot|ttf|otf)$/.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    fs: {
      allow: ["..", "node_modules"],
    },
  },
});
