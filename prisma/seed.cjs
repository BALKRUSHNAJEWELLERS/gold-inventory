// @ts-check
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const argon2 = require('argon2');
require('dotenv').config();

async function main() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error('DATABASE_URL not set in .env');

  console.log('DB URL prefix:', raw.substring(0, 40) + '...');

  // The DATABASE_URL from Prisma Postgres starts with postgres://
  // PrismaPg adapter needs postgresql://
  const pgUrl = raw
    .replace(/^prisma\+postgres:\/\//, 'postgresql://')
    .replace(/^prisma:\/\//, 'postgresql://')
    .replace(/^postgres:\/\//, 'postgresql://');

  console.log('Connecting via PrismaPg adapter...');
  const adapter = new PrismaPg({ connectionString: pgUrl });
  const prisma = new PrismaClient({ adapter });

  // 1. Create branch
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
  console.log('✅ Branch created:', branch.name, '|', branch.id);

  // 2. Hash passwords
  const adminPwd   = await argon2.hash('Admin@123');
  const managerPwd = await argon2.hash('Manager@123');
  const salesPwd   = await argon2.hash('Sales@123');

  // 3. Create admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@jewelry.com' },
    update: {},
    create: {
      email: 'admin@jewelry.com',
      password: adminPwd,
      name: 'Admin Owner',
      role: 'OWNER',
      branchId: branch.id,
    },
  });
  console.log('✅ Admin created:', admin.email);

  // 4. Create manager
  const manager = await prisma.user.upsert({
    where: { email: 'manager@jewelry.com' },
    update: {},
    create: {
      email: 'manager@jewelry.com',
      password: managerPwd,
      name: 'Store Manager',
      role: 'MANAGER',
      branchId: branch.id,
    },
  });
  console.log('✅ Manager created:', manager.email);

  // 5. Create sales user
  const salesUser = await prisma.user.upsert({
    where: { email: 'sales@jewelry.com' },
    update: {},
    create: {
      email: 'sales@jewelry.com',
      password: salesPwd,
      name: 'Sales Executive',
      role: 'SALES',
      branchId: branch.id,
    },
  });
  console.log('✅ Sales user created:', salesUser.email);

  await prisma.$disconnect();

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 DATABASE SEEDED SUCCESSFULLY!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('LOGIN CREDENTIALS:');
  console.log('  👑 Owner   → admin@jewelry.com   / Admin@123');
  console.log('  📋 Manager → manager@jewelry.com / Manager@123');
  console.log('  🛒 Sales   → sales@jewelry.com   / Sales@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch((e) => {
  console.error('❌ Seed error:', e.message || e);
  process.exit(1);
});
