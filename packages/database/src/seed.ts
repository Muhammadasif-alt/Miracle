/**
 * Development seed (docs/17 Phase 2/3): workspace, the two team users (Asif, Zohaib), roles, permissions,
 * default pipeline, policy skeleton. Idempotent — safe to run repeatedly. Contains no production secrets.
 * Run: `pnpm db:seed` (after `pnpm db:deploy`).
 */
import { existsSync } from 'node:fs';
import type { RoleKey } from '@revenue-os/shared';
import { hashPassword } from '@revenue-os/shared/server';
import { createPrismaClient } from './index.js';
import { provisionWorkspaceDefaults } from './bootstrap.js';

const rootEnv = new URL('../../../.env', import.meta.url);
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not set — run `pnpm setup` first.');
if (process.env.APP_ENV === 'production') throw new Error('Refusing to run the development seed in production.');


/** The studio team (login page shows one card each — apps/web/src/lib/team.ts). */
/** Each member has their own development-only password (shown as a hint on their sign-in page in development). */
const USERS: { email: string; name: string; role: RoleKey; password: string }[] = [
  {
    email: process.env.SEED_DEVELOPER_EMAIL ?? 'raoasifriyasat@gmail.com',
    name: 'Asif',
    role: 'OWNER',
    password: process.env.SEED_DEVELOPER_PASSWORD ?? 'asif-dev-2026',
  },
  {
    email: process.env.SEED_DESIGNER_EMAIL ?? 'zohaibaidesigner@gmail.com',
    name: 'Zohaib',
    role: 'ADMIN',
    password: process.env.SEED_DESIGNER_PASSWORD ?? 'zohaib-dev-2026',
  },
];

const db = createPrismaClient(databaseUrl);

try {
  const hashes = await Promise.all(USERS.map((u) => hashPassword(u.password)));
  await db.$transaction(async (tx) => {
    const workspace = await tx.workspace.upsert({
      where: { slug: 'dev' },
      create: { name: 'Rank High Lead (Dev)', slug: 'dev' },
      update: {},
    });
    const roleIds = await provisionWorkspaceDefaults(tx, workspace.id);

    for (const [i, u] of USERS.entries()) {
      const passwordHash = hashes[i];
      const user = await tx.user.upsert({
        where: { email: u.email },
        create: { email: u.email, name: u.name, status: 'ACTIVE', passwordHash, passwordUpdatedAt: new Date() },
        // Development seed: always (re)set the member's own dev password so the sign-in hint stays correct.
        update: { name: u.name, passwordHash, passwordUpdatedAt: new Date(), status: 'ACTIVE' },
      });
      const member = await tx.workspaceMember.upsert({
        where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
        create: { workspaceId: workspace.id, userId: user.id, status: 'ACTIVE' },
        update: {},
      });
      await tx.userRole.createMany({
        data: [{ workspaceId: workspace.id, memberId: member.id, roleId: roleIds[u.role] }],
        skipDuplicates: true,
      });
    }

    console.log(`✓ Seeded workspace "${workspace.name}" (slug: ${workspace.slug})`);
    console.log('  Sign in at http://localhost:3000/login — pick a card, then use that member password:');
    for (const u of USERS) console.log(`  ${u.name.padEnd(8)} ${u.role.padEnd(6)} ${u.email}  password: ${u.password}`);
    // maxWait: on a cold database the first connection can take longer than the 2 s default (P2028).
  }, { timeout: 60_000, maxWait: 20_000 });
} finally {
  await db.$disconnect();
}
