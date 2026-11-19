import { execFileSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';

const project = resolve(import.meta.dirname, '..');
const destination = join(project, 'app', 'api');
const temp = mkdtempSync(join(tmpdir(), 'goit-notehub-api-'));
const repository = process.env.GOIT_API_LOCAL_CLONE || join(temp, 'repo');
const staged = join(project, `.goit-api-stage-${process.pid}`);
const backup = join(project, `.goit-api-backup-${process.pid}`);

function collectRoutes(folder, depth = 0) {
  if (depth > 12) return [];
  const files = [];
  for (const item of readdirSync(folder, { withFileTypes: true })) {
    if (['.git', 'node_modules', '.next'].includes(item.name)) continue;
    const fullPath = join(folder, item.name);
    if (item.isDirectory()) {
      files.push(...collectRoutes(fullPath, depth + 1));
    } else if (item.isFile() && /^route\.(ts|tsx|js|jsx)$/.test(item.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function findApiFolder(repo, routes) {
  // GoIT may publish API files directly in the branch root rather than in app/api.
  // Infer their actual API root from Next.js route-handler paths.
  const candidates = new Map();
  const pattern = /^(.*?)(auth\/(?:login|register|session|logout)\/route\.(?:ts|tsx|js|jsx)|notes(?:\/\[id\])?\/route\.(?:ts|tsx|js|jsx)|users\/me\/route\.(?:ts|tsx|js|jsx))$/;

  for (const routeFile of routes) {
    const file = relative(repo, routeFile).split(sep).join('/');
    const match = file.match(pattern);
    if (!match) continue;
    const prefix = match[1].replace(/\/$/, '');
    const root = prefix ? join(repo, ...prefix.split('/')) : repo;
    const names = candidates.get(root) ?? new Set();
    names.add(match[2].split('/route.')[0]);
    candidates.set(root, names);
  }

  const ranked = [...candidates.entries()].sort((a, b) => b[1].size - a[1].size);
  const match = ranked.find(([, names]) =>
    names.has('auth/login') && names.has('auth/register') && names.has('notes') && names.size >= 4,
  );
  if (!match) return null;
  return { folder: match[0], endpoints: [...match[1]].sort() };
}

console.log('Downloading the official GoIT API routes (hw-09-api-files)...');
try {
  if (!process.env.GOIT_API_LOCAL_CLONE) {
    execFileSync('git', [
      'clone', '--depth', '1', '--single-branch', '--branch', 'hw-09-api-files',
      'https://github.com/goitacademy/react-notehub-styles.git', repository,
    ], { stdio: 'inherit' });
  }

  const routes = collectRoutes(repository);
  const detected = findApiFolder(repository, routes);
  if (!detected) {
    console.error('Cannot locate the official API folder. Route files found:');
    for (const file of routes) console.error('  ' + relative(repository, file));
    throw new Error('Required GoIT API endpoints (auth/login, auth/register, notes) were not found together.');
  }

  console.log('Found official API files in:', relative(repository, detected.folder) || '(repository root)');
  console.log('Detected endpoints:', detected.endpoints.join(', '));

  rmSync(staged, { recursive: true, force: true });
  if (detected.folder === repository) {
    // Branches sometimes place auth/, notes/ and users/ directly at the root.
    // Copy route directories, not .git or repository metadata.
    mkdirSync(staged, { recursive: true });
    const firstSegments = new Set(routes.map((file) =>
      relative(detected.folder, file).split(sep)[0],
    ));
    for (const name of firstSegments) {
      const src = join(detected.folder, name);
      if (existsSync(src) && statSync(src).isDirectory()) {
        cpSync(src, join(staged, name), { recursive: true });
      }
    }
  } else {
    cpSync(detected.folder, staged, { recursive: true });
  }

  const stagedRoutes = collectRoutes(staged);
  if (stagedRoutes.length < 4) {
    throw new Error('Downloaded API is incomplete; existing app/api was left untouched.');
  }

  // Only replace existing app/api after a complete candidate was prepared.
  rmSync(backup, { recursive: true, force: true });
  mkdirSync(dirname(destination), { recursive: true });
  const hadPrevious = existsSync(destination);
  if (hadPrevious) renameSync(destination, backup);
  try {
    renameSync(staged, destination);
  } catch (error) {
    if (hadPrevious && existsSync(backup)) renameSync(backup, destination);
    throw error;
  }
  rmSync(backup, { recursive: true, force: true });
  console.log(`Success! Installed ${stagedRoutes.length} official route files into app/api.`);
  console.log('Now run: npm run build');
} catch (error) {
  console.error('Failed to install GoIT API routes:', error instanceof Error ? error.message : error);
  console.error('The existing app/api folder has been preserved.');
  process.exitCode = 1;
} finally {
  rmSync(staged, { recursive: true, force: true });
  rmSync(temp, { recursive: true, force: true });
}
