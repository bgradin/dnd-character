const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

function generateManifest(directory = path.resolve(__dirname, '../public/data')) {
  fs.mkdirSync(directory, { recursive: true });
  const files = {};

  function visit(folder, prefix = '') {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true }).sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
      const relative = prefix + entry.name;
      const filename = path.join(folder, entry.name);
      if (entry.isDirectory()) {
        if (relative !== 'audit') visit(filename, `${relative}/`);
      }
      else if (entry.isFile() && relative !== 'manifest.json') {
        const content = fs.readFileSync(filename);
        Object.defineProperty(files, relative, {
          value: {
            sha256: createHash('sha256').update(content).digest('hex'),
            size: content.length,
          }, enumerable: true,
        });
      }
    }
  }

  visit(directory);
  const manifest = { schemaVersion: 1, files };
  fs.writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

if (require.main === module) generateManifest();
module.exports = { generateManifest };
