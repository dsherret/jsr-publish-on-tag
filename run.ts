import * as jsonc from "jsonc-parser";
import * as semver from "@std/semver";

/**
 * Runs the publish-on-tag task with the specified context.
 */
export function run(context: {
  args: string[];
  env: Record<string, string | undefined>;
  log: (...args: unknown[]) => void;
  exit: (code: number) => void;
  fileExists: (path: string) => boolean;
  readFile: (path: string) => string;
  writeFile: (path: string, newText: string) => void;
  spawn: (command: string, args: string[]) => void;
  userAgent: string;
}) {
  const tagName = getTagName();
  if (tagName == null) {
    context.log("No tag found.");
    return;
  }

  const versionStr = tagName.replace(/^v/, "");
  if (!semver.canParse(versionStr)) {
    context.log(`Could not parse tag as version: ${tagName}`);
    return;
  }

  // todo: use https://github.com/denoland/deno/issues/22663 once landed
  // in deno in order to specify the version via a cli flag
  if (!trySetInConfigFile(versionStr)) {
    context.log("No deno.json(c) or jsr.json(c) found.");
    context.exit(2);
    return;
  }

  // now publish
  const publishArgs = ["publish", ...context.args];
  if (context.userAgent.startsWith("Deno/")) {
    publishArgs.splice(0, 0, "deno");
  } else {
    publishArgs.splice(0, 0, "npx", "jsr");
  }
  context.spawn(publishArgs[0], publishArgs.slice(1));

  function getTagName() {
    const githubRef = context.env.GITHUB_REF;
    if (githubRef && githubRef.startsWith("refs/tags/")) {
      return githubRef.replace("refs/tags/", "");
    } else {
      return undefined;
    }
  }

  function trySetInConfigFile(version: string) {
    for (
      const fileName of ["deno.json", "deno.jsonc", "jsr.json", "jsr.jsonc"]
    ) {
      if (context.fileExists(fileName)) {
        setVersionInConfig(fileName, version);
        return true;
      }
    }
    return false;
  }

  function setVersionInConfig(fileName: string, version: string) {
    context.log(`Setting version to ${version} in ${fileName}`);
    const file = context.readFile(fileName);
    const edits = jsonc.modify(file, ["version"], version, {});
    const newText = jsonc.applyEdits(file, edits);
    context.writeFile(fileName, newText);

    // prevent needing to provide --allow-dirty and still error for other changes
    context.spawn("git", ["add", fileName]);
    context.spawn("git", ["commit", "-m", versionStr]);
  }
}
