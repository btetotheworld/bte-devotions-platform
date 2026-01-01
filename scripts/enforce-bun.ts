#!/usr/bin/env node

const userAgent = process.env.npm_config_user_agent || "";

if (!userAgent.includes("bun")) {
  console.error(`
❌ This project uses Bun exclusively.

Detected: ${userAgent}

Please install Bun (>= 1.1.0):
👉 https://bun.sh

Then run:
👉 bun install
`);
  process.exit(1);
}

const match = userAgent.match(/bun\/([0-9]+\.[0-9]+\.[0-9]+)/);

if (!match) {
  console.error("❌ Unable to detect Bun version.");
  process.exit(1);
}

const current = match[1];
const required = "1.1.0";

const isValid = (a: string, b: string) =>
  a.split(".").map(Number).reduce((r, v, i) => {
    if (r !== 0) return r;
    return v - b.split(".").map(Number)[i];
  }, 0) >= 0;

if (!isValid(current, required)) {
  console.error(`
❌ Bun version too old.

Required: >= ${required}
Detected: ${current}

Please upgrade Bun:
👉 bun upgrade
`);
  process.exit(1);
}

