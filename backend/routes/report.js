const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');

// ==========================================
// 1. MIDDLEWARE (SATPAM)
// ==========================================

// A. Satpam Galak (Wajib Login) - Dipakai untuk ADMIN
// ---> INI YANG HILANG DI KODE KAMU SEBELUMNYA <---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Akses ditolak. Butuh Token.' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token tidak valid' });
    req.user = user;
    next();
  });
};

// B. Satpam Ramah (Cek Login tapi Boleh Guest) - Dipakai untuk LAPOR
const checkUser = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    req.user = null; // Dianggap Guest
    return next();
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    req.user = err ? null : user;
    next();
  });
};

// ==========================================
// 2. KONFIGURASI FILE
// ==========================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// ==========================================
// 3. ROUTES USER (LAPOR)
// ==========================================
router.post('/create', checkUser, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
  try {
    const { 
      reporterName, reporterPhone, conditionTags, 
      description, address, latitude, longitude 
    } = req.body;

    let finalUserId = req.user ? req.user.userId : null;
    let finalName = reporterName;
    let finalPhone = reporterPhone;

    if (!finalUserId && (!finalName || !finalPhone)) {
      return res.status(400).json({ message: 'Nama dan Nomor HP wajib diisi untuk tamu.' });
    }

    const imageUrl = req.files && req.files['image'] ? `/uploads/${req.files['image'][0].filename}` : null;
    const videoUrl = req.files && req.files['video'] ? `/uploads/${req.files['video'][0].filename}` : null;

    if (!imageUrl) return res.status(400).json({ message: 'Foto kondisi wajib diunggah.' });

    const report = await prisma.report.create({
      data: {
        userId: finalUserId,
        reporterName: finalName || null,
        reporterPhone: finalPhone || null,
        conditionTags: conditionTags,
        description: description,
        imageUrl: imageUrl,
        videoUrl: videoUrl,
        address: address,
        latitude: parseFloat(latitude || 0),
        longitude: parseFloat(longitude || 0),
        status: 'PENDING'
      }
    });

    res.status(201).json({ message: 'Laporan berhasil dikirim!', report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengirim laporan.' });
  }
});

// ==========================================
// 4. ROUTES ADMIN (DASHBOARD)
// ==========================================

// GET ALL REPORTS
router.get('/all', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Akses ditolak. Khusus Admin.' });
  }

  try {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } }
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data laporan.' });
  }
});

// UPDATE STATUS REPORT
router.put('/status/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Akses ditolak.' });
  }

  const { status } = req.body;

  try {
    const updatedReport = await prisma.report.update({
      where: { id: parseInt(req.params.id) },
      data: { status: status }
    });
    res.json({ message: 'Status berhasil diubah!', data: updatedReport });
  } catch (error) {
    res.status(500).json({ message: 'Gagal update status.' });
  }
});

module.exports = router;