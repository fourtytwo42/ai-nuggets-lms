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
  let admin = await prisma.user.findUnique({
    where: { email: 'admin@test.com' },
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        name: 'Admin User',
        passwordHash: adminPassword,
        role: 'admin',
        organizationId: org.id,
      },
    });
  } else {
    // Update password if user exists
    admin = await prisma.user.update({
      where: { email: 'admin@test.com' },
      data: { passwordHash: adminPassword },
    });
  }

  // Create learner user
  const learnerPassword = await hashPassword('learner123');
  let learner = await prisma.user.findUnique({
    where: { email: 'learner@test.com' },
  });

  if (!learner) {
    learner = await prisma.user.create({
      data: {
        email: 'learner@test.com',
        name: 'Test Learner',
        passwordHash: learnerPassword,
        role: 'learner',
        organizationId: org.id,
      },
    });
  } else {
    learner = await prisma.user.update({
      where: { email: 'learner@test.com' },
      data: { passwordHash: learnerPassword },
    });
  }

  // Create learner profile
  const existingLearner = await prisma.learner.findUnique({
    where: { userId: learner.id },
  });

  if (!existingLearner) {
    await prisma.learner.create({
      data: {
        userId: learner.id,
        organizationId: org.id,
        profile: {
          interests: ['Technology', 'AI', 'Machine Learning'],
          goals: 'Learn advanced AI concepts',
          learningStyle: 'visual',
        },
      },
    });
  }

  // Create another learner
  const learner2Password = await hashPassword('user123');
  let learner2 = await prisma.user.findUnique({
    where: { email: 'user@test.com' },
  });

  if (!learner2) {
    learner2 = await prisma.user.create({
      data: {
        email: 'user@test.com',
        name: 'John Doe',
        passwordHash: learner2Password,
        role: 'learner',
        organizationId: org.id,
      },
    });
  } else {
    learner2 = await prisma.user.update({
      where: { email: 'user@test.com' },
      data: { passwordHash: learner2Password },
    });
  }

  const existingLearner2 = await prisma.learner.findUnique({
    where: { userId: learner2.id },
  });

  if (!existingLearner2) {
    await prisma.learner.create({
      data: {
        userId: learner2.id,
        organizationId: org.id,
        profile: {
          interests: ['Programming', 'Web Development'],
          goals: 'Master full-stack development',
          learningStyle: 'kinesthetic',
        },
      },
    });
  }

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

