const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../src/app/api/bot');

const IMPORT_STATEMENT = `import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';`;
const RATE_LIMIT_SNIPPET = `
    const defaultIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const { allowed, resetInMs } = await checkRateLimit(\`api:\${defaultIp}\`, { maxRequests: 60, windowMs: 60000 });
    if (!allowed) return rateLimitResponse(resetInMs);
`;

function processFile(filePath) {
    if (!filePath.endsWith('route.ts')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already applied
    if (content.includes('checkRateLimit') && content.includes('rateLimitResponse')) {
        return;
    }

    let modified = false;

    // Add import if missing
    if (!content.includes('@/lib/rate-limit')) {
        // Find existing imports or add to top
        const importMatch = content.match(/^import .*?;\n/gm);
        let place = 0;
        if (importMatch) {
            const lastImport = importMatch[importMatch.length - 1];
            place = content.indexOf(lastImport) + lastImport.length;
        }
        content = content.slice(0, place) + IMPORT_STATEMENT + '\n' + content.slice(place);
        modified = true;
    }

    // Inject before the try block or inside the function body of GET/POST/PUT/DELETE/PATCH
    const functionRegex = /export async function (GET|POST|PUT|DELETE|PATCH)\((req|request): NextRequest.*?\)\s*{/g;
    
    content = content.replace(functionRegex, (match, method, argName) => {
        modified = true;
        
        let snippet = `
    const defaultIp = ${argName}.headers.get('x-forwarded-for') || ${argName}.headers.get('x-real-ip') || 'unknown';
    const { allowed, resetInMs } = await checkRateLimit(\`api-\${${argName}.nextUrl?.pathname || 'unknown'}:\${defaultIp}\`, { maxRequests: 60, windowMs: 60000 });
    if (!allowed) return rateLimitResponse(resetInMs);
`;
        return match + snippet;
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else {
            processFile(fullPath);
        }
    }
}

console.log('Applying Rate Limiter universally...');
processDirectory(targetDir);
console.log('Complete.');
