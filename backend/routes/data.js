const express = require('express');
const prisma = require('../prismaClient');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken'); 
const router = express.Router();

// --- MIDDLEWARE AUTH ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Butuh Token' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token tidak valid' });
    req.user = user;
    next();
  });
};

// --- CONFIGURATION: MULTER ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userName = req.body.fullName.trim().replace(/\s+/g, '_').toLowerCase();
    const catName = req.body.catName.trim().replace(/\s+/g, '_').toLowerCase();
    const folderPath = path.join('uploads', 'adoptions', `${userName}_${catName}`);
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    const userName = req.body.fullName.trim().replace(/\s+/g, '_').toLowerCase();
    const catName = req.body.catName.trim().replace(/\s+/g, '_').toLowerCase();
    const folderPath = path.join('uploads', 'adoptions', `${userName}_${catName}`);
    if (file.fieldname === 'documentKtp') {
      cb(null, `ktp${path.extname(file.originalname)}`);
    } else {
      let index = 1;
      if (fs.existsSync(folderPath)) {
        const files = fs.readdirSync(folderPath).filter(f => f.startsWith('house'));
        index = files.length + 1;
      }
      cb(null, `house${index}${path.extname(file.originalname)}`);
    }
  }
});
const upload = multer({ storage: storage });

// --- ROUTES ---

// 1. GET: SEMUA KUCING
router.get('/cats', async (req, res) => {
  try {
    const cats = await prisma.cat.findMany({
      where: { isApproved: true, isAdopted: false },
      orderBy: { createdAt: 'desc' },
      include: { 
        shelter: { 
          select: { 
            name: true, 
            shelterAddress: true, 
            phoneNumber: true,
            isClinic: true,
            isShelterVerified: true,
            nickname: true
          } 
        } 
      }
    });
    res.json(cats);
  } catch (error) {
    res.status(500).json({ error: 'Gagal ambil data kucing' });
  }
});

// 2. GET: DETAIL KUCING
router.get('/cats/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cat = await prisma.cat.findUnique({
      where: { id: parseInt(id) },
      include: { shelter: { select: { name: true, shelterAddress: true, phoneNumber: true } } }
    });
    if (!cat) return res.status(404).json({ error: 'Kucing tidak ditemukan' });
    res.json(cat);
  } catch (error) {
    res.status(500).json({ error: 'Gagal ambil detail kucing' });
  }
});

// 3. POST: SUBMIT FORM ADOPSI (DENGAN CHEAT DEMO)
router.post('/adopt', authenticateToken, upload.fields([{ name: 'documentKtp', maxCount: 1 }, { name: 'homePhotos', maxCount: 5 }]), async (req, res) => {
  try {
    const { fullName, phone, ktpNumber, socialMedia, homeStatus, isPermitted, stayingWith, childAges, hasExperience, reason, job, movingPlan, isCommitted, catId, catName } = req.body;
    const userId = req.user.userId;

    const existingAdoption = await prisma.adoption.findFirst({
      where: { userId: parseInt(userId), catId: parseInt(catId), status: { in: ['PENDING', 'INTERVIEW', 'APPROVED'] } }
    });
    if (existingAdoption) return res.status(400).json({ message: 'Anda sudah mengajukan adopsi ini.' });

    const folderName = `${fullName.trim().replace(/\s+/g, '_').toLowerCase()}_${catName.trim().replace(/\s+/g, '_').toLowerCase()}`;
    const ktpPath = req.files['documentKtp'] ? `/uploads/adoptions/${folderName}/${req.files['documentKtp'][0].filename}` : '';
    const housePaths = req.files['homePhotos'] ? req.files['homePhotos'].map(f => `/uploads/adoptions/${folderName}/${f.filename}`).join(',') : '';

    const newAdoption = await prisma.adoption.create({
      data: {
        userId: parseInt(userId), catId: parseInt(catId), fullName, phone, ktpNumber, socialMedia, idCardImage: ktpPath,
        homeStatus, isPermitted: isPermitted === 'true', stayingWith, childAges, houseImages: housePaths,
        hasExperience: hasExperience === 'true', reason, job, movingPlan, isCommitted: isCommitted === 'true', status: 'PENDING'
      }
    });

    // ==========================================
    // 🔥 CHEAT MODE: DEMO DAY 🔥
    // Paksa kucing ini pindah ke akun 'shelter@gmail.com'
    // Supaya notifikasinya masuk ke HP yang sedang didemokan
    // ==========================================
    const demoShelter = await prisma.user.findUnique({ where: { email: 'shelter@gmail.com' } });
    if (demoShelter) {
        await prisma.cat.update({
            where: { id: parseInt(catId) },
            data: { shelterId: demoShelter.id }
        });
        console.log(`[DEMO] Kucing ID ${catId} dipindahkan ke Shelter ${demoShelter.email}`);
    }
    // ==========================================

    res.status(201).json({ message: 'Sukses', data: newAdoption });
  } catch (error) {
    res.status(500).json({ message: 'Gagal', error: error.message });
  }
});

// 4. GET: DAFTAR CAMPAIGN (LIST)
router.get('/campaigns', async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { 
        isApproved: true,
        isClosed: false
      },
      orderBy: { createdAt: 'asc' },
      include: { 
        shelter: { 
          select: { 
            name: true, 
            nickname: true,
            isShelterVerified: true 
          } 
        } 
      }
    });
    res.json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ error: 'Gagal ambil data campaign' });
  }
});

// 5. GET: DETAIL CAMPAIGN BY ID (SPECIFIC)
router.get('/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isNaN(id)) return res.status(400).json({ error: 'ID tidak valid' });

    const campaign = await prisma.campaign.findUnique({
      where: { id: parseInt(id) },
      include: {
        shelter: {
          select: {
            id: true,
            nickname: true,
            shelterAddress: true,
            shelterPhotos: true,
            isShelterVerified: true
          }
        },
        donations: {
          where: { status: 'COMPLETED' },
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { name: true } }
          }
        },
        updates: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign tidak ditemukan di database' });
    }

    res.json(campaign);
  } catch (error) {
    console.error("Error detail campaign:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 6. GET: SEMUA SHELTER & KLINIK
router.get('/clinics', async (req, res) => {
  try {
    const clinics = await prisma.user.findMany({
      where: { 
        role: 'SHELTER', 
        isShelterVerified: true 
      },
      select: {
        id: true,
        nickname: true,
        shelterAddress: true,
        shelterPhotos: true,
        clinicOpenHours: true,
        isClinic: true,
        services: true,
        catsRescued: true,
        operatingYear: true,
        description: true
      }
    });
    res.json(clinics);
  } catch (error) {
    res.status(500).json({ error: 'Gagal ambil data shelter' });
  }
});

// 7. POST: PROSES DONASI
router.post('/donate', authenticateToken, async (req, res) => {
  const { campaignId, amount, paymentMethod, message, isAnonymous } = req.body;

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: parseInt(campaignId) }
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign donasi tidak ditemukan.' });
    }

    const donation = await prisma.donation.create({
      data: {
        userId: req.user.userId,
        campaignId: parseInt(campaignId),
        amount: parseInt(amount),
        paymentMethod: paymentMethod || 'MANUAL',
        message: message || '',
        isAnonymous: isAnonymous || false,
        status: 'COMPLETED'
      }
    });

    await prisma.campaign.update({
      where: { id: parseInt(campaignId) },
      data: {
        currentAmount: { increment: parseInt(amount) }
      }
    });

    res.status(201).json({ message: 'Donasi berhasil diterima!', data: donation });

  } catch (error) {
    console.error("Error donation:", error);
    res.status(500).json({ message: 'Gagal memproses donasi.', error: error.message });
  }
});

module.exports = router;