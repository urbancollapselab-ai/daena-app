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
  "setup.welcome": "Welcome to Daena v1.0",
  "setup.welcomeDesc": "Your autonomous, 20-model AI command center.",
  "setup.start": "Start Setup",
  "setup.prev": "Previous",
  "setup.next": "Next",
  "setup.complete": "Complete Setup",
  "setup.save": "Testing & Saving API Keys",

  "setup.profile": "Profile Complete",
  "setup.nameDesc": "How should Daena address you?",
  "setup.businessDesc": "What is the name of your business?",
  "setup.industryDesc": "What industry are you in? (e.g. e-commerce, saas)",

  "setup.systemTitle": "System Check",
  "setup.systemDesc": "Checking background requirements...",
  "setup.claudePro": "Claude Pro Desktop (Required for Main Brain)",
  "setup.detecting": "Detecting...",
  "setup.installing": "Installing global Claude Code... Please wait.",
  "setup.installed": "✅ Installed and Active",
  "setup.wait": "Please wait for installation to finish.",

  "setup.apiTitle": "API Configuration",
  "setup.apiDesc": "Enter your OpenRouter API Key. This provides access to 20 fallback models.",
  "setup.apiLabel": "OpenRouter API Key",
  "setup.invalidKey": "Invalid API Key. Please test it first.",
  "setup.testKey": "Test Key",
  "setup.keyValid": "Key Valid!",

  "setup.agentTitle": "Agent Activation",
  "setup.agentDesc": "Select which specialized AI agents you want running.",

  "setup.finalizeTitle": "System Initialization",
  "setup.finalizing": "Booting Daena Core...",
  "setup.success": "System Fully Operational.",

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
  "setup.welcome": "Daena v1.0'a Hoş Geldiniz",
  "setup.welcomeDesc": "Otonom, 20 model destekli yapay zeka komuta merkeziniz.",
  "setup.start": "Kuruluma Başla",
  "setup.prev": "Geri",
  "setup.next": "İleri",
  "setup.complete": "Kurulumu Tamamla",
  "setup.save": "API Anahtarları Test Ediliyor",

  "setup.profile": "Profiliniz",
  "setup.nameDesc": "Daena size nasıl hitap etsin?",
  "setup.businessDesc": "İşletmenizin adı nedir?",
  "setup.industryDesc": "Hangi sektördesiniz? (örn. e-ticaret, saas)",

  "setup.systemTitle": "Sistem Kontrolü",
  "setup.systemDesc": "Arka plan gereksinimleri kontrol ediliyor...",
  "setup.claudePro": "Claude Pro Desktop (Ana Beyin için gerekli)",
  "setup.detecting": "Algılanıyor...",
  "setup.installing": "Claude Code küresel olarak kuruluyor... Lütfen bekleyin.",
  "setup.installed": "✅ Kurulu ve Aktif",
  "setup.wait": "Lütfen kurulumun tamamlanmasını bekleyin.",

  "setup.apiTitle": "API Yapılandırması",
  "setup.apiDesc": "OpenRouter API Anahtarınızı girin. Bu, 20 yedek modele erişim sağlar.",
  "setup.apiLabel": "OpenRouter API Anahtarı",
  "setup.invalidKey": "Geçersiz API Anahtarı. Lütfen önce test edin.",
  "setup.testKey": "Test Et",
  "setup.keyValid": "Anahtar Geçerli!",

  "setup.agentTitle": "Ajan Aktivasyonu",
  "setup.agentDesc": "Hangi uzman yapay zeka ajanlarının çalışmasını istediğinizi seçin.",

  "setup.finalizeTitle": "Sistem Başlatılıyor",
  "setup.finalizing": "Daena Core Çalıştırılıyor...",
  "setup.success": "Sistem Tam Operasyonel.",

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
