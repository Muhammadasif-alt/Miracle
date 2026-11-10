/**
 * Production bootstrap: creates the first workspace and its Owner (the dev seed refuses to run in production).
 * Idempotent — re-running with the same email only makes sure the user is an active Owner.
 *
 *   pnpm db:create-owner owner@company.com "Owner Name" ["Workspace Name"]
 *
 * The password is read from OWNER_PASSWORD, or generated and printed once. Change it after first sign-in.
 */
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { hashPassword } from '@revenue-os/shared/server';
import { createPrismaClient } from './index.js';
import { provisionWorkspaceDefaults } from './bootstrap.js';

const rootEnv = new URL('../../../.env', import.meta.url);
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

const [email, name = 'Workspace Owner', workspaceName = 'Rank High Lead'] = process.argv.slice(2);
if (!email || !email.includes('@')) {
  console.error('Usage: pnpm db:create-owner owner@company.com "Owner Name" ["Workspace Name"]');
  process.exit(1);
}
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not set.');

const generated = !process.env.OWNER_PASSWORD;
const password = process.env.OWNER_PASSWORD ?? randomBytes(12).toString('base64url');
if (password.length < 12) throw new Error('OWNER_PASSWORD must be at least 12 characters.');

const db = createPrismaClient(databaseUrl);
try {
  const passwordHash = await hashPassword(password);
  const result = await db.$transaction(
    async (tx) => {
      const workspace = await tx.workspace.upsert({ where: { slug: 'main' }, create: { name: workspaceName, slug: 'main' }, update: {} });
      const roleIds = await provisionWorkspaceDefaults(tx, workspace.id);
      const existing = await tx.user.findUnique({ where: { email: email.toLowerCase() } });
      const user =
        existing ??
        (await tx.user.create({ data: { email: email.toLowerCase(), name, status: 'ACTIVE', passwordHash, passwordUpdatedAt: new Date() } }));
      const member = await tx.workspaceMember.upsert({
        where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
        create: { workspaceId: workspace.id, userId: user.id, status: 'ACTIVE' },
        update: { status: 'ACTIVE' },
      });
      await tx.userRole.createMany({ data: [{ workspaceId: workspace.id, memberId: member.id, roleId: roleIds.OWNER }], skipDuplicates: true });
      return { workspace, created: !existing };
    },
    { timeout: 60_000, maxWait: 20_000 },
  );

  console.log(`✓ Workspace "${result.workspace.name}" ready, Owner: ${email.toLowerCase()}`);
  if (result.created) {
    console.log(generated ? `  Password (shown once, change it after signing in): ${password}` : '  Password: (OWNER_PASSWORD)');
  } else {
    console.log('  User already existed — password left unchanged.');
  }
} finally {
  await db.$disconnect();
}
