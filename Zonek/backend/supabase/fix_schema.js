const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'schema.sql');
let sql = fs.readFileSync(schemaPath, 'utf8');

const lines = sql.split('\n');
const newLines = [];

for (const line of lines) {
  if (line.trim().startsWith('CREATE POLICY')) {
    // Extract policy name and table name using \s+ to match one or more spaces
    const match = line.match(/CREATE POLICY\s+"([^"]+)"\s+ON\s+(\w+)/);
    if (match) {
      newLines.push(`DROP POLICY IF EXISTS "${match[1]}" ON ${match[2]};`);
    } else {
      const matchNoQuotes = line.match(/CREATE POLICY\s+([^\s]+)\s+ON\s+(\w+)/);
      if (matchNoQuotes) {
        newLines.push(`DROP POLICY IF EXISTS ${matchNoQuotes[1]} ON ${matchNoQuotes[2]};`);
      }
    }
  }
  newLines.push(line);
}

fs.writeFileSync(schemaPath, newLines.join('\n'));
console.log('Modified schema.sql to include DROP POLICY IF EXISTS before every CREATE POLICY (fixed regex).');
