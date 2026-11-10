// First-time setup: `pnpm setup`. Safe to run again — it never overwrites an existing .env.
import { copyFileSync, existsSync } from 'node:fs';

const ok = (msg) => console.log(`  ✓ ${msg}`);
const warn = (msg) => console.log(`  ✕ ${msg}`);

console.log('\nRevenue OS — setup\n');

if (existsSync('.env')) {
  ok('.env already exists (left unchanged)');
} else {
  copyFileSync('.env.example', '.env');
  ok('.env created from .env.example');
}

const [major] = process.versions.node.split('.').map(Number);
major >= 24 ? ok(`Node ${process.versions.node}`) : warn(`Node ${process.versions.node} — need 24+`);

console.log('\nNext steps (Windows, local):');
console.log('  1. wsl -d Ubuntu -u root -- bash infrastructure/wsl/install.sh   # first time only: PostgreSQL + Redis');
console.log('  2. start-miracle.bat  # starts PostgreSQL + Redis, builds if needed, runs web + api + worker');
console.log('  3. pnpm db:deploy     # creates the database tables (migrations)');
console.log('  4. pnpm db:seed       # dev workspace, team users, roles, default pipeline');
console.log('  5. open http://localhost:3000/diagnostics - all five rows should be OK\n');
