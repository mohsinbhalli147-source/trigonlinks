// This script replaces all alert() calls in page files with toast equivalents.
// Run from d:/trigonlinks-erp/frontend with: node scripts/fix-alerts.mjs

import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const pagesDir = './src/pages';
const files = readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

const toastImport = "import { toast } from '../components/Toast';";

let fixedFiles = 0;
let totalAlerts = 0;

for (const file of files) {
  const filePath = join(pagesDir, file);
  let content = readFileSync(filePath, 'utf8');
  
  if (!content.includes('alert(')) continue;
  
  const alertCount = (content.match(/\balert\(/g) || []).length;
  totalAlerts += alertCount;
  
  // Add toast import if not present
  if (!content.includes("from '../components/Toast'")) {
    // Insert after the last import line
    const lastImportIdx = content.lastIndexOf('\nimport ');
    const afterLastImport = content.indexOf('\n', lastImportIdx + 1);
    content = content.slice(0, afterLastImport + 1) + toastImport + '\n' + content.slice(afterLastImport + 1);
  }
  
  // Replace patterns
  // alert('...successfully...') => toast.success(...)
  content = content.replace(/\balert\((['"`][^'"`]*(?:success|updated|saved|created|sent|approved|completed)[^'"`]*['"`])\)/gi, 'toast.success($1)');
  
  // alert(result.error || '...Failed...') => toast.error(result.error || '...')
  content = content.replace(/\balert\((result\.error[^)]+)\)/g, 'toast.error($1)');
  
  // alert('Please ...') => toast.warning(...)  
  content = content.replace(/\balert\((['"`]Please[^'"`]*['"`])\)/g, 'toast.warning($1)');
  
  // alert('Exporting ...') => toast.info(...)
  content = content.replace(/\balert\((['"`]Export[^'"`]*['"`])\)/gi, 'toast.info($1)');
  
  // alert('Insufficient ...') => toast.error(...)
  content = content.replace(/\balert\((['"`]Insufficient[^'"`]*['"`])\)/g, 'toast.error($1)');
  
  // Remaining alerts with error keywords
  content = content.replace(/\balert\((['"`][^'"`]*(?:failed|error)[^'"`]*['"`])\)/gi, 'toast.error($1)');
  
  // Any remaining alert() => toast.info()
  content = content.replace(/\balert\(/g, 'toast.info(');
  
  writeFileSync(filePath, content, 'utf8');
  fixedFiles++;
  console.log(`✓ Fixed ${alertCount} alert(s) in ${file}`);
}

console.log(`\nDone: ${fixedFiles} files fixed, ${totalAlerts} alerts replaced.`);
