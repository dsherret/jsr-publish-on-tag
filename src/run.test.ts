import { run } from "./run.ts";
import { assertEquals } from "@std/assert/equals";

Deno.test("should work with different config file names", async (t) => {
  for (const fileName of ["deno.json", "deno.jsonc", "jsr.json", "jsr.jsonc"]) {
    await t.step(fileName, () => {
      const actions: unknown[] = [];
      const files: Record<string, string> = {
        [fileName]: `{
  "name": "@scope/pkg",
  "version": "1.2.2"
}`,
      };
      runTest({ files, actions });
      assertEquals(actions, [{
        kind: "spawn",
        command: ["deno", "publish", "--set-version", "1.2.3"],
      }]);
      assertEquals(files, {
        // doesn't change because the version is set on the command line
        [fileName]: `{
  "name": "@scope/pkg",
  "version": "1.2.2"
}`,
      });
    });
  }
});

Deno.test("should provide custom commands and use `npx jsr` when in Node", () => {
  const actions: unknown[] = [];
  const files: Record<string, string> = {
    "deno.json": `{
  "name": "@scope/pkg"
}`,
  };
  runTest({ files, actions, userAgent: "Node.js/21", args: ["--dry-run"] });
  assertEquals(actions, [{
    kind: "spawn",
    command: ["npx", "jsr", "publish", "--set-version", "1.2.3", "--dry-run"],
  }]);
  assertEquals(files, {
    "deno.json": `{
  "name": "@scope/pkg"
}`,
  });
});

Deno.test("should exit no tag", () => {
  const actions: unknown[] = [];
  const files: Record<string, string> = {
    "deno.json": `{
  "name": "@scope/pkg",
  "version": "1.2.2"
}`,
  };
  runTest({ files, actions, env: {} });
  assertEquals(actions, [{
    kind: "log",
    args: ["No tag found. Running dry publish..."],
  }, {
    kind: "spawn",
    command: ["deno", "publish", "--dry-run"],
  }]);
  assertEquals(files, {
    "deno.json": `{
  "name": "@scope/pkg",
  "version": "1.2.2"
}`,
  });
});

Deno.test("should exit failed parse tag", () => {
  const actions: unknown[] = [];
  const files: Record<string, string> = {
    "deno.json": `{
  "name": "@scope/pkg",
  "version": "1.2.2"
}`,
  };
  runTest({
    files,
    actions,
    env: {
      GITHUB_REF: "refs/tags/vasdfasdf4325151235",
    },
  });
  assertEquals(actions, [{
    kind: "log",
    args: ["Could not parse tag as version: vasdfasdf4325151235"],
  }]);
  assertEquals(files, {
    "deno.json": `{
  "name": "@scope/pkg",
  "version": "1.2.2"
}`,
  });
});

function runTest(opts: {
  files: Record<string, string>;
  actions: unknown[];
  args?: string[];
  userAgent?: string;
  env?: Record<string, string>;
}) {
  run({
    args: opts.args ?? [],
    env: opts.env ?? {
      "GITHUB_REF": "refs/tags/v1.2.3",
    },
    log(...args) {
      opts.actions.push({
        kind: "log",
        args,
      });
    },
    exit(code) {
      opts.actions.push({
        kind: "exit",
        code,
      });
    },
    fileExists(path) {
      return opts.files[path] != null;
    },
    readFile(path) {
      return opts.files[path]!;
    },
    writeFile(path, newText) {
      opts.files[path] = newText;
    },
    spawn(name, args) {
      opts.actions.push({
        kind: "spawn",
        command: [name, ...args],
      });
    },
    userAgent: opts.userAgent ?? "Deno/1.0.0",
  });
}
