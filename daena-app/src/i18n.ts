import { useAppStore } from "@/stores/appStore";

type Dictionary = Record<string, string>;

const en: Dictionary = {
  // Navigation
  "nav.chat": "Chat",
  "nav.dashboard": "Dashboard",
  "nav.agents": "Agents",
  "nav.settings": "Settings",
  "nav.newChat": "New Chat",
  "nav.search": "Search chats...",
  "nav.today": "TODAY",

  // Setup Wizard
  "setup.welcome": "Welcome to Daena",
  "setup.welcomeDesc": "Your autonomous AI command center",
  "setup.welcomeSub": "8 AI agents • 20 models • Zero config",
  "setup.start": "Start Setup",
  "setup.prev": "Back",
  "setup.next": "Continue",
  "setup.complete": "Complete Setup",
  "setup.save": "Testing & Saving API Keys",

  // Showcase
  "showcase.what": "What You're Installing",
  "showcase.swipe": "Swipe through to see what Daena can do",
  "showcase.brain.title": "Autonomous AI Brain",
  "showcase.brain.sub": "Claude Opus 4.6 + 20 Model Cascade",
  "showcase.brain.f1": "Self-thinking main brain that orchestrates everything",
  "showcase.brain.f2": "20 AI models from FREE to premium tier",
  "showcase.brain.f3": "Automatic model selection for cost optimization",
  "showcase.brain.f4": "Zero manual intervention — fully autonomous",
  "showcase.agents.title": "8 Specialized AI Agents",
  "showcase.agents.sub": "Your personal AI workforce",
  "showcase.agents.f1": "💰 Finance — Invoicing, budgets, expense tracking",
  "showcase.agents.f2": "📊 Data — Lead enrichment, CRM, data collection",
  "showcase.agents.f3": "📣 Marketing — Content, campaigns, social media",
  "showcase.agents.f4": "🎯 Sales — Outreach, proposals, deal management",
  "showcase.agents.f5": "🔬 Research — Market analysis, competitor tracking",
  "showcase.agents.f6": "🛡️ Watchdog — System health monitoring 24/7",
  "showcase.agents.f7": "💓 Heartbeat — Uptime tracking, scheduled reports",
  "showcase.agents.f8": "🎭 Coordinator — Inter-agent task routing",
  "showcase.control.title": "Real-time Command Center",
  "showcase.control.sub": "Full control over your AI operations",
  "showcase.control.f1": "Live dashboard with system metrics & KPIs",
  "showcase.control.f2": "Per-agent monitoring with activity sparklines",
  "showcase.control.f3": "Model cascade visualization (T0 → T3 tiers)",
  "showcase.control.f4": "Request volume tracking & cost analysis",
  "showcase.platform.title": "Works Everywhere",
  "showcase.platform.sub": "Desktop + Mobile — One system",
  "showcase.platform.f1": "🖥️ macOS & Windows native desktop app",
  "showcase.platform.f2": "📱 Mobile access via QR code (iOS & Android)",
  "showcase.platform.f3": "🌐 Coworking mode — share access securely",
  "showcase.platform.f4": "🔒 Local-first — your data stays on your machine",
  "showcase.ready": "I'm Ready — Let's Go",
  "showcase.stats.agents": "AI Agents",
  "showcase.stats.models": "Models",
  "showcase.stats.free": "Free Models",
  "showcase.stats.lang": "Languages",

  "setup.profile": "Profile",
  "setup.nameDesc": "How should Daena address you?",
  "setup.businessDesc": "What is the name of your business?",
  "setup.industryDesc": "What industry are you in? (e.g. e-commerce, saas)",

  "setup.systemTitle": "System Setup",
  "setup.systemDesc": "Scanning & installing dependencies",
  "setup.claudePro": "Claude Pro Desktop (Required for Main Brain)",
  "setup.detecting": "Detecting...",
  "setup.installing": "Installing... Please wait.",
  "setup.installed": "✅ Installed and Active",
  "setup.wait": "Please wait for installation to finish.",
  "setup.installMissing": "Install All Missing Dependencies",
  "setup.authDesc": "Autonomous Access: Daena needs terminal & file system access. Permissions are granted once — no repeated prompts.",

  "setup.apiTitle": "Connect Your AI",
  "setup.apiDesc": "Power the 20-model cascade",
  "setup.apiLabel": "OpenRouter API Key",
  "setup.invalidKey": "Invalid API Key. Please test it first.",
  "setup.testKey": "Test Key",
  "setup.keyValid": "Key valid — 20 models available",
  "setup.optDesc": "(optional)",

  "setup.teamTitle": "Build Your Team",
  "setup.teamDesc": "About you & your AI agents",
  "setup.company": "Company / Project",
  "setup.industry": "Industry",

  "setup.finalizeTitle": "Daena is Ready",
  "setup.finalizing": "Your autonomous AI command center is configured.",
  "setup.success": "System Fully Operational.",
  "setup.launch": "Launch Daena 🔥",
  "setup.updateLater": "You can update everything later in Settings.",

  // Chat
  "chat.empty": "Message Daena... (use @agent to target specific agent)",
  "chat.footnote": "Daena uses a 20-model cascade. Free models are tried first.",
  "chat.error": "All models are currently unavailable. Please try again shortly.",
  "chat.online": "Online",
  "chat.models": "Models",

  // Settings
  "settings.title": "Settings",
  "settings.language": "Language",
  "settings.theme": "Theme",
  "settings.save": "Save Settings",
  "settings.saved": "Settings saved successfully",
  
  // App
  "daena.title": "Daena — Artificial Intelligence Command Center",
};

const tr: Dictionary = {
  // Navigation
  "nav.chat": "Sohbet",
  "nav.dashboard": "Panel",
  "nav.agents": "Ajanlar",
  "nav.settings": "Ayarlar",
  "nav.newChat": "Yeni Sohbet",
  "nav.search": "Sohbetlerde ara...",
  "nav.today": "BUGÜN",

  // Setup Wizard
  "setup.welcome": "Daena'ya Hoş Geldiniz",
  "setup.welcomeDesc": "Otonom yapay zeka komuta merkeziniz",
  "setup.welcomeSub": "8 yapay zeka ajanı • 20 model • Sıfır yapılandırma",
  "setup.start": "Başla",
  "setup.prev": "Geri",
  "setup.next": "Devam Et",
  "setup.complete": "Tamamla",
  "setup.save": "API Anahtarları Test Ediliyor",

  // Showcase
  "showcase.what": "Neler Kuruyorsunuz",
  "showcase.swipe": "Daena'nın yeteneklerini görmek için kaydırın",
  "showcase.brain.title": "Otonom Yapay Zeka Beyni",
  "showcase.brain.sub": "Claude Opus 4.6 + 20 Model Kademesi",
  "showcase.brain.f1": "Her şeyi koordine eden kendi kendine düşünen ana beyin",
  "showcase.brain.f2": "Ücretsizden premium'a 20 yapay zeka modeli",
  "showcase.brain.f3": "Maliyet optimizasyonu için otomatik model seçimi",
  "showcase.brain.f4": "Sıfır manuel müdahale — tamamen otonom",
  "showcase.agents.title": "8 Uzman Yapay Zeka Ajanı",
  "showcase.agents.sub": "Kişisel yapay zeka iş gücünüz",
  "showcase.agents.f1": "💰 Finans — Faturalandırma, bütçeler, gider takibi",
  "showcase.agents.f2": "📊 Veri — Lead zenginleştirme, CRM, veri toplama",
  "showcase.agents.f3": "📣 Pazarlama — İçerik, kampanyalar, sosyal medya",
  "showcase.agents.f4": "🎯 Satış — İletişim, teklifler, anlaşma yönetimi",
  "showcase.agents.f5": "🔬 Araştırma — Pazar analizi, rakip takibi",
  "showcase.agents.f6": "🛡️ Gözlemci — 7/24 sistem sağlığı izleme",
  "showcase.agents.f7": "💓 Kalp Atışı — Çalışma süresi takibi, zamanlanmış raporlar",
  "showcase.agents.f8": "🎭 Koordinatör — Ajanlar arası görev dağıtımı",
  "showcase.control.title": "Gerçek Zamanlı Kontrol Merkezi",
  "showcase.control.sub": "Yapay zeka operasyonlarınız üzerinde tam denetim",
  "showcase.control.f1": "Sistem metrikleri ve KPI'lar içeren canlı panel",
  "showcase.control.f2": "Aktivite grafikleri ile ajan bazında izleme",
  "showcase.control.f3": "Model kademesi görselleştirme (T0 → T3)",
  "showcase.control.f4": "İstek hacmi takibi ve maliyet analizi",
  "showcase.platform.title": "Her Yerde Çalışır",
  "showcase.platform.sub": "Masaüstü + Mobil — Tek sistem",
  "showcase.platform.f1": "🖥️ macOS ve Windows yerel uygulaması",
  "showcase.platform.f2": "📱 QR kod ile mobil erişim (iOS ve Android)",
  "showcase.platform.f3": "🌐 Coworking modu — erişimi güvenle paylaşın",
  "showcase.platform.f4": "🔒 Tamamen Yerel — verileriniz makinenizde kalır",
  "showcase.ready": "Hazırım — Başlayalım",
  "showcase.stats.agents": "YZ Ajanı",
  "showcase.stats.models": "Model",
  "showcase.stats.free": "Ücretsiz Model",
  "showcase.stats.lang": "Dil",

  "setup.profile": "Profil",
  "setup.nameDesc": "Daena size nasıl hitap etsin?",
  "setup.businessDesc": "İşletmenizin adı nedir?",
  "setup.industryDesc": "Hangi sektördesiniz? (örn. e-ticaret, saas)",

  "setup.systemTitle": "Sistem Kurulumu",
  "setup.systemDesc": "Bağımlılıklar taranıyor ve kuruluyor",
  "setup.claudePro": "Claude Pro Desktop (Ana Beyin için gerekli)",
  "setup.detecting": "Algılanıyor...",
  "setup.installing": "Kuruluyor... Lütfen bekleyin.",
  "setup.installed": "✅ Kurulu ve Aktif",
  "setup.wait": "Lütfen kurulumun tamamlanmasını bekleyin.",
  "setup.installMissing": "Tüm Eksik Bağımlılıkları Kur",
  "setup.authDesc": "Otonom Erişim: Daena'nın terminal ve dosya erişimine ihtiyacı var. İzinler bir kez verilir - sürekli sorulmaz.",

  "setup.apiTitle": "Yapay Zekanızı Bağlayın",
  "setup.apiDesc": "20 model kademesini güçlendirin",
  "setup.apiLabel": "OpenRouter API Anahtarı",
  "setup.invalidKey": "Geçersiz API Anahtarı. Lütfen önce test edin.",
  "setup.testKey": "Test Et",
  "setup.keyValid": "Anahtar Geçerli — 20 model kullanıma hazır",
  "setup.optDesc": "(opsiyonel)",

  "setup.teamTitle": "Ekibinizi Kurun",
  "setup.teamDesc": "Siz ve yapay zeka ajanlarınız hakkında",
  "setup.company": "Şirket / Proje Adı",
  "setup.industry": "Sektör",

  "setup.finalizeTitle": "Daena Hazır",
  "setup.finalizing": "Otonom yapay zeka komuta merkeziniz yapılandırıldı.",
  "setup.success": "Tamamlandı",
  "setup.launch": "Daena'yı Başlat 🔥",
  "setup.updateLater": "Her şeyi daha sonra Ayarlar'dan güncelleyebilirsiniz.",

  // Chat
  "chat.empty": "Daena'ya mesaj gönder... (belirli bir ajana yönlendirmek için @ajan kullanın)",
  "chat.footnote": "Daena 20 kaskadlı model sistemi kullanır. Önce ücretsiz modeller denenir.",
  "chat.error": "Şu anda tüm modeller devre dışı. Lütfen kısa süre sonra tekrar deneyin.",
  "chat.online": "Çevrimiçi",
  "chat.models": "Model",

  // Settings
  "settings.title": "Ayarlar",
  "settings.language": "Dil",
  "settings.theme": "Tema",
  "settings.save": "Ayarları Kaydet",
  "settings.saved": "Ayarlar başarıyla kaydedildi",
  
  // App
  "daena.title": "Daena — Yapay Zeka Komuta Merkezi",
};

const dictionaries: Record<string, Dictionary> = {
  en,
  tr,
};

export const useTranslation = () => {
  const language = useAppStore((state) => state.settings.language) || "en";
  const dict = dictionaries[language] || dictionaries["en"];

  const t = (key: string): string => {
    return dict[key] || key;
  };

  return { t, language };
};
