import cp from "node:child_process";
import fs from "node:fs";
import process from "node:process";
import { run } from "./run.ts";

run({
  args: process.argv.slice(2),
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
  },
  spawn(command, args) {
    console.error(`$ ${command} ${args.join(" ")}`);
    const result = cp.spawnSync(command, args, { stdio: "inherit" });
    if (result.status != null && result.status != 0) {
      process.exit(result.status);
    }
  },
  userAgent: navigator.userAgent,
});
