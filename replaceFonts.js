const fs = require('fs');
const path = require('path');

const dirsToWalk = [
  path.join(__dirname, 'Client', 'src'),
  path.join(__dirname, 'Admin', 'src')
];

const fontRegexes = [
  /font-family:\s*['"]?Inter['"]?\s*,\s*sans-serif;/g,
  /font-family:\s*['"]?Playfair Display['"]?\s*,\s*serif;/g,
  /font-family:\s*['"]?Playfair Display['"]?\s*,\s*['"]?Georgia['"]?\s*,\s*serif;/g,
  /font-family:\s*['"]?Rubik['"]?\s*,\s*sans-serif;/g,
  /font-family:\s*['"]?Noto Serif['"]?\s*,\s*serif;/gi // to catch lowercase/uppercase inconsistencies if any
];

const replacement = "font-family: 'Noto Serif', serif;";

function walk(currentDir) {
  const files = fs.readdirSync(currentDir);
  for (const file of files) {
    const fullPath = path.join(currentDir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else {
      if (['.css', '.jsx', '.js', '.module.css'].includes(path.extname(fullPath))) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let modified = false;

        fontRegexes.forEach(regex => {
          if (content.match(regex)) {
            content = content.replace(regex, replacement);
            modified = true;
          }
        });

        if (modified) {
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`Updated fonts in ${fullPath}`);
        }
      }
    }
  }
}

dirsToWalk.forEach(d => {
  if (fs.existsSync(d)) {
    walk(d);
  }
});
console.log("Done replacing fonts.");
