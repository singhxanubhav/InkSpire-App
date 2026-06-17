import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  
  // Create a Live Event
  await prisma.event.create({
    data: {
      title: "Midnight Writing Dash",
      description: "A quick 1-hour dash to get those creative juices flowing!",
      type: "SPRINT",
      startTime: new Date(now.getTime() - 10 * 60000), // Started 10 mins ago
      endTime: new Date(now.getTime() + 50 * 60000),   // Ends in 50 mins
      targetWords: 1000,
      maxParticipants: 50,
    }
  });

  // Create an Upcoming Event
  await prisma.event.create({
    data: {
      title: "Weekend Novel Prep",
      description: "Let's outline our next chapters together.",
      type: "WORKSHOP",
      startTime: new Date(now.getTime() + 24 * 60 * 60000), // Starts in 24 hours
      endTime: new Date(now.getTime() + 26 * 60 * 60000),   // Ends in 26 hours
      targetWords: 500,
    }
  });

  console.log("Mock events created!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
