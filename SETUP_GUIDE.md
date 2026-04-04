# Daena v1.0 — Kurulum Rehberi
## Personal AI Command Center

---

## Gereksinimler

### Zorunlu
| Gereksinim | Versiyon | Kontrol |
|-----------|---------|---------|
| **Python 3** | 3.10+ | `python3 --version` |
| **Node.js** | 18+ | `node --version` |
| **Rust** | 1.70+ | `rustc --version` |

### Opsiyonel
| Araç | Ne İçin |
|------|--------|
| **Claude Code** | Ana Beyin olarak Claude Opus (Pro abonelik gerekli) |
| **Android Studio** | Android APK build etmek için |
| **Xcode** | iOS build etmek için (sadece macOS) |

---

## Hızlı Kurulum (5 Dakika)

### 1. Depoyu Klonla
```bash
git clone https://github.com/KULLANICI/daena.git
cd daena/daena-app
```

### 2. Bağımlılıkları Kur
```bash
# Frontend
npm install

# Rust (ilk sefer uzun sürer)
cd src-tauri && cargo build && cd ..

# Python backend (opsiyonel paketler)
pip3 install requests
```

### 3. API Key Yapılandır
```bash
cp backend/.env.example backend/.env
```

`.env` dosyasını aç ve OpenRouter API key'ini ekle:
```
OPENROUTER_API_KEY=sk-or-v1-SENIN-ANAHTARIN
```

> 💡 **Ücretsiz key al:** https://openrouter.ai/keys
> 13 ücretsiz model = ~2,600 ücretsiz istek/gün

### 4. Uygulamayı Başlat

**Geliştirme modu (önerilen):**
```bash
# Terminal 1: Backend
cd backend && python3 server.py

# Terminal 2: Frontend + Tauri
npx tauri dev
```

**Tek komutla:**
```bash
chmod +x start.sh && ./start.sh
```

---

## Platform Bazlı Build

### macOS (.dmg)
```bash
npx tauri build
# Çıktı: src-tauri/target/release/bundle/dmg/Daena_1.0.0_aarch64.dmg
```

### Windows (.msi)
```bash
# Windows makinede:
npx tauri build
# Çıktı: src-tauri/target/release/bundle/nsis/Daena_1.0.0_x64-setup.exe
```

### Linux (.AppImage)
```bash
npx tauri build
# Çıktı: src-tauri/target/release/bundle/appimage/Daena_1.0.0_amd64.AppImage
```

### iOS
```bash
# Xcode yüklü olmalı
npx tauri ios init
npx tauri ios build
# Xcode'da aç: src-tauri/gen/apple/daena.xcodeproj
```

### Android (.apk)
```bash
# Android Studio + SDK yüklü olmalı
npx tauri android init
npx tauri android build
# Çıktı: src-tauri/gen/android/app/build/outputs/apk/
```

---

## GitHub Actions ile Otomatik Build

Repo'ya push yaptığında CI/CD otomatik çalışır:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Bu, GitHub Actions'da şunları tetikler:
- ✅ macOS (Apple Silicon + Intel) → `.dmg`
- ✅ Windows → `.exe` installer
- ✅ Linux → `.AppImage` + `.deb`
- ✅ Android → `.apk`

Build'ler GitHub Releases sayfasında yayınlanır.

---

## Test Kullanıcıları İçin Hızlı Başlangıç

### Adım 1: Uygulamayı İndir
GitHub Releases sayfasından platformuna uygun dosyayı indir:
- macOS: `Daena_1.0.0_aarch64.dmg` (Apple Silicon) veya `Daena_1.0.0_x64.dmg` (Intel)
- Windows: `Daena_1.0.0_x64-setup.exe`

### Adım 2: Kur ve Aç
- macOS: DMG'yi aç, Daena'yı Applications'a sürükle
- Windows: Installer'ı çalıştır

### Adım 3: İlk Kurulum Sihirbazı
1. Dil seç (Türkçe / English)
2. OpenRouter API key gir (https://openrouter.ai/keys'den ücretsiz al)
3. Entegrasyonları seç (opsiyonel)
4. 8 ajanını tanı
5. Başla!

### Adım 4: İlk Mesaj
```
Merhaba Daena, sistem durumun nasıl?
```

### Agent'lara Direkt Mesaj
```
@finance Bu ay için fatura oluştur
@research Rakip analizi yap: XYZ şirketi
@data Yeni lead'leri bul
```

---

## Mimari

```
daena/
├── daena-app/
│   ├── src/                    # React frontend
│   │   ├── components/
│   │   │   ├── chat/          # Chat arayüzü
│   │   │   ├── dashboard/     # Sistem paneli
│   │   │   ├── agents/        # Ajan yönetimi
│   │   │   ├── settings/      # Ayarlar
│   │   │   ├── setup/         # Kurulum sihirbazı
│   │   │   └── layout/        # Sidebar, TopBar
│   │   ├── stores/            # Zustand state
│   │   ├── lib/               # API client
│   │   ├── types/             # TypeScript types
│   │   └── i18n.ts            # Çok dilli destek
│   │
│   ├── src-tauri/             # Rust native backend
│   │   ├── src/
│   │   │   ├── lib.rs         # Tauri app + backend auto-start
│   │   │   ├── commands.rs    # Tauri IPC commands
│   │   │   └── main.rs        # Entry point
│   │   └── tauri.conf.json    # App yapılandırması
│   │
│   ├── backend/               # Python AI backend
│   │   ├── scripts/
│   │   │   ├── brain.py       # Ana beyin
│   │   │   ├── worker_pool.py # 20-model kaskad
│   │   │   ├── orchestrator.py # Görev yönlendirici
│   │   │   ├── memory_manager.py # Katmanlı hafıza
│   │   │   ├── message_bus.py # Ajan iletişimi
│   │   │   └── agent_triggers.py # Otonom tetikleyiciler
│   │   ├── server.py          # HTTP API (port 8910)
│   │   ├── agents/            # 8 departman ajani
│   │   └── config/            # Ayarlar
│   │
│   └── dist/                  # Build çıktısı
│
├── .github/workflows/         # CI/CD
│   └── build-all.yml         # Tüm platformlar
│
└── SETUP_GUIDE.md            # Bu dosya
```

## Model Kaskadı (20 Model, Asla Susmaz)

| Tier | Model | Fiyat | Context |
|------|-------|-------|---------|
| T0 | Qwen 3.6 Plus | FREE | 1M |
| T1 | Llama 4 Maverick | FREE | 1M |
| T1 | Qwen 3 Coder | FREE | 128K |
| T1 | Devstral 2 | FREE | 256K |
| T1 | DeepSeek R1 | FREE | 164K |
| T1 | Nemotron 120B | FREE | 262K |
| T1 | GPT-OSS 120B | FREE | 131K |
| T1 | Qwen Next 80B | FREE | 262K |
| T2 | Llama 4 Scout | FREE | 512K |
| T2 | MiniMax M2.5 | FREE | 1M |
| T2 | Gemma 3 27B | FREE | 128K |
| T2 | Step 3.5 Mini | FREE | 128K |
| T2 | Llama 3.3 70B | FREE | 128K |
| T3 | GPT-OSS (paid) | $0.04/M | 131K |
| T3 | Gemini 2.5 Flash Lite | $0.10/M | 1M |
| T3 | Gemma 4 31B | $0.14/M | 262K |
| T3 | GPT-4o Mini | $0.15/M | 128K |
| T3 | Gemini 3.1 Flash Lite | $0.25/M | 1M |
| T3 | DeepSeek V3.2 | $0.26/M | 164K |
| T3 | Claude 3.5 Haiku | $0.80/M | 200K |

> **13 ücretsiz model = ~2,600 ücretsiz istek/gün**
> Ücretli modeller sadece tüm ücretsizler bittiğinde kullanılır.

---

## Sorun Giderme

### "Backend not running" hatası
```bash
cd daena-app/backend
python3 server.py
# Port 8910'da çalışmalı
```

### "All models exhausted" hatası
- `.env` dosyasında `OPENROUTER_API_KEY` doğru mu kontrol et
- https://openrouter.ai/account'da kredi durumunu kontrol et

### macOS "Developer cannot be verified" uyarısı
```bash
xattr -cr /Applications/Daena.app
```

### Rust build hatası
```bash
# Rust güncelle
rustup update stable
```

---

## Destek

- GitHub Issues: [repo]/issues
- Telegram: @daena_support (yakında)

---

*Daena — Zoroastrian geleneğinden gelen "iç görüş, vizyon-ruhu" anlamına gelir.*
*Zerdüşt felsefesinin "hakikati görme" kavramından esinlenilmiştir.*
