import cp from "node:child_process";
import fs from "node:fs";
import process from "node:process";
import * as jsonc from "jsonc-parser";
import * as semver from "@std/semver";

if (import.meta.main) {
  run({
    env: process.env,
    log: console.error,
    exit: process.exit,
    fileExists(path: string) {
      return fs.existsSync(path);
    },
    readFile(path: string) {
      return fs.readFileSync(path, "utf8");
    },
    writeFile(path: string, newText: string) {
      fs.writeFileSync(path, newText, "utf8");
    }
  });
}

export function run(context: {
  env: Record<string, string | undefined>,
  log: (...args: unknown[]) => void,
  exit: (code: number) => void,
  fileExists: (path: string) => boolean,
  readFile: (path: string) => string,
  writeFile: (path: string, newText: string) => void,
}) {
  const tagName = getTagName();
  if (tagName == null) {
    context.log("No tag found.");
    return;
  }

  const versionStr = tagName.replace(/^v/, '');
  if (!semver.canParse(versionStr)) {
    context.log(`Could not parse tag as version: ${tagName}`);
    return;
  }

  if (context.fileExists("deno.json")) {
    setVersionInConfig("deno.json", versionStr);
  } else if (context.fileExists("deno.jsonc")) {
    setVersionInConfig("deno.jsonc", versionStr);
  } else {
    context.log("No deno.json or deno.jsonc found.");
    return;
  }

  function getTagName() {
    const githubRef = context.env.GITHUB_REF;
    if (githubRef && githubRef.startsWith('refs/tags/')) {
      return githubRef.replace('refs/tags/', '');
    } else {
      return undefined;
    }
  }

  function setVersionInConfig(fileName: string, version: string) {
    const file = context.readFile(fileName);
    const edits = jsonc.modify(file, ["version"], version, {});
    const newText = jsonc.applyEdits(file, edits);
    context.writeFile(fileName, newText);
  }
}