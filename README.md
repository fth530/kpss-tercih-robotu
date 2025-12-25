# KPSS Tercih Robotu 🎯

KPSS adaylarının öğrenim düzeyi ve niteliklerine göre en uygun kamu kadrolarını bulmasına yardımcı olan modern web uygulaması.

## ✨ Özellikler

- 📊 **1,795 Kadro & 1,300 Nitelik Kodu** - ÖSYM 2025/2 Kılavuzu
- 🔍 **Gelişmiş Filtreleme** - Öğrenim düzeyi, şehir ve bölüm bazında arama
- ⭐ **Favoriler** - Beğendiğiniz kadroları kaydedin
- 💡 **Akıllı Arama** - Nitelik kodlarında öncelikli eşleştirme
- 🎨 **Modern Tasarım** - Dark theme, gradient efektler, responsive
- 📱 **Mobil Uyumlu** - Tüm cihazlarda sorunsuz çalışır
- ℹ️ **Tooltip Açıklamalar** - Nitelik kodlarının üzerine gelin, açıklamayı görün

## 🚀 Hızlı Başlangıç

### Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

Uygulama `http://localhost:5000` adresinde çalışır.

## 📦 Teknolojiler

### Frontend
- React 18 + TypeScript
- Tailwind CSS
- Radix UI (Tooltip, Select, Dialog)
- TanStack Query
- Wouter (Routing)
- Lucide Icons

### Backend
- Node.js + Express
- TypeScript
- JSON Storage (varsayılan)
- PostgreSQL desteği (opsiyonel)

## 🔄 Veri Güncelleme

Yeni KPSS kılavuzu yayınlandığında:

1. PDF dosyalarını `attached_assets/` klasörüne kopyalayın
2. Güncelleme komutunu çalıştırın:

```bash
npm run update
```

Bu komut:
- PDF'leri parse eder
- `parsed_data/positions.json` ve `parsed_data/qualifications.json` dosyalarını günceller
- Sunucuyu yeniden başlattığınızda yeni veriler aktif olur

## 🗄️ Veritabanı (Opsiyonel)

Varsayılan olarak JSON dosyalarından veri okunur. PostgreSQL kullanmak isterseniz:

1. `.env` dosyası oluşturun:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/kpss
```

2. Veritabanını hazırlayın:
```bash
npm run db:push  # Tabloları oluştur
npm run seed     # Verileri yükle
```

## 📝 Komutlar

```bash
npm run dev      # Geliştirme sunucusu
npm run build    # Production build
npm run start    # Production sunucusu
npm run update   # PDF'leri parse et ve verileri güncelle
npm run check    # TypeScript kontrolü
```

## 📂 Proje Yapısı

```
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # UI bileşenleri
│   │   ├── hooks/       # Custom hooks
│   │   ├── pages/       # Sayfa bileşenleri
│   │   └── lib/         # Yardımcı fonksiyonlar
├── server/              # Express backend
│   ├── db.ts           # Veritabanı şeması
│   ├── storage.ts      # Veri erişim katmanı
│   └── routes.ts       # API endpoint'leri
├── script/              # Yardımcı scriptler
│   ├── parse-all.ts    # PDF parser
│   └── seed-db.ts      # Veritabanı seed
├── attached_assets/     # ÖSYM PDF dosyaları
└── parsed_data/         # Parse edilmiş JSON veriler
```

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing`)
3. Commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Push edin (`git push origin feature/amazing`)
5. Pull Request açın

## 📄 Lisans

MIT

## 🙏 Teşekkürler

- ÖSYM resmi kılavuz verileri
- [pdfjs-dist](https://github.com/mozilla/pdf.js) - PDF parsing
- [Radix UI](https://www.radix-ui.com/) - UI primitives
