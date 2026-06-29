const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src');
const publicDir = path.join(__dirname, 'public');

const searchStr1 = /JB House of Fashion/gi;
const searchStr2 = /Kamali Gift Factory/gi;
const searchStr3 = /Kamali Gift/gi;

const replaceStr = "JB House of Fashion";

function walk(currentDir) {
  const files = fs.readdirSync(currentDir);
  for (const file of files) {
    const fullPath = path.join(currentDir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else {
      if (['.js', '.jsx', '.json', '.html', '.css', '.md'].includes(path.extname(fullPath))) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let modified = false;

        if (content.match(searchStr2)) {
          content = content.replace(searchStr2, replaceStr);
          modified = true;
        }
        if (content.match(searchStr1)) {
          content = content.replace(searchStr1, replaceStr);
          modified = true;
        }
        if (content.match(searchStr3)) {
          content = content.replace(searchStr3, replaceStr);
          modified = true;
        }

        if (modified) {
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`Updated ${fullPath}`);
        }
      }
    }
  }
}

walk(dir);
walk(publicDir);
console.log("Done replacing brand name.");
