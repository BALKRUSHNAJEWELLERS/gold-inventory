import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';

async function main() {
  const connectionString = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL or DIRECT_DATABASE_URL is not set in .env');
  }

  const pgUrl = connectionString
    .replace(/^prisma\+postgres:\/\//, 'postgresql://')
    .replace(/^prisma:\/\//, 'postgresql://');

  const adapter = new PrismaPg({ connectionString: pgUrl });
  const prisma = new PrismaClient({ adapter });

  console.log('🌱 Seeding database...\n');

  // ─── 1. Create Default Branch ─────────────────────────────────────────────
  const branch = await prisma.branch.upsert({
    where: { code: 'MAIN' },
    update: {},
    create: {
      name: 'Main Branch',
      code: 'MAIN',
      address: '123 Jeweler Street, Gold Market',
      phone: '+91-9000000000',
    },
  });

  console.log(`✅ Branch created: ${branch.name} (${branch.code})`);

  // ─── 2. Hash Passwords ────────────────────────────────────────────────────
  const adminPassword   = await argon2.hash('Admin@123');
  const managerPassword = await argon2.hash('Manager@123');
  const salesPassword   = await argon2.hash('Sales@123');

  // ─── 3. Create Owner / Admin ──────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@jewelry.com' },
    update: {},
    create: {
      email:    'admin@jewelry.com',
      password: adminPassword,
      name:     'Admin Owner',
      role:     'OWNER',
      branchId: branch.id,
    },
  });

  console.log(`✅ Admin user created: ${admin.email}`);

  // ─── 4. Create Manager ────────────────────────────────────────────────────
  const manager = await prisma.user.upsert({
    where: { email: 'manager@jewelry.com' },
    update: {},
    create: {
      email:    'manager@jewelry.com',
      password: managerPassword,
      name:     'Store Manager',
      role:     'MANAGER',
      branchId: branch.id,
    },
  });

  console.log(`✅ Manager user created: ${manager.email}`);

  // ─── 5. Create Sales Executive ────────────────────────────────────────────
  const sales = await prisma.user.upsert({
    where: { email: 'sales@jewelry.com' },
    update: {},
    create: {
      email:    'sales@jewelry.com',
      password: salesPassword,
      name:     'Sales Executive',
      role:     'SALES',
      branchId: branch.id,
    },
  });

  console.log(`✅ Sales user created: ${sales.email}`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Seeding complete! Login credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👑 Admin   → admin@jewelry.com   / Admin@123');
  console.log('📋 Manager → manager@jewelry.com / Manager@123');
  console.log('🛒 Sales   → sales@jewelry.com   / Sales@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});
