const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// --- CONFIGURATION: MULTER DYNAMIC STORAGE ---
// Ganti bagian storage di auth.js
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user.userId;
    const userDir = path.join('uploads', `${userId}_shelterReq`);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    if (file.fieldname === 'documentKtp') {
      cb(null, `ktp${path.extname(file.originalname)}`);
    } else {
      // Logic penamaan shelter1.jpg, shelter2.jpg, dst
      // Kita gunakan body counter atau fieldname index jika tersedia
      // Cara paling aman adalah mengecek jumlah file yang sudah ada di folder tersebut
      const userId = req.user.userId;
      const userDir = path.join('uploads', `${userId}_shelterReq`);
      
      let index = 1;
      if (fs.existsSync(userDir)) {
        const files = fs.readdirSync(userDir).filter(f => f.startsWith('shelter'));
        index = files.length + 1;
      }
      cb(null, `shelter${index}${path.extname(file.originalname)}`);
    }
  }
});

const upload = multer({ storage: storage });

// --- MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Akses ditolak (Butuh Token)' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token tidak valid' });
    req.user = user;
    next();
  });
};

// --- ROUTES ---

// 1. REGISTER
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: 'Email sudah terdaftar.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });
    res.status(201).json({ message: 'User berhasil dibuat', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Email atau password salah.' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Email atau password salah.' });

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userWithoutPassword } = user;
    res.json({ message: 'Login berhasil', token, user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. GET PROFILE
router.get('/profile', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: { select: { donations: true, reports: true, adoptions: true } }
      }
    });

    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    const { password, ...userData } = user;
    res.json({
      user: userData,
      stats: { donations: user._count.donations, reports: user._count.reports, adoptions: user._count.adoptions }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil profil' });
  }
});

// 4. CHECK PHONE DUPLICATE
router.post('/check-phone', authenticateToken, async (req, res) => {
  const { phoneNumber } = req.body;
  const userId = req.user.userId;
  
  if (!phoneNumber) return res.status(200).json({ available: true });

  try {
    const existingUser = await prisma.user.findFirst({
      where: { phoneNumber: phoneNumber }
    });
    
    if (existingUser && existingUser.id !== userId) {
      return res.status(409).json({ available: false, message: 'Nomor telepon telah digunakan.' });
    }

    res.json({ available: true });
  } catch (error) {
    res.status(500).json({ message: 'Error checking phone' });
  }
});

// 5. UPDATE PROFILE (FIXED NULL CHECK FOR req.files)
router.put('/update-profile', authenticateToken, upload.fields([
  { name: 'documentKtp', maxCount: 1 },
  { name: 'shelterPhotos', maxCount: 5 }
]), async (req, res) => {
  const { nickname, phoneNumber, shelterAddress, isClinic, clinicOpenHours } = req.body;
  const userId = req.user.userId; 

  try {
    const updateData = {};
    if (nickname) updateData.nickname = nickname;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (shelterAddress) updateData.shelterAddress = shelterAddress;
    if (clinicOpenHours) updateData.clinicOpenHours = clinicOpenHours;

    if (req.files) {
      if (req.files['documentKtp'] && req.files['documentKtp'][0]) {
        updateData.documentKtp = `/uploads/${userId}_shelterReq/${req.files['documentKtp'][0].filename}`;
      }
      
      if (req.files['shelterPhotos'] && req.files['shelterPhotos'].length > 0) {
        const paths = req.files['shelterPhotos'].map(f => `/uploads/${userId}_shelterReq/${f.filename}`);
        updateData.shelterPhotos = paths.join(',');
      }
    }

    if (isClinic !== undefined) {
      updateData.isClinic = isClinic === 'true' || isClinic === true;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    const { password, ...userWithoutPassword } = updatedUser;
    res.json({ message: 'Pendaftaran shelter berhasil dikirim', user: userWithoutPassword });

  } catch (error) {
    console.error("PRISMA UPDATE ERROR:", error);
    res.status(500).json({ message: 'Gagal memperbarui database.', error: error.message });
  }
});

// 6. RESET / CHANGE PASSWORD
router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email: email },
      data: { password: hashedPassword }
    });
    res.json({ message: 'Kata sandi berhasil diperbarui' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui kata sandi' });
  }
});

// 7. GET ALL ACTIVITIES
router.get('/activities', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    const reports = await prisma.report.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' }
    });

    const adoptions = await prisma.adoption.findMany({
      where: { userId: userId },
      include: { 
        cat: {
          include: {
            shelter: { select: { shelterAddress: true, name: true } } // Ambil lokasi dari user shelter
          }
        } 
      },
      orderBy: { createdAt: 'desc' }
    });

    const donations = await prisma.donation.findMany({
      where: { userId: userId },
      include: { campaign: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ reports, adoptions, donations });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil riwayat aktivitas' });
  }
});

// 8. VERIFY CURRENT PASSWORD
router.post('/verify-password', authenticateToken, async (req, res) => {
  const { currentPassword } = req.body;
  const userId = req.user.userId;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) return res.status(401).json({ message: 'Kata sandi saat ini salah.' });
    res.json({ message: 'Password terverifikasi' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal verifikasi kata sandi' });
  }
});

module.exports = router;