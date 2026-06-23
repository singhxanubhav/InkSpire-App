import { PrismaClient, Genre, PromptType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data (in reverse order of dependencies)
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.promptSubmission.deleteMany();
  await prisma.promptUpvote.deleteMany();
  await prisma.prompt.deleteMany();
  await prisma.ideaReply.deleteMany();
  await prisma.idea.deleteMany();
  await prisma.match.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Users
  console.log('👤 Creating users...');
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'alice@example.com',
        passwordHash,
        displayName: 'Alice Writer',
        bio: 'Fantasy author looking for feedback.',
        genres: [Genre.FANTASY, Genre.SCI_FI],
        experienceLevel: 'INTERMEDIATE',
        dailyWordCount: 500,
      },
    }),
    prisma.user.create({
      data: {
        email: 'bob@example.com',
        passwordHash,
        displayName: 'Bob The Builder',
        bio: 'World building enthusiast.',
        genres: [Genre.SCI_FI, Genre.MYSTERY],
        experienceLevel: 'BEGINNER',
        dailyWordCount: 250,
      },
    }),
    prisma.user.create({
      data: {
        email: 'charlie@example.com',
        passwordHash,
        displayName: 'Charlie Dickens',
        bio: 'Literary fiction writer.',
        genres: [Genre.LITERARY_FICTION],
        experienceLevel: 'EXPERT',
        dailyWordCount: 1000,
      },
    }),
    prisma.user.create({
      data: {
        email: 'diana@example.com',
        passwordHash,
        displayName: 'Diana Prince',
        bio: 'Action and thriller writer.',
        genres: [Genre.THRILLER, Genre.FANTASY],
        experienceLevel: 'INTERMEDIATE',
        dailyWordCount: 500,
      },
    }),
    prisma.user.create({
      data: {
        email: 'eve@example.com',
        passwordHash,
        displayName: 'Eve Adams',
        bio: 'Horror and mystery fan.',
        genres: [Genre.HORROR, Genre.MYSTERY],
        experienceLevel: 'INTERMEDIATE',
        dailyWordCount: 750,
      },
    }),
  ]);

  // 2. Create Matches
  console.log('🤝 Creating matches...');
  const match1 = await prisma.match.create({
    data: {
      requesterId: users[0].id, // Alice
      receiveeId: users[1].id,  // Bob
      status: 'ACCEPTED',
    },
  });

  const match2 = await prisma.match.create({
    data: {
      requesterId: users[2].id, // Charlie
      receiveeId: users[0].id,  // Alice
      status: 'PENDING',
    },
  });

  // 3. Create Ideas for the Accepted Match
  console.log('💡 Creating ideas...');
  await prisma.idea.create({
    data: {
      matchId: match1.id,
      authorId: users[0].id,
      type: 'WORLD',
      content: 'A world where magic is powered by starlight, but the stars are slowly dying out.',
      tags: ['magic', 'sci-fantasy', 'stars'],
    },
  });

  await prisma.idea.create({
    data: {
      matchId: match1.id,
      authorId: users[1].id,
      type: 'CHARACTER',
      content: 'A protagonist who is blind but can see the "echoes" of recent magic use.',
      tags: ['protagonist', 'magic-system'],
    },
  });

  // 4. Create Community Prompts
  console.log('📝 Creating prompts...');
  await prisma.prompt.create({
    data: {
      content: 'Write a scene where two characters meet in a bustling marketplace, but one of them is invisible to everyone else.',
      genre: Genre.FANTASY,
      type: PromptType.COMMUNITY,
      isPublished: true,
      authorId: users[3].id, // Diana
    },
  });

  await prisma.prompt.create({
    data: {
      content: 'Your detective has finally cornered the serial killer, but the killer claims they are from the future trying to stop a worse tragedy.',
      genre: Genre.THRILLER,
      type: PromptType.COMMUNITY,
      isPublished: true,
      authorId: users[4].id, // Eve
    },
  });

  console.log('✅ Seeding finished.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
