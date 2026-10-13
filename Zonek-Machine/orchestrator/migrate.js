const fs = require('fs');
const path = require('path');

const srcDirs = [path.join(__dirname, 'src'), path.join(__dirname, 'scratch')];

function walk(dir) {
    if (!fs.existsSync(dir)) return [];
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.js')) {
            results.push(file);
        }
    });
    return results;
}

const jsFiles = [...walk(srcDirs[0]), ...walk(srcDirs[1])];

jsFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Remove 'use strict'
    content = content.replace(/'use strict';\n?/g, '');

    // Replace: const { a, b } = require('module'); -> import { a, b } from 'module';
    content = content.replace(/const\s+\{\s*([^}]+)\s*\}\s*=\s*require\((['"])(.*?)\2\);/g, "import { $1 } from '$3';");

    // Replace: const a = require('module'); -> import a from 'module';
    content = content.replace(/const\s+([A-Za-z0-9_]+)\s*=\s*require\((['"])(.*?)\2\);/g, "import $1 from '$3';");

    // Replace: require('dotenv').config(...) -> import * as dotenv from 'dotenv'; dotenv.config(...)
    if (content.includes("require('dotenv')")) {
        content = content.replace(/require\('dotenv'\)\.config\((.*?)\);/g, "import * as dotenv from 'dotenv';\ndotenv.config($1);");
    }

    // Replace: module.exports = class X... -> export default class X... (if not already handled)
    content = content.replace(/module\.exports\s*=\s*class\s+([A-Za-z0-9_]+)/g, "export default class $1");

    // Replace: module.exports = new X(); -> export default new X();
    content = content.replace(/module\.exports\s*=\s*new\s+([A-Za-z0-9_]+)\(\);/g, "export default new $1();");

    // Replace: module.exports = { a, b } -> export { a, b }
    content = content.replace(/module\.exports\s*=\s*\{([^}]+)\};/g, "export { $1 };");

    // Replace: module.exports = X -> export default X
    content = content.replace(/module\.exports\s*=\s*([A-Za-z0-9_]+);/g, "export default $1;");
    
    // Fix mongoose.model for TS
    content = content.replace(/module\.exports\s*=\s*mongoose\.model/g, "export default mongoose.model");

    // Write to .ts
    const tsFile = file.replace(/\.js$/, '.ts');
    fs.writeFileSync(tsFile, content, 'utf8');

    // Delete .js
    fs.unlinkSync(file);
});

console.log('Migrated files to TS');
