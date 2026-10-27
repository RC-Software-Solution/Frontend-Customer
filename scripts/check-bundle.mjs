import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const FORBIDDEN = [
  [/192\.168\.\d{1,3}\.\d{1,3}/, "LAN IP address"],
  [/127\.0\.0\.1/, "dev API host fallback"],
  [/\[API_CLIENT\]/, "debug log that release builds must strip"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "private key"],
];

const [dir = "dist", expected] = process.argv.slice(2);

const walk = (d) =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const bundles = walk(dir).filter((p) => /\.(js|hbc|bundle|jsbundle)$/.test(p));
if (!bundles.length) {
  console.error(`no .js, .hbc, .bundle or .jsbundle file under ${dir}`);
  process.exit(1);
}

const problems = [];
let sawExpected = !expected;
for (const file of bundles) {
  const buf = readFileSync(file);
  // latin1 keeps every byte: Hermes bytecode (.hbc) stores ASCII strings verbatim,
  // but any string with a non-Latin-1 character (e.g. an emoji) as UTF-16LE at either byte alignment
  const texts = [buf.toString("latin1"), buf.toString("utf16le"), buf.subarray(1).toString("utf16le")];
  for (const [re, what] of FORBIDDEN)
    if (texts.some((t) => re.test(t))) problems.push(`${file}: ${what} (${re})`);
  if (expected && texts.some((t) => t.includes(expected))) sawExpected = true;
}
if (!sawExpected) problems.push(`the API URL ${expected} is in no bundle: EXPO_PUBLIC_API_URL was not inlined`);

problems.forEach((p) => console.error(p));
console.log(problems.length ? `${problems.length} problem(s)` : `bundle clean (${bundles.length} file(s))`);
process.exit(problems.length ? 1 : 0);
