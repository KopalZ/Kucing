// GET: Semua aktivitas user (Laporan, Adopsi, Donasi)
router.get('/activities', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const reports = await prisma.report.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' }
    });

    // Nanti tambahkan adopsi & donasi di sini setelah tabelnya siap
    res.json({ reports, adoptions: [], donations: [] });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil riwayat.' });
  }
});