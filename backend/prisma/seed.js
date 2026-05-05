// Run with: node prisma/seed.js
// Populates the database with sample categories, subcategories, and a couple of demo gigs.

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const CATEGORIES = [
  {
    name: 'Web Development',
    description: 'Build and maintain websites and web apps',
    subcategories: ['Frontend', 'Backend', 'Full Stack', 'WordPress'],
  },
  {
    name: 'Design',
    description: 'Visual and graphic design services',
    subcategories: ['Logo Design', 'Brand Identity', 'UI/UX Design', 'Illustration'],
  },
  {
    name: 'Writing',
    description: 'Content creation and copywriting',
    subcategories: ['Blog Posts', 'Copywriting', 'Technical Writing', 'Editing'],
  },
  {
    name: 'Marketing',
    description: 'Digital marketing and SEO',
    subcategories: ['SEO', 'Social Media', 'Email Marketing', 'PPC Ads'],
  },
  {
    name: 'Video & Animation',
    description: 'Video editing and motion graphics',
    subcategories: ['Video Editing', 'Motion Graphics', 'Animation', '3D Modeling'],
  },
];

async function main() {
  console.log('Seeding categories and subcategories...');
  for (const cat of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: { name: cat.name, description: cat.description },
    });
    for (const subName of cat.subcategories) {
      await prisma.subcategory.upsert({
        where: { category_id_name: { category_id: category.id, name: subName } },
        update: {},
        create: { category_id: category.id, name: subName },
      });
    }
  }

  console.log('Seeding demo freelancer + a sample gig...');
  const demoEmail = 'demo.freelancer@freelancefix.test';
  let demo = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (!demo) {
    const hash = await bcrypt.hash('demo1234', 10);
    demo = await prisma.user.create({
      data: { email: demoEmail, password_hash: hash, first_name: 'Demo', last_name: 'Freelancer' },
    });
    await prisma.freelancer.create({
      data: { id: demo.id, bio: 'Sample freelancer for testing.', hourly_rate: 25.0 },
    });

    const subcat = await prisma.subcategory.findFirst({ where: { name: 'Logo Design' } });
    if (subcat) {
      const gig = await prisma.gig.create({
        data: {
          freelancer_id: demo.id,
          subcategory_id: subcat.id,
          title: 'Modern minimalist logo design',
          description: 'I will design a clean, professional logo for your business.',
          base_price: 75.0,
        },
      });
      await prisma.gigPackage.createMany({
        data: [
          { gig_id: gig.id, tier: 'Basic', price: 75, description: '1 concept, 2 revisions', delivery_days: 3 },
          { gig_id: gig.id, tier: 'Standard', price: 150, description: '3 concepts, unlimited revisions', delivery_days: 5 },
          { gig_id: gig.id, tier: 'Premium', price: 300, description: '5 concepts + brand kit', delivery_days: 7 },
        ],
      });
    }
  }

  console.log('Seeding demo client...');
  const clientEmail = 'demo.client@freelancefix.test';
  let demoClient = await prisma.user.findUnique({ where: { email: clientEmail } });
  if (!demoClient) {
    const hash = await bcrypt.hash('demo1234', 10);
    demoClient = await prisma.user.create({
      data: { email: clientEmail, password_hash: hash, first_name: 'Demo', last_name: 'Client' },
    });
    await prisma.client.create({
      data: { id: demoClient.id, company_name: 'Demo Co.' },
    });
  }

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
