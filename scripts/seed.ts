import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('4XOI4Zh*zj', 12);

  await prisma.user.upsert({
    where: { email: 'abacus-17dbb6ca@example.com' },
    update: {},
    create: {
      email: 'abacus-17dbb6ca@example.com',
      name: 'Admin User',
      password: hashedPassword,
    },
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
