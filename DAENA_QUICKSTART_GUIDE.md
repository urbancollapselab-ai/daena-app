# DAENA v10.0: KULLANIM KILAVUZU & QUICKSTART
*Sonsuz Otonomiye Giriş*

Yapay zekayı sadece bir "Mesajlaşma botu" olarak kullanan sıradan sistemlere veda edin. Daena, sizin emirlerinizle çalışan 8 departmanlı bir dijital şirkettir. Bu kılavuz, sistemi bilgisayarınızda nasıl başlatacağınızı ve yöneteceğinizi açıklar.

## 1. KURULUM VE BAŞLATMA (DEPLOYMENT)

### Mac Kullanıcıları (macOS)
1. Terminalinizi açın ve Daena klasörünün içine girin.
2. Otomatik kurulum scriptini çalıştırın:
   `./install_mac.sh`
3. Sistem arka planda Python, FAISS, Node JS ve tüm kütüphanelerinizi kuracak; ardından Daena Setup Wizard'ı (Ayar Sihirbazı) otomatik olarak açacaktır.

### Windows Kullanıcıları
1. Klasörünüzdeki `install_win.bat` dosyasına çift tıklayın.
2. Siyah ekranda kurulumların yapılmasını bekleyin, tarayıcınız sistem sihirbazını başlatacaktır.

---

## 2. ARAYÜZ VE KURULUM SİHİRBAZI (SETUP WIZARD)
Daena ilk kez uyandığında şunları yapacaktır:
1. **Donanım Algılaması:** İşlemcinizi ve RAM kapasitenizi ölçer. Görevleri hangi modellere devredeceğini (MoA) otomatik karar verir.
2. **Github Entegrasyonu (Zorunlu):** Coder Agent'in sizin repolarınızda kod yazabilmesi için sizden Github Access Token isteyecektir. Güvenle girin.
3. **OpenRouter (Model Beyni):** 20 model devasa kaskad sisteminin anahtarıdır. API anahtarınızı girerek sistemi aktif edin.

---

## 3. DAENA İLE KONUŞMA (KOMUT KILAVUZU)

Sistemde sohbet etmek yerine, spesifik departmanları çalıştırırsınız. Komutlarınızı ajana yönlendirmek için `@` işaretini kullanın:

**Örnekler:**
- `@data Bulut Bilişim sektöründeki potansiyel müşterilerin listesini internetten kazı.`
- `@marketing Çıkardığın o listeye özel 3 paragraflık samimi bir soğuk satış E-Postası yaz.`
- `@finance Geçen ayki harcama tablomu analiz edip bana tasarruf planı çıkar.`
- `@research OpenAI son makalelerini araştır ve bana özet rapor ver.`
- `@coder src klasörümdeki hataları terminale bağlanıp düzelt.`

Eğer hiçbir etiket kullanmazsanız, "Main Brain" (Ana Beyin) devreye girer ve ne istediğinizi anlayıp doğru departmana isi sizin yerinize gönderir.

---

## 4. ACİL DURUMLAR VE WATCHDOG KONTROLÜ

Sistem son derece zeki çalışır ancak bazen inisiyatif almaktan kaçınır. Bu güvenlik donanımının bir parçasıdır:
1. **Mor Çatışma Ekranı (Disambiguation):** Daena size soru sormak için bazen mesaj yerine arayüzde çift taraflı mor bir seçim kutusu açabilir. Böyle durumlarda ajana "1. Plan Düğümü ile İlerle" diyerek otonomiyi devam ettirin.
2. **Kırmızı Hata (Coverage Gap):** Eğer Watchdog ajanın eylemini engellerse ekranda "Blocked" uyarısı alırsınız. Bu durumda ajana daha kısıtlı ve güvenli bir direktif verin. Eylemin sisteminizi tehlikeye atmasını önleriz.

*Şimdi kahvenizi alın. Çünkü diğer herkesin maaş ödediği 10 kişilik o ekip, şu an masaüstünüzde emrinize hazır.*
