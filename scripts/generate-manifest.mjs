import { readFile, readdir, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const root = "files";
const sections = {
  "physics-questions": "physics/questions",
  "physics-summaries": "physics/summaries",
  "physics-exams": "physics/exams",
  "chemistry-questions": "chemistry/questions",
  "chemistry-summaries": "chemistry/summaries",
  "chemistry-exams": "chemistry/exams",
};

const manifest = {};
for (const [id, folder] of Object.entries(sections)) {
  const directory = join(root, folder);
  let entries = [];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  manifest[id] = entries
    .filter((entry) => entry.isFile() && entry.name !== ".gitkeep")
    .sort((a, b) => a.name.localeCompare(b.name, "ar"))
    .map((entry) => ({
      name: entry.name,
      path: relative(".", join(directory, entry.name)).split(sep).join("/"),
    }));
}

const manifestJson = JSON.stringify(manifest, null, 2);
await writeFile(join(root, "manifest.json"), `${manifestJson}\n`, "utf8");

try {
  const indexPath = "index.html";
  const index = await readFile(indexPath, "utf8");
  const embeddedManifest = JSON.stringify(manifest);
  const updatedIndex = index.replace(
    /(<script type="application\/json" id="resource-manifest">)[\s\S]*?(<\/script>)/,
    `$1${embeddedManifest}$2`,
  );
  await writeFile(indexPath, updatedIndex, "utf8");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
