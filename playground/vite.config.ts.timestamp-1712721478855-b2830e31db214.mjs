// vite.config.ts
import { defineConfig } from "file:///Users/dengriguang/Documents/My/unplugin-env/node_modules/.pnpm/vite@5.2.8_@types+node@20.12.7/node_modules/vite/dist/node/index.js";
import Inspect from "file:///Users/dengriguang/Documents/My/unplugin-env/node_modules/.pnpm/vite-plugin-inspect@0.8.3_@nuxt+kit@3.11.2_rollup@4.14.1_vite@5.2.8/node_modules/vite-plugin-inspect/dist/index.mjs";

// ../src/vite.ts
import { createVitePlugin } from "file:///Users/dengriguang/Documents/My/unplugin-env/node_modules/.pnpm/unplugin@1.10.1/node_modules/unplugin/dist/index.mjs";

// ../src/index.ts
import { promises as fs2 } from "node:fs";
import process3 from "node:process";
import { createUnplugin } from "file:///Users/dengriguang/Documents/My/unplugin-env/node_modules/.pnpm/unplugin@1.10.1/node_modules/unplugin/dist/index.mjs";

// ../src/core/generate.ts
import path, { resolve } from "node:path";
import { promises as fs } from "node:fs";
import process from "node:process";
import fg from "file:///Users/dengriguang/Documents/My/unplugin-env/node_modules/.pnpm/fast-glob@3.3.2/node_modules/fast-glob/out/index.js";
import { loadFile } from "file:///Users/dengriguang/Documents/My/unplugin-env/node_modules/.pnpm/magicast@0.3.3/node_modules/magicast/dist/index.mjs";
import { deepMerge } from "file:///Users/dengriguang/Documents/My/unplugin-env/node_modules/.pnpm/@antfu+utils@0.7.7/node_modules/@antfu/utils/dist/index.mjs";
async function generateScript(options, mode) {
  const { dir, fileName, globalName, serve, build } = options.env;
  const folder = await findFolder(process.cwd(), dir || "");
  const files = await fg("*.+(js|ts)", {
    absolute: true,
    cwd: folder
  });
  const testReg = mode === "serve" ? serve : build;
  let target = {};
  const source = [];
  let code = "";
  const name = fileName || "";
  for (const file of files) {
    try {
      const mod = await loadFile(file);
      if (testReg?.test(file))
        target = mod.exports.default;
      else
        source.push(mod.exports.default);
    } catch (error) {
      console.error(`Error loading file ${file}:`, error);
    }
  }
  const returnedTarget = deepMerge({}, source, target);
  const versionInfo = await generateVersion(options, mode);
  code = `window.${globalName}=${JSON.stringify(returnedTarget)};${versionInfo}`;
  const formatCode = code;
  return {
    code,
    script: `  <script type="text/javascript" src="${fileName}"></script>
</head>`,
    emit: {
      type: "asset",
      fileName: name,
      source: formatCode
    },
    watchFolder: folder
  };
}
async function generateVersion(options, mode) {
  const packageFile = await fg("package.json", {
    absolute: true,
    cwd: resolve(process.cwd())
  });
  const packageString = await fs.readFile(packageFile[0], "utf8");
  const packageJson = JSON.parse(packageString);
  return `console.info("Version: ${packageJson.version} -  ${mode === "serve" ? "runtime" : "built"} on ${options.date}")`;
}
async function findFolder(directoryPath, dir) {
  const ignore = /* @__PURE__ */ new Set(["dist", "node_modules", "playground", "example", "test", "jest", "tests", "locales", "public", ".git", ".github", ".vscode"]);
  const files = await fs.readdir(directoryPath);
  const filePaths = files.filter((item) => !ignore.has(item));
  let nestedFolder = "";
  for (const file of filePaths) {
    const fullFilePath = path.join(directoryPath, file);
    const stat = await fs.stat(fullFilePath);
    if (stat.isDirectory()) {
      if (file.toLowerCase() === dir) {
        return fullFilePath;
      } else {
        nestedFolder = await findFolder(fullFilePath, dir);
        if (nestedFolder)
          return nestedFolder;
      }
    }
  }
  return "";
}

// ../src/core/options.ts
import { deepMerge as deepMerge2 } from "file:///Users/dengriguang/Documents/My/unplugin-env/node_modules/.pnpm/@antfu+utils@0.7.7/node_modules/@antfu/utils/dist/index.mjs";
async function resolveOptions(options) {
  const defaults = {
    env: {
      dir: "config",
      fileName: "manifest.js",
      globalName: "manifest",
      serve: /dev|development/i,
      build: /prod|production/i
    }
  };
  const mergeOptions = deepMerge2(defaults, options);
  return {
    ...mergeOptions,
    date: (/* @__PURE__ */ new Date()).toString()
  };
}

// ../src/core/compress.ts
import process2 from "node:process";
import * as compressing from "file:///Users/dengriguang/Documents/My/unplugin-env/node_modules/.pnpm/compressing@1.10.0/node_modules/compressing/index.js";

// ../src/core/log.ts
import chalk from "file:///Users/dengriguang/Documents/My/unplugin-env/node_modules/.pnpm/chalk@5.3.0/node_modules/chalk/source/index.js";
var log = console.log;
var Log = class {
  static log(key, msg) {
    log(chalk.bold(`${key}: ${msg}`));
  }
  static error(key, msg) {
    log(chalk.bold.red(`${key}: ${msg}`));
  }
  static success(key, msg) {
    log(chalk.bold.green(`${key}: ${msg}`));
  }
};

// ../src/core/compress.ts
async function createCompress(options) {
  Log.log("Compressing the directory", options);
  try {
    await compressing.zip.compressDir("./dist", "./dist.zip");
    Log.success("Successfully compressed the directory", options);
    process2.exit(0);
  } catch (error) {
    Log.error("Error compressing the directory", error);
    throw error;
  }
}

// ../src/index.ts
var virtualEnvId = "virtual:env";
var resolvedVirtualEnvId = `\0${virtualEnvId}`;
var unpluginFactory = (options = {}) => {
  const resolved = resolveOptions(options);
  return [{
    name: "plugin-env-serve",
    apply: "serve",
    enforce: "post",
    async resolveId(id) {
      if (id.startsWith(virtualEnvId))
        return resolvedVirtualEnvId;
    },
    async load(id) {
      if (id.startsWith(resolvedVirtualEnvId)) {
        const config = await resolved;
        const { code } = await generateScript(config, "serve");
        this.addWatchFile("");
        return code;
      }
    }
  }, {
    name: "unplugin-env-build",
    apply: "build",
    enforce: "post",
    resolveId(id) {
      if (id.startsWith(virtualEnvId))
        return resolvedVirtualEnvId;
    },
    async load(id) {
      const config = await resolved;
      const { emit, script } = await generateScript(config, "build");
      if (id.startsWith(resolvedVirtualEnvId)) {
        this.emitFile(emit);
        return "";
      }
      if (id.endsWith(".html")) {
        let code = await fs2.readFile(id, "utf8");
        code = code.replace(/<\/head>/gm, script);
        return {
          code
        };
      }
      return null;
    },
    buildEnd: () => {
      process3.on("beforeExit", async () => {
        await createCompress({});
      });
    }
  }];
};

// ../src/vite.ts
var vite_default = createVitePlugin(unpluginFactory);

// vite.config.ts
var vite_config_default = defineConfig({
  plugins: [
    Inspect(),
    vite_default()
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAiLi4vc3JjL3ZpdGUudHMiLCAiLi4vc3JjL2luZGV4LnRzIiwgIi4uL3NyYy9jb3JlL2dlbmVyYXRlLnRzIiwgIi4uL3NyYy9jb3JlL29wdGlvbnMudHMiLCAiLi4vc3JjL2NvcmUvY29tcHJlc3MudHMiLCAiLi4vc3JjL2NvcmUvbG9nLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL2RlbmdyaWd1YW5nL0RvY3VtZW50cy9NeS91bnBsdWdpbi1lbnYvcGxheWdyb3VuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2RlbmdyaWd1YW5nL0RvY3VtZW50cy9NeS91bnBsdWdpbi1lbnYvcGxheWdyb3VuZC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvZGVuZ3JpZ3VhbmcvRG9jdW1lbnRzL015L3VucGx1Z2luLWVudi9wbGF5Z3JvdW5kL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCBJbnNwZWN0IGZyb20gJ3ZpdGUtcGx1Z2luLWluc3BlY3QnXG5pbXBvcnQgVW5wbHVnaW4gZnJvbSAnLi4vc3JjL3ZpdGUnXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICBJbnNwZWN0KCksXG4gICAgVW5wbHVnaW4oKSxcbiAgXSxcbn0pXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9kZW5ncmlndWFuZy9Eb2N1bWVudHMvTXkvdW5wbHVnaW4tZW52L3NyY1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2RlbmdyaWd1YW5nL0RvY3VtZW50cy9NeS91bnBsdWdpbi1lbnYvc3JjL3ZpdGUudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2RlbmdyaWd1YW5nL0RvY3VtZW50cy9NeS91bnBsdWdpbi1lbnYvc3JjL3ZpdGUudHNcIjtpbXBvcnQgeyBjcmVhdGVWaXRlUGx1Z2luIH0gZnJvbSAndW5wbHVnaW4nXG5pbXBvcnQgeyB1bnBsdWdpbkZhY3RvcnkgfSBmcm9tICcuJ1xuXG5leHBvcnQgZGVmYXVsdCBjcmVhdGVWaXRlUGx1Z2luKHVucGx1Z2luRmFjdG9yeSlcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL2RlbmdyaWd1YW5nL0RvY3VtZW50cy9NeS91bnBsdWdpbi1lbnYvc3JjXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvZGVuZ3JpZ3VhbmcvRG9jdW1lbnRzL015L3VucGx1Z2luLWVudi9zcmMvaW5kZXgudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2RlbmdyaWd1YW5nL0RvY3VtZW50cy9NeS91bnBsdWdpbi1lbnYvc3JjL2luZGV4LnRzXCI7aW1wb3J0IHsgcHJvbWlzZXMgYXMgZnMgfSBmcm9tICdub2RlOmZzJ1xuaW1wb3J0IHByb2Nlc3MgZnJvbSAnbm9kZTpwcm9jZXNzJ1xuaW1wb3J0IHsgdHlwZSBVbnBsdWdpbkZhY3RvcnksIGNyZWF0ZVVucGx1Z2luIH0gZnJvbSAndW5wbHVnaW4nXG5pbXBvcnQgdHlwZSB7IE9wdGlvbnMgfSBmcm9tICcuL3R5cGVzJ1xuaW1wb3J0IHsgZ2VuZXJhdGVTY3JpcHQgfSBmcm9tICcuL2NvcmUvZ2VuZXJhdGUnXG5pbXBvcnQgeyByZXNvbHZlT3B0aW9ucyB9IGZyb20gJy4vY29yZS9vcHRpb25zJ1xuaW1wb3J0IHsgY3JlYXRlQ29tcHJlc3MgfSBmcm9tICcuL2NvcmUvY29tcHJlc3MnXG5cbmNvbnN0IHZpcnR1YWxFbnZJZCA9ICd2aXJ0dWFsOmVudidcbmNvbnN0IHJlc29sdmVkVmlydHVhbEVudklkID0gYFxcMCR7dmlydHVhbEVudklkfWBcblxuZXhwb3J0IGNvbnN0IHVucGx1Z2luRmFjdG9yeTogVW5wbHVnaW5GYWN0b3J5PE9wdGlvbnMgfCB1bmRlZmluZWQ+ID0gKG9wdGlvbnMgPSB7fSkgPT4ge1xuICBjb25zdCByZXNvbHZlZCA9IHJlc29sdmVPcHRpb25zKG9wdGlvbnMpXG4gIHJldHVybiBbe1xuICAgIG5hbWU6ICdwbHVnaW4tZW52LXNlcnZlJyxcbiAgICBhcHBseTogJ3NlcnZlJyxcbiAgICBlbmZvcmNlOiAncG9zdCcsXG4gICAgYXN5bmMgcmVzb2x2ZUlkKGlkKSB7XG4gICAgICBpZiAoaWQuc3RhcnRzV2l0aCh2aXJ0dWFsRW52SWQpKVxuICAgICAgICByZXR1cm4gcmVzb2x2ZWRWaXJ0dWFsRW52SWRcbiAgICB9LFxuICAgIGFzeW5jIGxvYWQoaWQpIHtcbiAgICAgIGlmIChpZC5zdGFydHNXaXRoKHJlc29sdmVkVmlydHVhbEVudklkKSkge1xuICAgICAgICBjb25zdCBjb25maWcgPSBhd2FpdCByZXNvbHZlZFxuICAgICAgICBjb25zdCB7IGNvZGUgfSA9IGF3YWl0IGdlbmVyYXRlU2NyaXB0KGNvbmZpZywgJ3NlcnZlJylcblxuICAgICAgICB0aGlzLmFkZFdhdGNoRmlsZSgnJylcbiAgICAgICAgLy8gY29uc29sZS5sb2codGhpcy5nZXRXYXRjaEZpbGVzKCkpXG4gICAgICAgIHJldHVybiBjb2RlXG4gICAgICB9XG4gICAgfSxcbiAgfSwge1xuICAgIG5hbWU6ICd1bnBsdWdpbi1lbnYtYnVpbGQnLFxuICAgIGFwcGx5OiAnYnVpbGQnLFxuICAgIGVuZm9yY2U6ICdwb3N0JyxcbiAgICByZXNvbHZlSWQoaWQpIHtcbiAgICAgIGlmIChpZC5zdGFydHNXaXRoKHZpcnR1YWxFbnZJZCkpXG4gICAgICAgIHJldHVybiByZXNvbHZlZFZpcnR1YWxFbnZJZFxuICAgIH0sXG4gICAgYXN5bmMgbG9hZChpZCkge1xuICAgICAgY29uc3QgY29uZmlnID0gYXdhaXQgcmVzb2x2ZWRcbiAgICAgIGNvbnN0IHsgZW1pdCwgc2NyaXB0IH0gPSBhd2FpdCBnZW5lcmF0ZVNjcmlwdChjb25maWcsICdidWlsZCcpXG4gICAgICBpZiAoaWQuc3RhcnRzV2l0aChyZXNvbHZlZFZpcnR1YWxFbnZJZCkpIHtcbiAgICAgICAgdGhpcy5lbWl0RmlsZShlbWl0KVxuICAgICAgICByZXR1cm4gJydcbiAgICAgIH1cbiAgICAgIGlmIChpZC5lbmRzV2l0aCgnLmh0bWwnKSkge1xuICAgICAgICBsZXQgY29kZSA9IGF3YWl0IGZzLnJlYWRGaWxlKGlkLCAndXRmOCcpXG4gICAgICAgIGNvZGUgPSBjb2RlLnJlcGxhY2UoLzxcXC9oZWFkPi9nbSwgc2NyaXB0KVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGNvZGUsXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG51bGxcbiAgICB9LFxuICAgIGJ1aWxkRW5kOiAoKSA9PiB7XG4gICAgICBwcm9jZXNzLm9uKCdiZWZvcmVFeGl0JywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBhd2FpdCBjcmVhdGVDb21wcmVzcyh7fSlcbiAgICAgIH0pXG4gICAgfSxcbiAgfV1cbn1cblxuZXhwb3J0IGNvbnN0IHVucGx1Z2luID0gLyogI19fUFVSRV9fICovIGNyZWF0ZVVucGx1Z2luKHVucGx1Z2luRmFjdG9yeSlcblxuZXhwb3J0IGRlZmF1bHQgdW5wbHVnaW5cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL2RlbmdyaWd1YW5nL0RvY3VtZW50cy9NeS91bnBsdWdpbi1lbnYvc3JjL2NvcmVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9kZW5ncmlndWFuZy9Eb2N1bWVudHMvTXkvdW5wbHVnaW4tZW52L3NyYy9jb3JlL2dlbmVyYXRlLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9kZW5ncmlndWFuZy9Eb2N1bWVudHMvTXkvdW5wbHVnaW4tZW52L3NyYy9jb3JlL2dlbmVyYXRlLnRzXCI7aW1wb3J0IHBhdGgsIHsgcmVzb2x2ZSB9IGZyb20gJ25vZGU6cGF0aCdcbmltcG9ydCB7IHByb21pc2VzIGFzIGZzIH0gZnJvbSAnbm9kZTpmcydcbmltcG9ydCBwcm9jZXNzIGZyb20gJ25vZGU6cHJvY2VzcydcbmltcG9ydCBmZyBmcm9tICdmYXN0LWdsb2InXG5pbXBvcnQgeyBsb2FkRmlsZSB9IGZyb20gJ21hZ2ljYXN0J1xuaW1wb3J0IHsgZGVlcE1lcmdlIH0gZnJvbSAnQGFudGZ1L3V0aWxzJ1xuXG5pbXBvcnQgdHlwZSB7IEdlbmVyYXRlU2NyaXB0LCBSZXNvbHZlZE9wdGlvbnMgfSBmcm9tICcuLi90eXBlcydcblxuLyoqXG4gKiBcdTc1MUZcdTYyMTBcdTgxMUFcdTY3MkNcbiAqIEBwYXJhbSBvcHRpb25zIC0gXHU4OUUzXHU2NzkwXHU3Njg0XHU5MDA5XHU5ODc5XG4gKiBAcGFyYW0gbW9kZSAtIFx1NkEyMVx1NUYwRlx1RkYwQ1x1NTNFRlx1NEVFNVx1NjYyRidzZXJ2ZSdcdTYyMTYnYnVpbGQnXG4gKiBAcmV0dXJucyBcdThGRDRcdTU2REVcdTRFMDBcdTRFMkFQcm9taXNlXHVGRjBDXHU1MTc2XHU1MDNDXHU0RTNBR2VuZXJhdGVTY3JpcHRcdTVCRjlcdThDNjFcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlU2NyaXB0KG9wdGlvbnM6IFJlc29sdmVkT3B0aW9ucywgbW9kZTogJ3NlcnZlJyB8ICdidWlsZCcpOiBQcm9taXNlPEdlbmVyYXRlU2NyaXB0PiB7XG4gIGNvbnN0IHsgZGlyLCBmaWxlTmFtZSwgZ2xvYmFsTmFtZSwgc2VydmUsIGJ1aWxkIH0gPSBvcHRpb25zLmVudlxuICBjb25zdCBmb2xkZXIgPSBhd2FpdCBmaW5kRm9sZGVyKHByb2Nlc3MuY3dkKCksIGRpciB8fCAnJylcbiAgY29uc3QgZmlsZXMgPSBhd2FpdCBmZygnKi4rKGpzfHRzKScsIHtcbiAgICBhYnNvbHV0ZTogdHJ1ZSxcbiAgICBjd2Q6IGZvbGRlcixcbiAgfSlcbiAgLy8gYnVpbGQgb3Igc2VydmUgUmVnRXhwXG4gIGNvbnN0IHRlc3RSZWcgPSBtb2RlID09PSAnc2VydmUnID8gc2VydmUgOiBidWlsZFxuICBsZXQgdGFyZ2V0ID0ge31cbiAgY29uc3Qgc291cmNlID0gW11cbiAgbGV0IGNvZGUgPSAnJ1xuICBjb25zdCBuYW1lID0gZmlsZU5hbWUgfHwgJydcblxuICBmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgbW9kID0gYXdhaXQgbG9hZEZpbGUoZmlsZSlcbiAgICAgIGlmICh0ZXN0UmVnPy50ZXN0KGZpbGUpKVxuICAgICAgICB0YXJnZXQgPSBtb2QuZXhwb3J0cy5kZWZhdWx0XG5cbiAgICAgIGVsc2VcbiAgICAgICAgc291cmNlLnB1c2gobW9kLmV4cG9ydHMuZGVmYXVsdClcbiAgICB9XG4gICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAvLyBIYW5kbGUgZXJyb3JzIGhlcmUgaWYgbmVlZGVkXG4gICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBsb2FkaW5nIGZpbGUgJHtmaWxlfTpgLCBlcnJvcilcbiAgICB9XG4gIH1cbiAgY29uc3QgcmV0dXJuZWRUYXJnZXQgPSBkZWVwTWVyZ2Uoe30sIHNvdXJjZSwgdGFyZ2V0KVxuICBjb25zdCB2ZXJzaW9uSW5mbyA9IGF3YWl0IGdlbmVyYXRlVmVyc2lvbihvcHRpb25zLCBtb2RlKVxuICBjb2RlID0gYHdpbmRvdy4ke2dsb2JhbE5hbWV9PSR7SlNPTi5zdHJpbmdpZnkocmV0dXJuZWRUYXJnZXQpfTske3ZlcnNpb25JbmZvfWBcbiAgY29uc3QgZm9ybWF0Q29kZSA9IGNvZGVcbiAgcmV0dXJuIHtcbiAgICBjb2RlLFxuICAgIHNjcmlwdDogYCAgPHNjcmlwdCB0eXBlPVwidGV4dC9qYXZhc2NyaXB0XCIgc3JjPVwiJHtmaWxlTmFtZX1cIj48L3NjcmlwdD5cXG48L2hlYWQ+YCxcbiAgICBlbWl0OiB7XG4gICAgICB0eXBlOiAnYXNzZXQnLFxuICAgICAgZmlsZU5hbWU6IG5hbWUsXG4gICAgICBzb3VyY2U6IGZvcm1hdENvZGUsXG4gICAgfSxcbiAgICB3YXRjaEZvbGRlcjogZm9sZGVyLFxuICB9XG59XG5cbi8qKlxuICogXHU3NTFGXHU2MjEwXHU3MjQ4XHU2NzJDXHU0RkUxXHU2MDZGXG4gKiBAcGFyYW0gb3B0aW9ucyAtIFx1ODlFM1x1Njc5MFx1NzY4NFx1OTAwOVx1OTg3OVxuICogQHBhcmFtIG1vZGUgLSBcdTZBMjFcdTVGMEZcdUZGMENcdTUzRUZcdTRFRTVcdTY2MkYnc2VydmUnXHU2MjE2J2J1aWxkJ1xuICogQHJldHVybnMgXHU4RkQ0XHU1NkRFXHU3MjQ4XHU2NzJDXHU0RkUxXHU2MDZGXHU3Njg0XHU1QjU3XHU3QjI2XHU0RTMyXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlVmVyc2lvbihvcHRpb25zOiBSZXNvbHZlZE9wdGlvbnMsIG1vZGU6ICdzZXJ2ZScgfCAnYnVpbGQnKSB7XG4gIGNvbnN0IHBhY2thZ2VGaWxlID0gYXdhaXQgZmcoJ3BhY2thZ2UuanNvbicsIHtcbiAgICBhYnNvbHV0ZTogdHJ1ZSxcbiAgICBjd2Q6IHJlc29sdmUocHJvY2Vzcy5jd2QoKSksXG4gIH0pXG4gIGNvbnN0IHBhY2thZ2VTdHJpbmcgPSBhd2FpdCBmcy5yZWFkRmlsZShwYWNrYWdlRmlsZVswXSwgJ3V0ZjgnKVxuICBjb25zdCBwYWNrYWdlSnNvbiA9IEpTT04ucGFyc2UocGFja2FnZVN0cmluZylcbiAgcmV0dXJuIGBjb25zb2xlLmluZm8oXCJWZXJzaW9uOiAke3BhY2thZ2VKc29uLnZlcnNpb259IC0gICR7bW9kZSA9PT0gJ3NlcnZlJyA/ICdydW50aW1lJyA6ICdidWlsdCd9IG9uICR7b3B0aW9ucy5kYXRlfVwiKWBcbn1cblxuLyoqXG4gKiBcdTkwMTJcdTVGNTJcdTY3RTVcdTYyN0VcdTc2RUVcdTVGNTVcdTRFMkRcdTY2MkZcdTU0MjZcdTVCNThcdTU3MjhcdTYzMDdcdTVCOUFcdTc2ODRcdTY1ODdcdTRFRjZcdTU5MzlcbiAqIEBwYXJhbSBkaXJlY3RvcnlQYXRoIFx1NzZFRVx1NUY1NVx1OERFRlx1NUY4NFxuICogQHBhcmFtIGRpciBcdTk3MDBcdTg5ODFcdTY3RTVcdTYyN0VcdTc2ODRcdTY1ODdcdTRFRjZcdTU5MzlcdTU0MERcbiAqIEByZXR1cm5zIFx1NTk4Mlx1Njc5Q1x1NjI3RVx1NTIzMFx1NTIxOVx1OEZENFx1NTZERVx1NjU4N1x1NEVGNlx1NTkzOVx1OERFRlx1NUY4NFx1RkYwQ1x1NTQyNlx1NTIxOVx1OEZENFx1NTZERVx1N0E3QVx1NUI1N1x1N0IyNlx1NEUzMlxuICovXG5hc3luYyBmdW5jdGlvbiBmaW5kRm9sZGVyKGRpcmVjdG9yeVBhdGg6IHN0cmluZywgZGlyOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCBpZ25vcmUgPSBuZXcgU2V0KFsnZGlzdCcsICdub2RlX21vZHVsZXMnLCAncGxheWdyb3VuZCcsICdleGFtcGxlJywgJ3Rlc3QnLCAnamVzdCcsICd0ZXN0cycsICdsb2NhbGVzJywgJ3B1YmxpYycsICcuZ2l0JywgJy5naXRodWInLCAnLnZzY29kZSddKVxuICBjb25zdCBmaWxlcyA9IGF3YWl0IGZzLnJlYWRkaXIoZGlyZWN0b3J5UGF0aClcbiAgY29uc3QgZmlsZVBhdGhzID0gZmlsZXMuZmlsdGVyKGl0ZW0gPT4gIWlnbm9yZS5oYXMoaXRlbSkpXG4gIGxldCBuZXN0ZWRGb2xkZXIgPSAnJ1xuICBmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZVBhdGhzKSB7XG4gICAgY29uc3QgZnVsbEZpbGVQYXRoID0gcGF0aC5qb2luKGRpcmVjdG9yeVBhdGgsIGZpbGUpXG4gICAgY29uc3Qgc3RhdCA9IGF3YWl0IGZzLnN0YXQoZnVsbEZpbGVQYXRoKVxuICAgIGlmIChzdGF0LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgIGlmIChmaWxlLnRvTG93ZXJDYXNlKCkgPT09IGRpcikge1xuICAgICAgICByZXR1cm4gZnVsbEZpbGVQYXRoXG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgbmVzdGVkRm9sZGVyID0gYXdhaXQgZmluZEZvbGRlcihmdWxsRmlsZVBhdGgsIGRpcilcbiAgICAgICAgaWYgKG5lc3RlZEZvbGRlcilcbiAgICAgICAgICByZXR1cm4gbmVzdGVkRm9sZGVyXG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiAnJ1xufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvZGVuZ3JpZ3VhbmcvRG9jdW1lbnRzL015L3VucGx1Z2luLWVudi9zcmMvY29yZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2RlbmdyaWd1YW5nL0RvY3VtZW50cy9NeS91bnBsdWdpbi1lbnYvc3JjL2NvcmUvb3B0aW9ucy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvZGVuZ3JpZ3VhbmcvRG9jdW1lbnRzL015L3VucGx1Z2luLWVudi9zcmMvY29yZS9vcHRpb25zLnRzXCI7aW1wb3J0IHsgZGVlcE1lcmdlIH0gZnJvbSAnQGFudGZ1L3V0aWxzJ1xuaW1wb3J0IHR5cGUgeyBPcHRpb25zLCBSZXNvbHZlZE9wdGlvbnMgfSBmcm9tICcuLi90eXBlcydcblxuLy8gXHU1RjUzXHU5MTREXHU3RjZFXHU5ODc5XHU0RTNBXHU2NTcwXHU2MzZFXHU2NTcwXHU2MzZFXHU3QzdCXHU1NzhCXHU2NUY2XHVGRjBDXHU5NzAwXHU2Q0U4XHU2MTBGXHU2MkY3XHU4RDFEXHU5NUVFXHU5ODk4XG4vLyB2YXIgYSA9IHthOiAxLCBiOiAyLCBlbnY6IHsgYTogMSwgYjoyIH19O3ZhciBiID0ge2M6IDMsIGVudjoge2M6IDN9fTtjb25zb2xlLmxvZyh7Li4uYSwgLi4uYn0pXG4vLyBhOiAxXG4vLyBiOiAyXG4vLyBjOiAzXG4vLyBlbnZcbi8vIDpcbi8vIHtjOiAzfVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlc29sdmVPcHRpb25zKG9wdGlvbnM6IE9wdGlvbnMpOiBQcm9taXNlPFJlc29sdmVkT3B0aW9ucz4ge1xuICBjb25zdCBkZWZhdWx0cyA9IHtcbiAgICBlbnY6IHtcbiAgICAgIGRpcjogJ2NvbmZpZycsXG4gICAgICBmaWxlTmFtZTogJ21hbmlmZXN0LmpzJyxcbiAgICAgIGdsb2JhbE5hbWU6ICdtYW5pZmVzdCcsXG4gICAgICBzZXJ2ZTogL2RldnxkZXZlbG9wbWVudC9pLFxuICAgICAgYnVpbGQ6IC9wcm9kfHByb2R1Y3Rpb24vaSxcbiAgICB9LFxuICB9XG5cbiAgY29uc3QgbWVyZ2VPcHRpb25zID0gZGVlcE1lcmdlKGRlZmF1bHRzLCBvcHRpb25zKVxuXG4gIHJldHVybiB7XG4gICAgLi4ubWVyZ2VPcHRpb25zLFxuICAgIGRhdGU6IG5ldyBEYXRlKCkudG9TdHJpbmcoKSxcbiAgfSBhcyBSZXNvbHZlZE9wdGlvbnNcbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL2RlbmdyaWd1YW5nL0RvY3VtZW50cy9NeS91bnBsdWdpbi1lbnYvc3JjL2NvcmVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9kZW5ncmlndWFuZy9Eb2N1bWVudHMvTXkvdW5wbHVnaW4tZW52L3NyYy9jb3JlL2NvbXByZXNzLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9kZW5ncmlndWFuZy9Eb2N1bWVudHMvTXkvdW5wbHVnaW4tZW52L3NyYy9jb3JlL2NvbXByZXNzLnRzXCI7Ly8gXHU1MDQ3XHU4QkJFIE9wdGlvbnMgXHU3QzdCXHU1NzhCXHU1REYyXHU3RUNGXHU1NzI4XHU2QjY0XHU2NTg3XHU0RUY2XHU0RTJEXHU1QjlBXHU0RTQ5XG5pbXBvcnQgcHJvY2VzcyBmcm9tICdub2RlOnByb2Nlc3MnXG5pbXBvcnQgKiBhcyBjb21wcmVzc2luZyBmcm9tICdjb21wcmVzc2luZydcbmltcG9ydCB7IExvZyB9IGZyb20gJy4vbG9nJ1xuXG4vKipcbiAqIFx1NzUxRlx1NjIxMFx1NEUwMFx1NEUyQVpJUFx1NjgzQ1x1NUYwRlx1NzY4NFx1NTM4Qlx1N0YyOVx1NjU4N1x1NEVGNlx1MzAwMlxuICogQHBhcmFtIG9wdGlvbnMgXHU1MzhCXHU3RjI5XHU5MDA5XHU5ODc5XHVGRjBDXHU1MTc3XHU0RjUzXHU5MDA5XHU5ODc5XHU1M0Q2XHU1MUIzXHU0RThFIGNvbXByZXNzaW5nLnppcC5jb21wcmVzc0RpciBcdTY1MkZcdTYzMDFcdTc2ODRcdTUzQzJcdTY1NzBcdTMwMDJcbiAqIEByZXR1cm5zIFx1OEZENFx1NTZERVx1NEUwMFx1NEUyQVByb21pc2VcdUZGMENcdThCRTVQcm9taXNlXHU0RjFBXHU1NzI4XHU1MzhCXHU3RjI5XHU1QjhDXHU2MjEwXHU1NDBFXHU4OEFCXHU4OUUzXHU2NzkwXHUzMDAyXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVDb21wcmVzcyhvcHRpb25zOiBhbnkpIHtcbiAgTG9nLmxvZygnQ29tcHJlc3NpbmcgdGhlIGRpcmVjdG9yeScsIG9wdGlvbnMpXG4gIHRyeSB7XG4gICAgYXdhaXQgY29tcHJlc3NpbmcuemlwLmNvbXByZXNzRGlyKCcuL2Rpc3QnLCAnLi9kaXN0LnppcCcpXG4gICAgTG9nLnN1Y2Nlc3MoJ1N1Y2Nlc3NmdWxseSBjb21wcmVzc2VkIHRoZSBkaXJlY3RvcnknLCBvcHRpb25zKVxuICAgIHByb2Nlc3MuZXhpdCgwKVxuICB9XG4gIGNhdGNoIChlcnJvcikge1xuICAgIExvZy5lcnJvcignRXJyb3IgY29tcHJlc3NpbmcgdGhlIGRpcmVjdG9yeScsIGVycm9yKVxuICAgIHRocm93IGVycm9yIC8vIFx1NjI5Qlx1NTFGQVx1OTUxOVx1OEJFRlx1NEY5Qlx1OEMwM1x1NzUyOFx1ODAwNVx1NTkwNFx1NzQwNlxuICB9XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9kZW5ncmlndWFuZy9Eb2N1bWVudHMvTXkvdW5wbHVnaW4tZW52L3NyYy9jb3JlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvZGVuZ3JpZ3VhbmcvRG9jdW1lbnRzL015L3VucGx1Z2luLWVudi9zcmMvY29yZS9sb2cudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2RlbmdyaWd1YW5nL0RvY3VtZW50cy9NeS91bnBsdWdpbi1lbnYvc3JjL2NvcmUvbG9nLnRzXCI7aW1wb3J0IGNoYWxrIGZyb20gJ2NoYWxrJ1xuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuY29uc3QgbG9nID0gY29uc29sZS5sb2dcblxuZXhwb3J0IGNsYXNzIExvZyB7XG4gIHN0YXRpYyBsb2coa2V5OiBzdHJpbmcsIG1zZzogdW5rbm93bikge1xuICAgIGxvZyhjaGFsay5ib2xkKGAke2tleX06ICR7bXNnfWApKVxuICB9XG5cbiAgc3RhdGljIGVycm9yKGtleTogc3RyaW5nLCBtc2c6IHVua25vd24pIHtcbiAgICBsb2coY2hhbGsuYm9sZC5yZWQoYCR7a2V5fTogJHttc2d9YCkpXG4gIH1cblxuICBzdGF0aWMgc3VjY2VzcyhrZXk6IHN0cmluZywgbXNnOiB1bmtub3duKSB7XG4gICAgbG9nKGNoYWxrLmJvbGQuZ3JlZW4oYCR7a2V5fTogJHttc2d9YCkpXG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFB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QUFPO0FBQ1osUUFBSSxNQUFNLG1DQUFtQyxLQUFLO0FBQ2xELFVBQU07QUFBQSxFQUNSO0FBQ0Y7OztBSGJBLElBQU0sZUFBZTtBQUNyQixJQUFNLHVCQUF1QixLQUFLLFlBQVk7QUFFdkMsSUFBTSxrQkFBd0QsQ0FBQyxVQUFVLENBQUMsTUFBTTtBQUNyRixRQUFNLFdBQVcsZUFBZSxPQUFPO0FBQ3ZDLFNBQU8sQ0FBQztBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBLElBQ1AsU0FBUztBQUFBLElBQ1QsTUFBTSxVQUFVLElBQUk7QUFDbEIsVUFBSSxHQUFHLFdBQVcsWUFBWTtBQUM1QixlQUFPO0FBQUEsSUFDWDtBQUFBLElBQ0EsTUFBTSxLQUFLLElBQUk7QUFDYixVQUFJLEdBQUcsV0FBVyxvQkFBb0IsR0FBRztBQUN2QyxjQUFNLFNBQVMsTUFBTTtBQUNyQixjQUFNLEVBQUUsS0FBSyxJQUFJLE1BQU0sZUFBZSxRQUFRLE9BQU87QUFFckQsYUFBSyxhQUFhLEVBQUU7QUFFcEIsZUFBTztBQUFBLE1BQ1Q7QUFBQSxJQUNGO0FBQUEsRUFDRixHQUFHO0FBQUEsSUFDRCxNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsSUFDUCxTQUFTO0FBQUEsSUFDVCxVQUFVLElBQUk7QUFDWixVQUFJLEdBQUcsV0FBVyxZQUFZO0FBQzVCLGVBQU87QUFBQSxJQUNYO0FBQUEsSUFDQSxNQUFNLEtBQUssSUFBSTtBQUNiLFlBQU0sU0FBUyxNQUFNO0FBQ3JCLFlBQU0sRUFBRSxNQUFNLE9BQU8sSUFBSSxNQUFNLGVBQWUsUUFBUSxPQUFPO0FBQzdELFVBQUksR0FBRyxXQUFXLG9CQUFvQixHQUFHO0FBQ3ZDLGFBQUssU0FBUyxJQUFJO0FBQ2xCLGVBQU87QUFBQSxNQUNUO0FBQ0EsVUFBSSxHQUFHLFNBQVMsT0FBTyxHQUFHO0FBQ3hCLFlBQUksT0FBTyxNQUFNQyxJQUFHLFNBQVMsSUFBSSxNQUFNO0FBQ3ZDLGVBQU8sS0FBSyxRQUFRLGNBQWMsTUFBTTtBQUN4QyxlQUFPO0FBQUEsVUFDTDtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBRUEsYUFBTztBQUFBLElBQ1Q7QUFBQSxJQUNBLFVBQVUsTUFBTTtBQUNkLE1BQUFDLFNBQVEsR0FBRyxjQUFjLFlBQVk7QUFDbkMsY0FBTSxlQUFlLENBQUMsQ0FBQztBQUFBLE1BQ3pCLENBQUM7QUFBQSxJQUNIO0FBQUEsRUFDRixDQUFDO0FBQ0g7OztBRDNEQSxJQUFPLGVBQVEsaUJBQWlCLGVBQWU7OztBREMvQyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxRQUFRO0FBQUEsSUFDUixhQUFTO0FBQUEsRUFDWDtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbImZzIiwgInByb2Nlc3MiLCAiZGVlcE1lcmdlIiwgImRlZXBNZXJnZSIsICJwcm9jZXNzIiwgInByb2Nlc3MiLCAiZnMiLCAicHJvY2VzcyJdCn0K
