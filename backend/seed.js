const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const catImagesPool = [
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba',
  'https://images.unsplash.com/photo-1573865526739-10659fec78a5',
  'https://images.unsplash.com/photo-1495360019602-e05980bf54fe',
  'https://images.unsplash.com/photo-1533738363-b7f9aef128ce',
  'https://images.unsplash.com/photo-1529778873920-4da4926a7071',
];

const shelterPhotosPool = [
  'https://images.unsplash.com/photo-1583337130417-3346a1be7dee',
  'https://images.unsplash.com/photo-1519052537078-e6302a4968ef',
  'https://images.unsplash.com/photo-1505623776320-7edecf5f0771',
];

const campaignImagesPool = [
  'https://images.unsplash.com/photo-1574158622682-e40e69881006',
  'https://images.unsplash.com/photo-1606425271394-c3ca9aa1fc06',
  'https://images.unsplash.com/photo-1623387641168-d9803ddd3f35',
];

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  console.log('--- 🧹 MEMBERSIHKAN DATABASE... ---');
  // Hapus urut dari child ke parent biar gak error foreign key
  await prisma.campaignUpdate.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.adoption.deleteMany();
  await prisma.report.deleteMany();
  await prisma.message.deleteMany();
  await prisma.cat.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.user.deleteMany();

  console.log('--- 🏥 MEMASUKKAN DATA SHELTER (DENGAN ALAMAT VALID)... ---');

  /* FORMAT ALAMAT (4 Bagian dipisah koma):
     "Jalan Detail, Kecamatan, KOTA, Provinsi"
     Frontend akan ambil index [2] -> KOTA
  */
  const sheltersData = [
    { 
      name: 'Rumah Kucing Bandung', 
      email: 'bdg@test.com', 
      nick: 'RK Bandung', 
      // Alamat: Jalan, Kecamatan, KOTA, Provinsi
      addr: 'Jl. Dago Giri No. 10, Kecamatan Coblong, Kota Bandung, Jawa Barat', 
      desc: 'Klinik & Shelter terpadu fokus pada sterilisasi.', 
      year: 2018, 
      rescued: 342, 
      services: 'Vaksin,Steril,Rawat Inap', 
      isClinic: true, 
      openHours: '08:00 - 21:00 (Setiap Hari)' 
    },
    { 
      name: 'Paw Jakarta Selatan', 
      email: 'jkt@test.com', 
      nick: 'Paw Jaksel', 
      // Alamat: Jalan, Kecamatan, KOTA, Provinsi
      addr: 'Jl. Kemang Raya No. 88, Mampang Prapatan, Jakarta Selatan, DKI Jakarta', 
      desc: 'Klinik hewan modern dengan fasilitas lengkap.', 
      year: 2020, 
      rescued: 128, 
      services: 'Grooming,Konsultasi,Operasi', 
      isClinic: true, 
      openHours: '09:00 - 17:00 (Senin-Sabtu)' 
    },
    { 
      name: 'Meow Surabaya Rescue', 
      email: 'sby@test.com', 
      nick: 'Meow SBY', 
      // Alamat: Jalan, Kecamatan, KOTA, Provinsi
      addr: 'Jl. Darmo No. 5, Wonokromo, Surabaya, Jawa Timur', 
      desc: 'Rumah singgah sederhana untuk kucing jalanan.', 
      year: 2015, 
      rescued: 890, 
      services: 'Adopsi,Edukasi,Rescue', 
      isClinic: false, 
      openHours: '10:00 - 16:00 (Kunjungan Saja)' 
    }
  ];

  const shelters = [];
  for (let i = 0; i < sheltersData.length; i++) {
    const s = sheltersData[i];
    const user = await prisma.user.create({
      data: {
        name: s.name, 
        email: s.email, 
        password: hashedPassword, 
        nickname: s.nick, 
        shelterAddress: s.addr, // Address format fix
        role: 'SHELTER', 
        isShelterVerified: true, 
        phoneNumber: '08123456789', 
        isClinic: s.isClinic, 
        clinicOpenHours: s.openHours, 
        description: s.desc, 
        operatingYear: s.year, 
        catsRescued: s.rescued, 
        services: s.services, 
        shelterPhotos: shelterPhotosPool[i % shelterPhotosPool.length]
      }
    });
    shelters.push(user);
  }

  /* 2. SEED CAMPAIGN & DONATION */
  console.log('--- 💰 MEMASUKKAN DATA DONASI & UPDATE... ---');
  
  const campaignTitles = ['Bantuan Pakan Darurat', 'Operasi Kaki Si Belang', 'Renovasi Atap Bocor'];
  
  for (let i = 0; i < 3; i++) {
    const shelter = shelters[i];
    
    // Deadline: 30 hari dari sekarang
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + 30);

    // Create Campaign (Awalnya 0)
    const campaign = await prisma.campaign.create({
      data: {
        title: `${campaignTitles[i]} - ${shelter.nickname}`,
        description: `Halo #OrangBaik, kami dari ${shelter.nickname} sedang membutuhkan bantuan mendesak. Dana akan digunakan sepenuhnya untuk keperluan anabul.`,
        targetAmount: 5000000 + (i * 2000000), // 5jt, 7jt, 9jt
        currentAmount: 0, // Nanti diupdate
        imageUrl: campaignImagesPool[i % campaignImagesPool.length],
        shelterId: shelter.id,
        deadline: deadlineDate,
        isApproved: true
      }
    });

    // --- Create Campaign Updates (Kabar) ---
    // Update 1: Awal
    await prisma.campaignUpdate.create({
      data: {
        title: 'Campaign Dimulai!',
        description: 'Terima kasih sudah berkunjung. Bantu share ke teman-teman ya agar target cepat tercapai!',
        campaignId: campaign.id,
        createdAt: campaign.createdAt 
      }
    });

    // Update 2: Random progress
    if (Math.random() > 0.3) {
      await prisma.campaignUpdate.create({
        data: {
          title: 'Kondisi Terkini',
          description: 'Anabul sudah mulai mau makan sedikit demi sedikit. Terima kasih doa dan dukungannya.',
          campaignId: campaign.id,
          createdAt: new Date() 
        }
      });
    }

    // --- Create Donations (Donatur) ---
    let totalDonated = 0;
    const donationCount = Math.floor(Math.random() * 6) + 3; // 3-8 donatur

    const methods = ['QRIS', 'GOPAY', 'BCA', 'MANDIRI']; 

    for (let j = 0; j < donationCount; j++) {
      const amount = (Math.floor(Math.random() * 50) + 1) * 10000; // 10k - 500k
      
      await prisma.donation.create({
        data: {
          amount: amount,
          status: 'COMPLETED',
          paymentMethod: methods[Math.floor(Math.random() * methods.length)], 
          isAnonymous: Math.random() > 0.6, // 40% kemungkinan Hamba Allah
          message: Math.random() > 0.5 ? 'Semoga cepat sembuh ya meng!' : null,
          userId: shelter.id, // Kita pinjam ID shelter buat jadi user donatur dummy
          campaignId: campaign.id
        }
      });
      totalDonated += amount;
    }

    // UPDATE Campaign Current Amount biar SYNC dengan total donasi
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { currentAmount: totalDonated }
    });
  }

  /* 3. SEED CATS (Adopsi) */
  console.log('--- 🐈 MEMASUKKAN DATA KUCING... ---');
  const catNames = ['Mochi', 'Luna', 'Simba', 'Oreo', 'Garfield', 'Bella'];
  
  for (const shelter of shelters) {
    for (let k = 0; k < 2; k++) {
      const name = catNames[Math.floor(Math.random() * catNames.length)];
      await prisma.cat.create({
        data: {
          name: name, 
          age: Math.floor(Math.random() * 5) + 1, 
          gender: Math.random() > 0.5 ? 'Jantan' : 'Betina', 
          breed: 'Domestik',
          description: `Kucing lucu di ${shelter.nickname}. Sangat manja, sudah steril, dan butuh rumah baru yang hangat.`,
          images: catImagesPool[k % catImagesPool.length],
          personality: 'Manja,Aktif,Penurut', // CSV format
          health: 'Sehat,Sudah Vaksin,Steril', // CSV format
          shelterId: shelter.id, 
          isApproved: true
        }
      });
    }
  }

  console.log('✅ SEEDING SELESAI! Data Alamat Valid (4 bagian).');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });