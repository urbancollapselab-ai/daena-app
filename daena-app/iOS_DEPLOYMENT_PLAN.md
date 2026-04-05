# DAENA v10.0: iOS NATIVE DEPLOYMENT SCHEMA
**Mimar: The Ultimate Architect**

Daena v10.0'in masaüstünden mobil ekrana (iOS) taşınması için gereken "Tauri Mobile" köprü mimarisinin şemasıdır. Daena bir "Cloud" yazılımı olmadığı için, iOS versiyonu da doğrudan bir "Backend Wrapper" olmak zorundadır.

## 1. Tauri Configuration for iOS (`src-tauri/tauri.conf.json`)

Daena v10.0 Apple App Store (iOS) veya TestFlight için derlenirken şu Tauri konfigürasyonlarını aktif etmelidir:

```json
{
  "tauri": {
    "bundle": {
      "identifier": "com.daena.v10",
      "iOS": {
        "developmentTeam": "YOUR_APPLE_TEAM_ID",
        "frameworks": []
      }
    },
    "allowlist": {
      "all": false,
      "fs": {
        "all": true,
        "scope": ["$APPData/daena**"]
      },
      "http": {
        "all": true,
        "request": true
      }
    }
  }
}
```

## 2. iOS Local LLM Limitations (The 8GB VRAM Rule)
iPhone cihazlarında Apple Silicon (A16/A17) mimarisi çok güçlü olsa da, donanımsal RAM kapasitesi 8GB'ın altında olan modellerde "Hardware-Aware MoA" (`worker_pool.py`) otomatik olarak:
- **Yerel Üretim:** Yalnızca 1.5B (Milyar) ila 3B parametreli (Qwen1.5-1.8B veya Phi-3-mini) modellerin iOS NPU (Neural Processing Unit) üzerinden çalışmasına izin verir.
- **Bulut Devri:** Watchdog bellek sınırını geçtiğini anlarsa, görevleri şifrelenmiş LTL kanalları üzerinden OpenRouter API ile 70B'luk modellere offload eder. (Tamamen Otonom).

## 3. iOS Build Command (CI/CD)
Eğer macOS terminalinizdeyseniz ve iOS için Simulator veya Fiziksel cihaz çıktısı almak isterseniz:

```bash
# İlk önce mobil ortamı kurun:
npm run tauri ios init

# Kurulumu iOS cihazına derlemek ve açmak için:
npm run tauri ios dev

# Apple App Store için final IPA paketinin derlenmesi:
npm run tauri ios build
```

**[ONAY TEYİDİ:]** Bu şema, "Sprint 5: Platform Deploy" kapsamında oluşturulmuştur.
