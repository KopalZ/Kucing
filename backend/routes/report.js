const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');

// Konfigurasi Penyimpanan File
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// Middleware opsional: Cek login tapi tidak memaksa (untuk membedakan User/Guest)
const checkUser = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    req.user = null;
    return next();
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    req.user = err ? null : user;
    next();
  });
};

// POST: Buat Laporan Baru
router.post('/create', checkUser, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
  try {
    const { 
      reporterName, reporterPhone, conditionTags, 
      description, address, latitude, longitude 
    } = req.body;

    // Logic Pelapor
    let finalUserId = req.user ? req.user.userId : null;
    let finalName = reporterName;
    let finalPhone = reporterPhone;

    // Validasi: Jika Guest, nama & hp wajib ada
    if (!finalUserId && (!finalName || !finalPhone)) {
      return res.status(400).json({ message: 'Nama dan Nomor HP wajib diisi untuk tamu.' });
    }

    // Ambil path file
    const imageUrl = req.files['image'] ? `/uploads/${req.files['image'][0].filename}` : null;
    const videoUrl = req.files['video'] ? `/uploads/${req.files['video'][0].filename}` : null;

    if (!imageUrl) return res.status(400).json({ message: 'Foto kondisi wajib diunggah.' });

    const report = await prisma.report.create({
      data: {
        userId: finalUserId,
        reporterName: finalName || null,
        reporterPhone: finalPhone || null,
        conditionTags: conditionTags, // Berupa string "Luka, Lemas"
        description: description,
        imageUrl: imageUrl,
        videoUrl: videoUrl,
        address: address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        status: 'PENDING'
      }
    });

    res.status(201).json({ message: 'Laporan berhasil dikirim!', report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengirim laporan.' });
  }
});

module.exports = router;