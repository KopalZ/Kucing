const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const jwt = require('jsonwebtoken');

// Middleware Cek Login & Role Shelter
const authenticateShelter = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Butuh Token' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token invalid' });
    if (user.role !== 'SHELTER') return res.status(403).json({ message: 'Khusus Shelter' });
    req.user = user;
    next();
  });
};

// 1. GET: Daftar Request Adopsi Masuk
router.get('/adoptions', authenticateShelter, async (req, res) => {
  try {
    const requests = await prisma.adoption.findMany({
      where: {
        cat: {
          shelterId: req.user.userId 
        }
      },
      include: {
        cat: true,
        user: { 
          select: { 
            name: true, 
            email: true, 
            phoneNumber: true // <--- PERBAIKAN DI SINI (Sebelumnya 'phone')
          } 
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal ambil data adopsi' });
  }
});

// 2. PUT: Terima / Tolak Adopsi
router.put('/adoption/:id', authenticateShelter, async (req, res) => {
  const { status } = req.body; 
  
  try {
    const updated = await prisma.adoption.update({
      where: { id: parseInt(req.params.id) },
      data: { status: status }
    });

    if (status === 'APPROVED') {
       await prisma.cat.update({
         where: { id: updated.catId },
         data: { isAdopted: true } 
       });
    }

    res.json({ message: 'Status berhasil diupdate', data: updated });
  } catch (error) {
    res.status(500).json({ message: 'Gagal update status' });
  }
});

module.exports = router;