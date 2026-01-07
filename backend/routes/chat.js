const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const jwt = require('jsonwebtoken');

// Middleware Auth
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Butuh Token' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token invalid' });
    req.user = user;
    next();
  });
};

// 1. KIRIM PESAN (POST)
router.post('/send', authenticateToken, async (req, res) => {
  const { receiverId, content } = req.body;

  try {
    const message = await prisma.message.create({
      data: {
        senderId: req.user.userId,
        receiverId: parseInt(receiverId),
        content: content,
        isRead: false
      }
    });
    res.status(201).json(message);
  } catch (error) {
    console.error("Chat Send Error:", error);
    res.status(500).json({ message: 'Gagal kirim pesan' });
  }
});

// 2. LIHAT HISTORY CHAT DENGAN SESEORANG (GET)
router.get('/history/:partnerId', authenticateToken, async (req, res) => {
  const { partnerId } = req.params;
  const myId = req.user.userId;

  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: myId, receiverId: parseInt(partnerId) }, // Pesan saya ke dia
          { senderId: parseInt(partnerId), receiverId: myId }  // Pesan dia ke saya
        ]
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Gagal ambil history chat' });
  }
});

// 3. INBOX (DEBUG VERSION) - PENTING BUAT CEK MASALAH KOSONG
router.get('/inbox', authenticateToken, async (req, res) => {
  const myId = req.user.userId;
  console.log(`[DEBUG] Request Inbox dari User ID: ${myId}`); // <--- LOG 1: Siapa yang login?

  try {
    // Ambil semua pesan yang melibatkan saya
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: myId }, { receiverId: myId }]
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        receiver: { select: { id: true, name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`[DEBUG] Ditemukan ${messages.length} pesan mentah di database.`); // <--- LOG 2: Ada berapa pesan?

    // Filter Unik
    const chatList = [];
    const processedIds = new Set();

    messages.forEach(msg => {
      const partner = msg.senderId === myId ? msg.receiver : msg.sender;
      
      // Safety Check: Kalau user partner sudah dihapus
      if (!partner) {
         console.log(`[DEBUG] Skip pesan ID ${msg.id} karena partner tidak ditemukan.`);
         return;
      }

      if (!processedIds.has(partner.id)) {
        processedIds.add(partner.id);
        chatList.push({
          partnerId: partner.id,
          partnerName: partner.name,
          partnerRole: partner.role,
          lastMessage: msg.content,
          time: msg.createdAt,
          isRead: msg.senderId === myId ? true : msg.isRead
        });
      }
    });

    console.log(`[DEBUG] Hasil Akhir Inbox:`, chatList); // <--- LOG 3: Apa yang dikirim ke HP?
    res.json(chatList);
  } catch (error) {
    console.error("[DEBUG] Error Inbox:", error);
    res.status(500).json({ message: 'Gagal ambil inbox' });
  }
});

// 4. GET CONTACTS
router.get('/contacts', authenticateToken, async (req, res) => {
  try {
    const contacts = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SHELTER'] },
        NOT: { id: req.user.userId }
      },
      select: {
        id: true,
        name: true,
        role: true,
        nickname: true 
      }
    });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Gagal ambil kontak' });
  }
});

module.exports = router;