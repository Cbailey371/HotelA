import { PrismaClient } from '@prisma/client';
import Cryptr from 'cryptr';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno desde el archivo .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Create Hotel
  const hotel = await prisma.hotel.create({
    data: {
      name: 'Grand Paradise Hotel',
      address: 'Av. Balboa, Torre Financiera',
      city: 'Panama City',
      country: 'Panama',
    },
  });

  console.log('✅ Hotel created');

  // 2. Create Users
  const cryptr = new Cryptr(
    process.env.CRYPTR_PHRASE ||
    process.env.JWT_CRYPTR_PHRASE ||
    'hotel_secret_key',
  );
  const hashedPassword = cryptr.encrypt('Password123$');
  await prisma.user.createMany({
    data: [
      {
        email: 'admin@grandparadise.com',
        name: 'Carlos Rodriguez',
        password: hashedPassword,
        role: 'admin',
        hotelId: hotel.id,
      },
      {
        email: 'maintenance@grandparadise.com',
        name: 'Maria Lopez',
        password: hashedPassword,
        role: 'maintenance',
        hotelId: hotel.id,
      },
      {
        email: 'user@grandparadise.com',
        name: 'Roberto Sanchez',
        password: hashedPassword,
        role: 'user',
        hotelId: hotel.id,
      },
      {
        email: 'user@default.com',
        name: 'Juan Perez',
        password: hashedPassword,
        role: 'user',
        hotelId: hotel.id,
      },
    ],
  });

  console.log('✅ Users created');

  // 3. Create Providers
  const provider1 = await prisma.provider.create({
    data: {
      name: 'TechCorp Solutions',
      taxId: '1234567890',
      mainContact: 'Juan Perez',
      phone: '+507-6789-1234',
      email: 'contact@techcorp.com',
      address: 'Calle 50, Edificio Metropolitan',
      city: 'Panama City',
      country: 'Panama',
      website: 'https://techcorp.com',
      providerType: 'assets',
      paymentMethods: 'Credit Card, Bank Transfer',
      notes: 'Specialized in electronic equipment and machinery',
    },
  });

  const provider2 = await prisma.provider.create({
    data: {
      name: 'Parts & More',
      taxId: '0987654321',
      mainContact: 'Ana Martinez',
      phone: '+507-2345-6789',
      email: 'sales@partsmore.com',
      address: 'Via España, Centro Comercial',
      city: 'Panama City',
      country: 'Panama',
      providerType: 'spare_parts',
      paymentMethods: 'Cash, Credit Card',
      notes: 'Reliable spare parts supplier',
    },
  });

  const provider3 = await prisma.provider.create({
    data: {
      name: 'Universal Supplies',
      taxId: '1357924680',
      mainContact: 'Luis Gonzalez',
      phone: '+507-9876-5432',
      email: 'info@universalsupplies.com',
      address: 'Zona Libre de Colon',
      city: 'Colon',
      country: 'Panama',
      providerType: 'both',
      paymentMethods: 'All payment methods accepted',
      notes: 'Complete solutions for hotels',
    },
  });

  console.log('✅ Providers created');

  // 4. Create Locations
  const location1 = await prisma.location.create({
    data: {
      name: 'Main Kitchen',
      description: 'Primary kitchen facility',
      hotelId: hotel.id,
    },
  });

  const location2 = await prisma.location.create({
    data: {
      name: 'Pool Area',
      description: 'Swimming pool and recreation area',
      hotelId: hotel.id,
    },
  });

  const location3 = await prisma.location.create({
    data: {
      name: 'Maintenance Room',
      description: 'Technical maintenance facility',
      hotelId: hotel.id,
    },
  });

  const location4 = await prisma.location.create({
    data: {
      name: 'Lobby',
      description: 'Main reception and lobby area',
      hotelId: hotel.id,
    },
  });

  console.log('✅ Locations created');

  // 5. Create Assets
  const asset1 = await prisma.asset.create({
    data: {
      name: 'Industrial Refrigerator',
      category: 'Kitchen Equipment',
      assetType: 'machinery',
      model: 'RF-2000X',
      brand: 'CoolTech',
      serialNumber: 'CT2000-001',
      year: 2022,
      color: 'Stainless Steel',
      quantity: 1,
      locationDetail: 'Corner near prep station',
      responsible: 'Kitchen Manager',
      acquisitionDate: new Date('2022-03-15'),
      installationDate: new Date('2022-03-20'),
      providerId: provider1.id,
      value: 15000,
      usefulLife: 10,
      status: 'active',
      notes: 'Energy efficient model',
      hotelId: hotel.id,
      locationId: location1.id,
    },
  });

  const asset2 = await prisma.asset.create({
    data: {
      name: 'Pool Pump System',
      category: 'Pool Equipment',
      assetType: 'machinery',
      model: 'PP-500',
      brand: 'AquaFlow',
      serialNumber: 'AF500-789',
      year: 2021,
      quantity: 1,
      locationDetail: 'Equipment room adjacent to pool',
      responsible: 'Pool Maintenance',
      acquisitionDate: new Date('2021-06-10'),
      installationDate: new Date('2021-06-15'),
      providerId: provider3.id,
      value: 8500,
      usefulLife: 8,
      status: 'active',
      hotelId: hotel.id,
      locationId: location2.id,
    },
  });

  const asset3 = await prisma.asset.create({
    data: {
      name: 'Hotel Shuttle Van',
      category: 'Transportation',
      assetType: 'vehicle',
      model: 'Transit 350',
      brand: 'Ford',
      serialNumber: 'FT350-2023',
      year: 2023,
      color: 'White',
      engineNumber: 'ENG-789456',
      chassisNumber: 'CHS-123789',
      quantity: 1,
      responsible: 'Transport Manager',
      acquisitionDate: new Date('2023-01-15'),
      providerId: provider3.id,
      value: 45000,
      usefulLife: 5,
      status: 'active',
      notes: '12-passenger capacity',
      hotelId: hotel.id,
      locationId: location3.id,
    },
  });

  const asset4 = await prisma.asset.create({
    data: {
      name: 'Reception Desk Computer',
      category: 'IT Equipment',
      assetType: 'electronic',
      model: 'OptiPlex 7090',
      brand: 'Dell',
      serialNumber: 'DL7090-456',
      year: 2023,
      color: 'Black',
      quantity: 2,
      locationDetail: 'Front desk stations',
      responsible: 'IT Manager',
      acquisitionDate: new Date('2023-02-01'),
      installationDate: new Date('2023-02-05'),
      providerId: provider1.id,
      value: 2400,
      usefulLife: 4,
      status: 'active',
      hotelId: hotel.id,
      locationId: location4.id,
    },
  });

  console.log('✅ Assets created');

  // 6. Create Spare Parts
  await prisma.sparePart.createMany({
    data: [
      {
        assetId: asset1.id,
        name: 'Compressor Filter',
        sparePartType: 'part',
        model: 'CF-2000',
        brand: 'CoolTech',
        availableQuantity: 5,
        minimumStock: 2,
        estimatedUsefulLife: 12,
        lastPurchaseDate: new Date('2023-12-01'),
        storageLocation: 'Maintenance Room - Shelf A',
        exactPhysicalLocation: 'Bin A-15',
        providerId: provider2.id,
        unitCost: 150,
        compatibilityModels: 'RF-2000X, RF-2100X',
      },
      {
        assetId: asset2.id,
        name: 'Pool Pump Impeller',
        sparePartType: 'mechanic',
        model: 'IMP-500',
        brand: 'AquaFlow',
        availableQuantity: 2,
        minimumStock: 1,
        estimatedUsefulLife: 24,
        lastPurchaseDate: new Date('2023-08-15'),
        storageLocation: 'Pool Equipment Room',
        exactPhysicalLocation: 'Cabinet B-3',
        providerId: provider3.id,
        unitCost: 280,
        compatibilityModels: 'PP-500, PP-600',
      },
      {
        assetId: asset3.id,
        name: 'Engine Oil Filter',
        sparePartType: 'consumable',
        model: 'OF-Transit',
        brand: 'Ford',
        availableQuantity: 8,
        minimumStock: 3,
        estimatedUsefulLife: 6,
        lastPurchaseDate: new Date('2024-01-10'),
        expirationDate: new Date('2026-01-10'),
        storageLocation: 'Vehicle Maintenance Bay',
        exactPhysicalLocation: 'Tool Cabinet C-7',
        providerId: provider3.id,
        unitCost: 45,
        compatibilityModels: 'Transit 350, Transit 250',
      },
    ],
  });

  console.log('✅ Spare Parts created');

  // 7. Create Technicians
  const technician1 = await prisma.technician.create({
    data: {
      name: 'Carlos Mendez',
      email: 'carlos@techcorp.com',
      phone: '+507-6789-1234',
      providerId: provider1.id,
    },
  });

  const technician2 = await prisma.technician.create({
    data: {
      name: 'Miguel Torres',
      email: 'miguel@techcorp.com',
      phone: '+507-6789-1234',
    },
  });

  // 8. Create Maintenance Schedule
  const maintenance1 = await prisma.maintenance.create({
    data: {
      assetId: asset1.id,
      maintenanceCode: 'PREV-RF-001',
      maintenanceType: 'preventive',
      description: 'Quarterly refrigerator maintenance and cleaning',
      scheduledDate: new Date('2024-07-01'),
      frequency: 'quarterly',
      priority: 'medium',
      responsible: 'Kitchen Maintenance Team',
      status: 'pending',
      estimatedCost: 300,
      alertDaysBefore: 7,
      providerId: provider1.id,
      technicianId: technician1.id,
    },
  });

  const maintenance2 = await prisma.maintenance.create({
    data: {
      assetId: asset2.id,
      maintenanceCode: 'PREV-PP-002',
      maintenanceType: 'preventive',
      description: 'Monthly pool pump inspection and service',
      scheduledDate: new Date('2024-06-15'),
      frequency: 'monthly',
      priority: 'high',
      responsible: 'Pool Maintenance',
      status: 'completed',
      estimatedCost: 180,
      alertDaysBefore: 3,
      technicianId: technician1.id,
    },
  });

  const maintenance3 = await prisma.maintenance.create({
    data: {
      assetId: asset3.id,
      maintenanceCode: 'PREV-VAN-003',
      maintenanceType: 'preventive',
      description: 'Vehicle routine maintenance - oil change and inspection',
      scheduledDate: new Date('2024-06-20'),
      frequency: 'quarterly',
      priority: 'medium',
      responsible: 'Transport Manager',
      status: 'pending',
      estimatedCost: 250,
      alertDaysBefore: 5,
      providerId: provider3.id,
      technicianId: technician1.id,
    },
  });

  console.log('✅ Maintenance schedules created');

  // 9. Create Maintenance Logs
  const maintenanceLog1 = await prisma.maintenanceLog.create({
    data: {
      assetId: asset2.id,
      maintenanceId: maintenance2.id,
      maintenanceType: 'preventive',
      description: 'Completed monthly pool pump maintenance',
      performedDate: new Date('2024-06-15'),
      cost: 175.5,
      responsible: 'Miguel Torres',
      downtimeDays: 0,
      maintenanceDurationHrs: 2.5,
      result: 'Pump running optimally, pressure within normal range',
      notes: 'Replaced worn gaskets, cleaned filter housing',
    },
  });

  const maintenanceLog2 = await prisma.maintenanceLog.create({
    data: {
      assetId: asset1.id,
      maintenanceType: 'corrective',
      description: 'Emergency repair - temperature sensor malfunction',
      performedDate: new Date('2024-05-28'),
      cost: 420.0,
      responsible: 'Emergency Service Team',
      downtimeDays: 1,
      maintenanceDurationHrs: 4.0,
      result: 'Temperature sensor replaced, system calibrated',
      notes: 'Sensor failed during peak service hours, quick response required',
    },
  });

  console.log('✅ Maintenance logs created');

  // 10. Create Spare Part Usage Logs
  await prisma.sparePartLog.createMany({
    data: [
      {
        maintenanceLogId: maintenanceLog1.id,
        sparePartId: (await prisma.sparePart.findFirst({
          where: { assetId: asset2.id },
        }))!.id,
        quantityUsed: 1,
      },
    ],
  });

  console.log('✅ Spare part logs created');

  // 11. Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        hotelId: hotel.id,
        title: 'Maintenance Alert',
        message: 'Refrigerator maintenance scheduled for next week',
        read: false,
      },
      {
        hotelId: hotel.id,
        title: 'Low Stock Warning',
        message: 'Pool pump impeller stock is running low (2 units remaining)',
        read: false,
      },
      {
        hotelId: hotel.id,
        title: 'Asset Status Update',
        message: 'All lobby equipment is functioning normally',
        read: true,
      },
      {
        hotelId: hotel.id,
        title: 'Vehicle Maintenance Due',
        message: 'Shuttle van maintenance scheduled for June 20th',
        read: false,
      },
    ],
  });

  console.log('✅ Notifications created');

  console.log('🎉 Seed completed successfully!');

  // Summary
  const counts = {
    hotels: await prisma.hotel.count(),
    users: await prisma.user.count(),
    providers: await prisma.provider.count(),
    locations: await prisma.location.count(),
    assets: await prisma.asset.count(),
    spareParts: await prisma.sparePart.count(),
    maintenances: await prisma.maintenance.count(),
    maintenanceLogs: await prisma.maintenanceLog.count(),
    sparePartLogs: await prisma.sparePartLog.count(),
    notifications: await prisma.notification.count(),
  };

  console.log('\n📊 Database Summary:');
  Object.entries(counts).forEach(([model, count]) => {
    console.log(`${model}: ${count}`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
