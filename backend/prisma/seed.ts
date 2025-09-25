import { PrismaClient, UserRole, TaskStatus, TaskPriority, TeamStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Hash password for test users
  const hashedPassword = await bcrypt.hash('password123', 12);

  // Create test users
  console.log('👤 Creating users...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@geodesy.com',
      passwordHash: hashedPassword,
      role: UserRole.ADMIN,
      name: 'System Administrator',
      phone: '+380501234567'
    }
  });

  const supervisor = await prisma.user.create({
    data: {
      email: 'supervisor@geodesy.com',
      passwordHash: hashedPassword,
      role: UserRole.SUPERVISOR,
      name: 'Project Supervisor',
      phone: '+380502345678'
    }
  });

  const teamMember1 = await prisma.user.create({
    data: {
      email: 'member1@geodesy.com',
      passwordHash: hashedPassword,
      role: UserRole.TEAM_MEMBER,
      name: 'Team Member One',
      phone: '+380503456789'
    }
  });

  const teamMember2 = await prisma.user.create({
    data: {
      email: 'member2@geodesy.com',
      passwordHash: hashedPassword,
      role: UserRole.TEAM_MEMBER,
      name: 'Team Member Two',
      phone: '+380504567890'
    }
  });

  // Create test teams
  console.log('👥 Creating teams...');
  const team1 = await prisma.team.create({
    data: {
      name: 'Survey Team Alpha',
      description: 'Primary surveying team for urban projects',
      status: TeamStatus.ACTIVE,
      leaderId: teamMember1.id
    }
  });

  const team2 = await prisma.team.create({
    data: {
      name: 'Survey Team Beta',
      description: 'Secondary team for rural and remote areas',
      status: TeamStatus.ACTIVE,
      leaderId: teamMember2.id
    }
  });

  // Add team members
  await prisma.teamMember.createMany({
    data: [
      { teamId: team1.id, userId: teamMember1.id },
      { teamId: team1.id, userId: teamMember2.id },
      { teamId: team2.id, userId: teamMember2.id }
    ]
  });

  // Create test sites
  console.log('📍 Creating sites...');
  const site1 = await prisma.site.create({
    data: {
      name: 'Kyiv City Center Project',
      address: 'Khreshchatyk Street, Kyiv, Ukraine',
      latitude: 50.4501,
      longitude: 30.5234,
      description: 'Urban development surveying project in downtown Kyiv',
      clientInfo: {
        clientName: 'Kyiv Development Corp',
        contractNumber: 'KDC-2024-001',
        projectManager: 'Ivan Petrov'
      }
    }
  });

  const site2 = await prisma.site.create({
    data: {
      name: 'Lviv Industrial Zone',
      address: 'Industrial District, Lviv, Ukraine',
      latitude: 49.8397,
      longitude: 24.0297,
      description: 'Industrial zone expansion survey',
      clientInfo: {
        clientName: 'Lviv Industrial Corp',
        contractNumber: 'LIC-2024-002',
        projectManager: 'Maria Kovalenko'
      }
    }
  });

  // Create test tasks
  console.log('📋 Creating tasks...');
  await prisma.task.createMany({
    data: [
      {
        siteId: site1.id,
        teamId: team1.id,
        title: 'Initial Site Survey',
        description: 'Conduct preliminary site measurements and boundary determination',
        priority: TaskPriority.HIGH,
        status: TaskStatus.PENDING,
        scheduledDate: new Date('2024-02-01T09:00:00Z'),
        estimatedDuration: 240, // 4 hours
        createdById: supervisor.id
      },
      {
        siteId: site1.id,
        teamId: team1.id,
        title: 'Topographic Survey',
        description: 'Detailed topographic measurements for construction planning',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.IN_PROGRESS,
        scheduledDate: new Date('2024-02-02T08:00:00Z'),
        estimatedDuration: 480, // 8 hours
        createdById: supervisor.id
      },
      {
        siteId: site2.id,
        teamId: team2.id,
        title: 'Boundary Verification',
        description: 'Verify existing property boundaries and markers',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.PENDING,
        scheduledDate: new Date('2024-02-03T10:00:00Z'),
        estimatedDuration: 180, // 3 hours
        createdById: supervisor.id
      }
    ]
  });

  // Create sample notifications
  console.log('🔔 Creating notifications...');
  await prisma.notification.createMany({
    data: [
      {
        userId: teamMember1.id,
        title: 'New Task Assigned',
        message: 'You have been assigned to "Initial Site Survey" at Kyiv City Center Project',
        type: 'task_assignment'
      },
      {
        userId: teamMember2.id,
        title: 'Task Update',
        message: 'Task "Boundary Verification" deadline has been extended',
        type: 'task_update'
      }
    ]
  });

  console.log('✅ Database seeding completed successfully!');
  console.log(`
📊 Summary:
- Users: 4 (1 admin, 1 supervisor, 2 team members)
- Teams: 2
- Sites: 2
- Tasks: 3
- Notifications: 2

🔐 Test Accounts:
- Admin: admin@geodesy.com / password123
- Supervisor: supervisor@geodesy.com / password123  
- Team Member 1: member1@geodesy.com / password123
- Team Member 2: member2@geodesy.com / password123
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });