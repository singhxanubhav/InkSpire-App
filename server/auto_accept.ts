import { prisma } from './src/config/database';

async function main() {
  await prisma.match.updateMany({
    data: { status: 'ACCEPTED' }
  });
  console.log('Done!');
}
main().finally(() => prisma.$disconnect());
