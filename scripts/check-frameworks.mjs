// Proves the claim in the README: the packed package works as a tag in React, Vue, Svelte, Angular and a
// plain page, with nothing for the consumer to configure. It packs the package, makes a small project for
// each in a scratch folder, installs the tarball and each framework's own tools there (never here: the
// package has no dependencies), and builds it. Then it opens each built page in Chromium and WebKit, taps
// level 1 at 5×5 until every piece faces as its stored answer says, and checks that the page's own framework
// heard the `suido-solve` event and was handed that answer. The components are the ones the README shows.
//
//   pnpm test:frameworks [scratch folder]        (SUIDO_FRAMEWORKS=vue,react for some of them)
//
// Run it before a release that names a framework. It needs the network and a few minutes.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
import process from "node:process";

import { chromium, webkit } from "@playwright/test";

import { newGame, quartersBetween } from "../dist/index.js";
import { levelAnswer, levelSolution, loadSuidoLevels } from "../dist/levels.js";

const root = resolve(process.argv[2] ?? mkdtempSync(join(tmpdir(), "suido-frameworks-")));
rmSync(root, { recursive: true, force: true });
mkdirSync(root, { recursive: true });
const run = (cwd, command, args) => execFileSync(command, args, { cwd, stdio: "pipe", shell: process.platform === "win32", env: { ...process.env, NG_CLI_ANALYTICS: "false" } }).toString();
const write = (dir, files) => {
  for (const [name, text] of Object.entries(files)) {
    mkdirSync(join(dir, name, ".."), { recursive: true });
    writeFileSync(join(dir, name), typeof text === "string" ? text : JSON.stringify(text, null, 2));
  }
};

run(process.cwd(), "npm", ["pack", "--ignore-scripts", "--pack-destination", root]);
const tarball = join(root, readdirSync(root).find((name) => name.endsWith(".tgz")));
const suido = `file:${tarball}`;
const page = (script) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>suido</title><style>body{margin:12px;max-width:360px}</style></head><body><div id="app"></div>${script}</body></html>`;

const projects = {
  vue: {
    out: "dist",
    files: {
      "package.json": { name: "check-vue", private: true, type: "module", dependencies: { "@johnmorrisdotca/suido": suido, vue: "^3.5.0" }, devDependencies: { vite: "^7.0.0", "@vitejs/plugin-vue": "^6.0.0" } },
      "vite.config.js": `import vue from "@vitejs/plugin-vue";\nexport default { base: "./", plugins: [vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith("suido-") } } })] };\n`,
      "index.html": page(`<script type="module" src="/src/main.js"></script>`),
      "src/main.js": `import { createApp } from "vue";\nimport App from "./App.vue";\ncreateApp(App).mount("#app");\n`,
      "src/App.vue": `<script setup>
import { ref } from "vue";
import "@johnmorrisdotca/suido/element/define";

const status = ref("waiting");
</script>

<template>
  <suido-board size="5x5" level="1" @suido-solve="(event) => (status = 'solved ' + event.detail.code)" />
  <p id="status">{{ status }}</p>
</template>
`,
    },
  },
  svelte: {
    out: "dist",
    files: {
      "package.json": { name: "check-svelte", private: true, type: "module", dependencies: { "@johnmorrisdotca/suido": suido, svelte: "^5.0.0" }, devDependencies: { vite: "^7.0.0", "@sveltejs/vite-plugin-svelte": "^6.0.0" } },
      "vite.config.js": `import { svelte } from "@sveltejs/vite-plugin-svelte";\nexport default { base: "./", plugins: [svelte()] };\n`,
      "index.html": page(`<script type="module" src="/src/main.js"></script>`),
      "src/main.js": `import { mount } from "svelte";\nimport App from "./App.svelte";\nmount(App, { target: document.getElementById("app") });\n`,
      "src/App.svelte": `<script>
  import "@johnmorrisdotca/suido/element/define";
  let status = $state("waiting");
  let board;
  $effect(() => {
    const listen = (event) => (status = "solved " + event.detail.code);
    board.addEventListener("suido-solve", listen);
    return () => board.removeEventListener("suido-solve", listen);
  });
</script>

<suido-board bind:this={board} size="5x5" level="1"></suido-board>
<p id="status">{status}</p>
`,
    },
  },
  angular: {
    out: "dist/check-angular/browser",
    files: {
      "package.json": {
        name: "check-angular",
        private: true,
        dependencies: { "@johnmorrisdotca/suido": suido, "@angular/common": "^20.0.0", "@angular/compiler": "^20.0.0", "@angular/core": "^20.0.0", "@angular/platform-browser": "^20.0.0", rxjs: "^7.8.0", tslib: "^2.8.0" },
        devDependencies: { "@angular/build": "^20.0.0", "@angular/cli": "^20.0.0", "@angular/compiler-cli": "^20.0.0", typescript: "~5.8.0" },
      },
      "angular.json": {
        version: 1,
        projects: {
          "check-angular": {
            projectType: "application",
            root: "",
            sourceRoot: "src",
            architect: { build: { builder: "@angular/build:application", options: { outputPath: "dist/check-angular", index: "src/index.html", browser: "src/main.ts", tsConfig: "tsconfig.json", baseHref: "./" }, configurations: { production: {} }, defaultConfiguration: "production" } },
          },
        },
      },
      "tsconfig.json": { compilerOptions: { target: "ES2022", module: "ES2022", moduleResolution: "bundler", strict: true, experimentalDecorators: true, skipLibCheck: true, lib: ["ES2022", "dom"] }, files: ["src/main.ts"] },
      "src/index.html": page(`<check-root></check-root>`),
      "src/main.ts": `import { Component, CUSTOM_ELEMENTS_SCHEMA, provideZonelessChangeDetection, signal } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import "@johnmorrisdotca/suido/element/define";

@Component({
  selector: "check-root",
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: \`
    <suido-board size="5x5" level="1" (suido-solve)="solved($event)"></suido-board>
    <p id="status">{{ status() }}</p>
  \`,
})
class App {
  status = signal("waiting");
  solved(event: Event) {
    this.status.set("solved " + (event as CustomEvent).detail.code);
  }
}

bootstrapApplication(App, { providers: [provideZonelessChangeDetection()] });
`,
    },
  },
  react: {
    out: "dist",
    files: {
      "package.json": { name: "check-react", private: true, type: "module", dependencies: { "@johnmorrisdotca/suido": suido, react: "^19.0.0", "react-dom": "^19.0.0" }, devDependencies: { vite: "^7.0.0", "@vitejs/plugin-react": "^5.0.0" } },
      "vite.config.js": `import react from "@vitejs/plugin-react";\nexport default { base: "./", plugins: [react()] };\n`,
      "index.html": page(`<script type="module" src="/src/main.jsx"></script>`),
      "src/Level.jsx": `import { useEffect, useRef, useState } from "react";
import "@johnmorrisdotca/suido/element/define";

export function Level() {
  const board = useRef(null);
  const [status, setStatus] = useState("waiting");
  useEffect(() => {
    const listen = (event) => setStatus("solved " + event.detail.code);
    board.current?.addEventListener("suido-solve", listen);
    return () => board.current?.removeEventListener("suido-solve", listen);
  }, []);
  return (
    <>
      <suido-board ref={board} size="5x5" level="1" />
      <p id="status">{status}</p>
    </>
  );
}
`,
      "src/main.jsx": `import { createRoot } from "react-dom/client";
import { Level } from "./Level.jsx";

createRoot(document.getElementById("app")).render(<Level />);
`,
    },
  },
  // No framework and no bundler: a script tag and the files as they are published.
  plain: {
    out: ".",
    build: (dir) => run(dir, "npm", ["install", "--no-audit", "--no-fund", "--ignore-scripts", "--install-links"]),
    files: {
      "package.json": { name: "check-plain", private: true, dependencies: { "@johnmorrisdotca/suido": suido } },
      "index.html": page(`<suido-board size="5x5" level="1"></suido-board>
<p id="status">waiting</p>
<script type="module" src="./node_modules/@johnmorrisdotca/suido/dist/element-define.js"></script>
<script type="module">
  document.querySelector("suido-board").addEventListener("suido-solve", (event) => {
    document.getElementById("status").textContent = "solved " + event.detail.code;
  });
</script>`),
    },
  },
};

const only = process.env.SUIDO_FRAMEWORKS?.split(",");
const built = [];
for (const [name, project] of Object.entries(projects)) {
  if (only !== undefined && !only.includes(name)) continue;
  const dir = join(root, name);
  write(dir, project.files);
  const started = Date.now();
  try {
    if (project.build !== undefined) project.build(dir);
    else {
      run(dir, "npm", ["install", "--no-audit", "--no-fund"]);
      run(dir, "npx", name === "angular" ? ["ng", "build"] : ["vite", "build"]);
    }
    if (!existsSync(join(dir, project.out, "index.html"))) throw new Error(`no index.html in ${project.out}`);
    built.push([name, join(dir, project.out)]);
    console.log(`built   ${name.padEnd(8)} in ${Math.round((Date.now() - started) / 1000)} s`);
  } catch (error) {
    console.log(`FAILED  ${name}: ${String(error.stderr ?? error.stdout ?? error.message).split("\n").slice(-12).join("\n")}`);
    process.exitCode = 1;
  }
}

// The level the taps must solve: 5×5, level 1, every piece turned to face as its stored answer says.
const row = (await loadSuidoLevels("5x5"))[0];
const solution = levelSolution(row);
const game = newGame(row[0]);
const want = `solved ${levelAnswer(row)}`;

// Open each built page, draw the answer, and read what the framework says.
const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json" };
for (const [engine, launcher] of [["chromium", chromium], ["webkit", webkit]]) {
  const browser = await launcher.launch();
  for (const [name, out] of built) {
    const context = await browser.newContext({ viewport: { width: 390, height: 800 } });
    const tab = await context.newPage();
    const errors = [];
    tab.on("pageerror", (error) => errors.push(String(error)));
    await tab.route("http://check.test/**", (route) => {
      let file = join(out, decodeURIComponent(new URL(route.request().url()).pathname));
      if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
      if (!existsSync(file)) return route.fulfill({ status: 404, body: "" });
      return route.fulfill({ body: readFileSync(file), contentType: types[extname(file)] ?? "application/octet-stream" });
    });
    await tab.goto("http://check.test/");
    let got = "nothing";
    try {
      await tab.locator("suido-board .sd-cell").first().waitFor({ timeout: 10000 });
      for (let index = 0; index < game.masks.length; index += 1) {
        for (let n = quartersBetween(game.masks[index], solution[index]) ?? 0; n > 0; n -= 1) await tab.locator(`suido-board .sd-cell[data-cell="${index}"]`).click();
      }
      await tab.waitForFunction((text) => document.querySelector("#status")?.textContent === text, want, { timeout: 5000 });
      got = await tab.locator("#status").textContent();
    } catch {
      got = (await tab.locator("#status").textContent().catch(() => null)) ?? "nothing";
    }
    const ok = errors.length === 0 && got.trim() === want;
    console.log(`${ok ? "played " : "FAILED "} ${name.padEnd(8)} in ${engine}: the page says “${got.trim()}”; the stored answer says “${want}”${errors.length > 0 ? ` ${errors.join("; ")}` : ""}`);
    if (!ok) process.exitCode = 1;
    await context.close();
  }
  await browser.close();
}
console.log(`scratch projects are in ${root}`);
