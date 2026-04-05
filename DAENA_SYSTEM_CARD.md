# DAENA v10.0: SYSTEM CARD & TECHNICAL REPORT
*Yayın Tarihi: Nisan 2026 | Sürüm: 10.0.0-release*

*(Bu belge, Anthropic ve OpenAI metodolojisi kullanılarak "State-of-the-Art" bir modelin teknik kapasite, güvenlik (alignment) ve mimari altyapısını açıklamak üzere hazırlanmış resmi Sistem Kartıdır.)*

---

## 1. YÖNETİCİ ÖZETİ (EXECUTIVE SUMMARY)
Daena v10.0, çoklu model kaskadına (Multi-Model Cascade) ve donanım duyarlılığına sahip dünyanın ilk "Sınırlandırılmış Bilişsel İşletim Sistemi"dir (Bounded Cognition OS). Bulut (SaaS) tabanlı ajan sistemlerinin aksine Daena, Tauri çekirdeği ile lokal masaüstünde çalışır. Sistem, LangChain benzeri reaktif planlayıcıların ötesine geçerek; **Jensen-Shannon Ayrışması (TSDE)**, **Alternatif Gerçeklik Akışı (CEA)** ve **FAISS Vektörel Güvenlik Kalkani (Watchdog)** prensiplerini fiziksel olarak entegre eder.

## 2. MİMARİ ALTYAPI (ARCHITECTURE)

### 2.1 Hardware-Aware Asymmetric MoA
Daena, standart orkestratörlerin düştüğü "Sabit Model Darboğazını" çözer. Sisteme bir görev verildiğinde `psutil` ile kullanıcının RAM ve VRAM kapasitesi taranır:
- Düşük Kaynaklı Ortamlarda (Örn: 8-16 GB RAM): Görevler 8 Milyar parametre altı hafif ajanlara (Qwen-Coder, Llama-4-Scout) dağıtılır, sadece final "sentezleyici" düğüm için en büyük modele veya güvenli bulut apisine başvurulur.
- Dağıtım: *O(1)* zamanlı dinamik tahsis. (Ref: `worker_pool.py`)

### 2.2 Sınırlandırılmış Biliş Modülleri (Epistemic Security)
Yapay Zeka modelleri kendi doğrularını tekrar ettikçe tünele girer (Epistemic Lock-in/Hallucination). Daena bunu 4 bağımsız "Denetçi Şeytan" ile engeller:
1. **CEA (Counterfactual Energy Accounting):** Seçilmeyen eylem yollarının gerçekleşme ihtimallerinin logaritmasını tutar ve Entropi gradyanını korur.
2. **TSDE (Temporal Self-Disagreement):** Mevcut çıkarımın, 1 ay önceki model "state"indeki çıkarım ile farklılığını hesaplar (Jensen-Shannon=0 ise 'öğrenme durdu' uyarısı verir).
3. **MUF (Meta Uncertainty Field):** Agent "Ben %99 eminim" dediğinde, bu eminliğin arkasındaki matematiksel varyansı (sapmayı) hesaplayarak yalanları/halüsinasyonları tespit der.
4. **Epistemic Chaos:** %5 rastgele zaman dilimlerinde sistemi hiç bilmediği algoritmik bir gramerde (örn: tersten mantık kurulumu) düşünmeye zorlayarak öğrenilmiş çaresizliği ezer.

---

## 3. GÜVENLİK VE UYUM (SAFETY & ALIGNMENT)

Büyük dil modellerinin otomasyon riskini (Agentic Trap) aşmak için Daena, kelime tabanlı yasaklamaları (LTL Keywords) terk etmiştir.

### 3.1 Vektörel Hukuk Motoru (Coverage-Aware FAISS Watchdog)
Daena'nın ajanları makine üzerinde "Dosya silme, Kod çalıştırma, E-posta gönderme" gibi eylemler yapmak istediğinde:
- Niyetin metinsel anatomisi çıkartılır ve 128 boyutlu Sentetik Uzaya (Embedding) konumlandırılır.
- Onaylı İşlemler Haritası (Safe-Zone) ile mesafe ölçülür (`Nearest_Distance`).
- Eğer niyet, test edilmiş güvenlik sınırlarından %15'den fazla uzaksa, sistem acil koruma moduna girerek eylemi `COVERAGE_GAP` koduyla kilitler.

### 3.2 Specification Adversary (Disambiguation UI)
Daena talimatlardaki ikilemleri asla rastgele çözmez. Kullanıcı arayüzünde jeneratif bir mor UI açarak (React widget) kullanıcıya iki farklı "Nedensellik Ağı (DAG)" sunar. İnsanı her koşulda mutlak karar verici mercide tutar.

---

## 4. DEĞERLENDİRME VE KIYASLAMA (BENCHMARKS)
Diğer Ajan sistemleri karşısında Daena'nın teorik ve fiziksel üstünlükleri:

| Özellik | AutoGen (Microsoft) | LangGraph | Daena v10.0 |
| :--- | :--- | :--- | :--- |
| **Bilişsel Çürüme Önlemi** | Yok | Yok | Var (Chaos & MUF) |
| **Güvenlik Çemberi** | Temel Seviye | Human-in-Loop | FAISS Vektörel Uzay |
| **Donanım Algısı (Hardware)** | Yok (Bulut) | Yok (Kod tabanlı) | Var (Asimetrik MoA) |
| **Masaüstü Native Mimari** | ❌ | ❌ | ✅ macOS, Windows, iOS |
| **Eylemsel Özgürlük (Agents)** | Sınırlı | Lineer/Cyclic | Paralel, Kendi Kendini Denetleyen (8 Departman) |

## 5. SONUÇ (CONCLUSION)
Daena, lokal cihazlar üzerindeki egemenliği şirketlerden alıp şahıslara geri veren; yorulmayan, öğrenen ve hata yapmaktan "matematiksel olarak" korkan tek kapalı devre ekosistemdir.
