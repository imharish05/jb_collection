const fs = require('fs');
const path = require('path');

const dirsToWalk = [
  path.join(__dirname, 'Client', 'src'),
  path.join(__dirname, 'Admin', 'src'),
  path.join(__dirname, 'Client', 'public'),
  path.join(__dirname, 'Admin', 'public')
];

// Patterns to replace in file contents
const replacements = [
  // 1. Google Fonts url links (link tags and CSS imports)
  {
    pattern: /family=Noto\+Serif:ital,wght@0,100\.\.900;1,100\.\.900/gi,
    replacement: "family=Montserrat:ital,wght@0,100..900;1,100..900"
  },
  {
    pattern: /family=Noto\+Serif[^"'\s&]*/gi,
    replacement: "family=Montserrat:ital,wght@0,100..900;1,100..900"
  },
  {
    pattern: /family=Playfair\+Display[^"'\s&]*/gi,
    replacement: "family=Montserrat:ital,wght@0,100..900;1,100..900"
  },
  {
    pattern: /family=Bodoni\+Moda[^"'\s&]*/gi,
    replacement: "family=Montserrat:ital,wght@0,100..900;1,100..900"
  },
  // 2. CSS font-family rules
  {
    pattern: /font-family:\s*['"]?Noto Serif['"]?\s*,\s*serif\b;?/gi,
    replacement: "font-family: 'Montserrat', sans-serif;"
  },
  {
    pattern: /font-family:\s*['"]?Playfair Display['"]?\s*,\s*serif\b;?/gi,
    replacement: "font-family: 'Montserrat', sans-serif;"
  },
  {
    pattern: /font-family:\s*['"]?Playfair Display['"]?\s*,\s*['"]?Georgia['"]?\s*,\s*serif\b;?/gi,
    replacement: "font-family: 'Montserrat', sans-serif;"
  },
  {
    pattern: /font-family:\s*['"]?Inter['"]?\s*,\s*sans-serif\b;?/gi,
    replacement: "font-family: 'Montserrat', sans-serif;"
  },
  {
    pattern: /font-family:\s*['"]?Rubik['"]?\s*,\s*sans-serif\b;?/gi,
    replacement: "font-family: 'Montserrat', sans-serif;"
  },
  // 3. JS inline font-family properties
  {
    pattern: /fontFamily:\s*["']'Noto Serif',\s*serif["']/g,
    replacement: "fontFamily: \"'Montserrat', sans-serif\""
  },
  {
    pattern: /fontFamily:\s*["']Noto Serif,\s*serif["']/g,
    replacement: "fontFamily: \"'Montserrat', sans-serif\""
  },
  {
    pattern: /fontFamily:\s*["']'Inter',\s*sans-serif["']/g,
    replacement: "fontFamily: \"'Montserrat', sans-serif\""
  },
  {
    pattern: /fontFamily:\s*["']Inter,\s*sans-serif["']/g,
    replacement: "fontFamily: \"'Montserrat', sans-serif\""
  },
  {
    pattern: /fontFamily:\s*["']'Playfair Display',\s*serif["']/g,
    replacement: "fontFamily: \"'Montserrat', sans-serif\""
  },
  {
    pattern: /fontFamily:\s*["']Playfair Display,\s*serif["']/g,
    replacement: "fontFamily: \"'Montserrat', sans-serif\""
  }
];

function walk(currentDir) {
  const files = fs.readdirSync(currentDir);
  for (const file of files) {
    const fullPath = path.join(currentDir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else {
      const ext = path.extname(fullPath);
      if (['.css', '.jsx', '.js', '.module.css', '.html'].includes(ext)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let modified = false;

        replacements.forEach(({ pattern, replacement }) => {
          if (content.match(pattern)) {
            content = content.replace(pattern, replacement);
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
