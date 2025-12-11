import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth/password';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create test organization
  const org = await prisma.organization.upsert({
    where: { id: 'test-org-1' },
    update: {},
    create: {
      id: 'test-org-1',
      name: 'Test Organization',
    },
  });

  // Create admin user
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: 'admin',
      organizationId: org.id,
    },
  });

  // Create learner user
  const learnerPassword = await hashPassword('learner123');
  const learner = await prisma.user.upsert({
    where: { email: 'learner@test.com' },
    update: {},
    create: {
      email: 'learner@test.com',
      name: 'Test Learner',
      passwordHash: learnerPassword,
      role: 'learner',
      organizationId: org.id,
    },
  });

  // Create learner profile
  await prisma.learner.upsert({
    where: { userId: learner.id },
    update: {},
    create: {
      userId: learner.id,
      organizationId: org.id,
      profile: {
        interests: ['Technology', 'AI', 'Machine Learning'],
        goals: 'Learn advanced AI concepts',
        learningStyle: 'visual',
      },
    },
  });

  // Create another learner
  const learner2Password = await hashPassword('user123');
  const learner2 = await prisma.user.upsert({
    where: { email: 'user@test.com' },
    update: {},
    create: {
      email: 'user@test.com',
      name: 'John Doe',
      passwordHash: learner2Password,
      role: 'learner',
      organizationId: org.id,
    },
  });

  await prisma.learner.upsert({
    where: { userId: learner2.id },
    update: {},
    create: {
      userId: learner2.id,
      organizationId: org.id,
      profile: {
        interests: ['Programming', 'Web Development'],
        goals: 'Master full-stack development',
        learningStyle: 'kinesthetic',
      },
    },
  });

  console.log('Seeded users:');
  console.log('  Admin: admin@test.com / admin123');
  console.log('  Learner 1: learner@test.com / learner123');
  console.log('  Learner 2: user@test.com / user123');
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

