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
    context.log("No tag found. Running dry publish...");
    runDenoPublishWithArgs(["--set-version", "0.0.0", "--dry-run", ...context.args]);
    return;
  }

  const versionStr = tagName.replace(/^v/, "");
  if (!semver.canParse(versionStr)) {
    context.log(`Could not parse tag as version: ${tagName}`);
    return;
  }

  // now publish
  runDenoPublishWithArgs(["--set-version", versionStr, ...context.args]);

  function runDenoPublishWithArgs(args: string[]) {
    const publishArgs = ["publish", ...args];
    if (context.userAgent.startsWith("Deno/")) {
      publishArgs.splice(0, 0, "deno");
    } else {
      publishArgs.splice(0, 0, "npx", "jsr");
    }
    context.spawn(publishArgs[0], publishArgs.slice(1));
  }

  function getTagName() {
    const githubRef = context.env.GITHUB_REF;
    if (githubRef && githubRef.startsWith("refs/tags/")) {
      return githubRef.replace("refs/tags/", "");
    } else {
      return undefined;
    }
  }
}
