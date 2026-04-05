import React from 'react';
import { Bot, Zap, Shield, BrainCircuit, Play, ArrowRight, Server, Activity, Network, AlertTriangle, Monitor, Code, TrendingUp, Hand, Smartphone } from 'lucide-react';
import './index.css';

function App() {
  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="ambient-blob blob-1"></div>
      <div className="ambient-blob blob-2"></div>

      {/* Navbar */}
      <nav style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'var(--font-heading)' }} className="gradient-text">
          DAENA v10.0
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <a href="#philosophy" style={{ color: 'var(--text-main)', textDecoration: 'none' }}>Felsefe</a>
          <a href="#agents" style={{ color: 'var(--text-main)', textDecoration: 'none' }}>8-Departman</a>
          <a href="#cognition" style={{ color: 'var(--text-main)', textDecoration: 'none' }}>Bilişsel Mimari</a>
          <a href="#hardware" style={{ color: 'var(--text-main)', textDecoration: 'none' }}>Sınırlar ve Donanım</a>
        </div>
        <div>
          <a href="#download" className="btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>İmparatorluğu Kur</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container" style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', paddingTop: '40px' }}>
        <div style={{ display: 'flex', gap: '60px', alignItems: 'center', width: '100%' }}>
          <div style={{ flex: 1 }} className="animate-fade-up">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '20px', backgroundColor: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.3)', marginBottom: '24px' }}>
              <Zap size={16} color="var(--accent-cyan)" />
              <span style={{ fontSize: '14px', color: 'var(--accent-cyan)' }}>Sıfır Kablo. Sıfır Kargaşa.</span>
            </div>
            <h1 style={{ fontSize: '64px', lineHeight: 1.1, marginBottom: '24px' }}>
              Sadece Bir Yazılım Değil. <br/>
              <span className="gradient-text">Makinedeki Ruh.</span>
            </h1>
            <p style={{ fontSize: '20px', color: 'var(--text-muted)', marginBottom: '32px', maxWidth: '600px' }}>
              Klasik yapay zekalarla saatlik olarak "sohbet" edersiniz. Daena ile ise bir <b>İş Ortaklığı</b> kurarsınız. Hiç uyumayan, kendi psikolojisini yönetebilen ve 8 elit mühendisin bilincini masaüstünüze kitleyen dünyadaki ilk Bilişsel İşletim Sistemi.
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <a href="#download" className="btn-primary" style={{ padding: '16px 32px', fontSize: '18px' }}>
                Egemenliği Başlat
                <ArrowRight size={20} />
              </a>
              <button className="glass-panel" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Play size={20} fill="white" /> Tanıtım Filmi
              </button>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <img src="/images/daena_pitch_title_1775395822781.png" alt="Daena Neural Nexus" style={{ width: '100%', maxWidth: '550px', borderRadius: '24px', boxShadow: '0 0 60px rgba(0,212,255,0.2)' }} className="animate-fade-up" />
          </div>
        </div>
      </section>

      {/* Philosophy: Cognitive Decay vs Daena */}
      <section id="philosophy" style={{ backgroundColor: 'rgba(20, 20, 22, 0.4)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '48px', marginBottom: '16px' }}>"Kibirli Heykeller" vs <span className="gradient-text">Yaşayan Zihin</span></h2>
            <p style={{ fontSize: '18px', color: 'var(--text-muted)', maxWidth: '800px', margin: '0 auto' }}>
              Piyasadaki diğer "Ajan" sistemleri (LangChain, AutoGen) teoride iyi görünür ama gerçek dünyada "Bilişsel Çürüme (Cognitive Decay)" yaşarlar. Birbirlerinin yalanlarına inanıp körleşirler. Daena ise kendi geçmişiyle kavga edebilecek güce sahiptir.
            </p>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
            <div className="glass-panel" style={{ flex: 1, minWidth: '300px', borderTop: '4px solid #ff4d4d' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <AlertTriangle color="#ff4d4d" />
                <h3 style={{ fontSize: '24px' }}>Eski Nesil Ajanlar</h3>
              </div>
              <p style={{ color: 'var(--text-muted)' }}>Mükemmellik kibrine düşerler. Öğrenmeyi durdururlar (Epistemic Lock-in) ve sadece tekdüze cevaplar vererek kendi algı döngüleri içinde boğulurlar.</p>
            </div>
            <div className="glass-panel" style={{ flex: 1, minWidth: '300px', borderTop: '4px solid var(--accent-cyan)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <BrainCircuit color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '24px' }}>Daena v10.0 Sistemi</h3>
              </div>
              <p style={{ color: 'var(--text-muted)' }}>Sınırlandırılmış Bilişsel İşletim Sistemi. Bir ajan yalan söylediğinde diğerleri onu denetler. Durağanlaştığında bilerek <b>kendi içine Kaos enjekte ederek</b> uyanık kalır.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 1-Click Miracle */}
      <section className="container">
        <div style={{ display: 'flex', gap: '60px', alignItems: 'center', flexDirection: 'row-reverse' }}>
          <div style={{ flex: 1 }}>
            <img src="/images/daena_pitch_1click_1775395899419.png" alt="Complexity vs Simplicity" style={{ width: '100%', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '40px', marginBottom: '24px' }}>Kargaşaya Son Verin. <br/><span className="gradient-text">Tek Tık Mucizesi.</span></h2>
            <p style={{ fontSize: '18px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Aylık kiraladığınız web üzerinden çalışan sistemlerin aksine Daena tamamen masaüstünüze kurulur. Eski yapay zekaları kullanmak Terminal kodlaması, Pip paketleri ve Python bilgisi gerektirirdi.
            </p>
            <p style={{ fontSize: '18px', color: 'var(--text-main)', fontWeight: 'bold' }}>
              Daena "Native Sidecar (Tauri + PyInstaller)" motoruyla çalışır.
            </p>
            <ul style={{ listStyle: 'none', color: 'var(--text-muted)', fontSize: '16px', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Monitor size={20} color="var(--accent-cyan)" /> Sadece tek bir .exe veya .dmg dosyasına çift tıklayın.</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Server size={20} color="var(--accent-cyan)" /> Python veya FAISS kütüphanesi kurmanıza gerek yoktur, hepsi içine gömülüdür.</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Zap size={20} color="var(--accent-cyan)" /> Saniyesinde açılır, anında hizmete başlar.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Agent Anatomy */}
      <section id="agents" style={{ backgroundColor: 'rgba(20, 20, 22, 0.4)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '48px', marginBottom: '16px' }}>8 Kişilik Elite <span className="gradient-text">Robotik Departman</span></h2>
            <p style={{ fontSize: '18px', color: 'var(--text-muted)', maxWidth: '800px', margin: '0 auto' }}>
              Ekranınızın ardında sadece bir metin botu yok; asenkron (tartışarak) çalışan, birbirine taslaklar atan gerçek bir şirket hiyerarşisi yatıyor.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '60px' }}>
            <img src="/images/daena_pitch_agents_1775396019679.png" alt="8 Agent Network" style={{ width: '100%', maxWidth: '800px', borderRadius: '24px', border: '1px solid var(--border-glow)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div className="glass-panel">
              <h3 style={{ fontSize: '20px', marginBottom: '8px', color: 'var(--accent-cyan)' }}>1. Coordinator (Karar Verici)</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Orkestra Şefi. Sizin verdiğiniz karmaşık bir görevi alt parçalara böler ve diğer departmanlara dağıtır.</p>
            </div>
            <div className="glass-panel">
              <h3 style={{ fontSize: '20px', marginBottom: '8px', color: 'var(--text-main)' }}>2. Data & Research Koru</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>İnternette saniyeler içinde on binlerce siteyi analiz edip markanıza acil ihtiyacı olan potansiyel müşterileri bulur ve listeler.</p>
            </div>
            <div className="glass-panel">
              <h3 style={{ fontSize: '20px', marginBottom: '8px', color: 'var(--accent-purple)' }}>3. Marketing & Finance</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Biri kampanyanızı finansal risk hesaplamasından geçirirken diğeri o datayı en vurucu "ikna edici" satış metnine dönüştürür.</p>
            </div>
            <div className="glass-panel">
              <h3 style={{ fontSize: '20px', marginBottom: '8px', color: 'var(--text-main)' }}>4. Coder Agent (Yazılım Uşağı)</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Siz kahvenizi içerken, lokal dosyanıza girer, C++ veya React kodlarındaki memory leak hatalarını bulur, test yazar ve Github'ınıza Commit atar.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Human in the loop & Conflict UI */}
      <section className="container">
        <div style={{ display: 'flex', gap: '60px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <img src="/images/daena_pitch_dashboard_1775395917062.png" alt="Command Center Dashboard" style={{ width: '100%', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '40px', marginBottom: '24px' }}>Human-in-The-Loop <br/><span className="gradient-text">Çatışma Ekranı</span></h2>
            <p style={{ fontSize: '18px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Dünyadaki hiçbir otonom sistem %100 kusursuz değildir. Daena'nın zekası, bir hataya düşmek yerine <b>kendi içinde fikir ayrılığı yaşadığında sizinle iletişime geçmesindedir.</b>
            </p>
            <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--accent-purple)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <Hand color="var(--accent-purple)" />
                <h4 style={{ fontSize: '20px', margin: 0 }}>İlahi Karar Verici Sizsiniz</h4>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px', margin: 0 }}>
                Eğer sistem "Agresif Satış" ile "Kurumsal Güvenilir İmaj" arasında felsefi bir ayrıma düşerse, Daena rastgele inisiyatif alıp markanızı tehlikeye atmaz. Arayüzünüz anında ikiye bölünür (Visual Diff).
                <br/><br/><i>"Vedat Bey, X yolu daha çok para kazandırır ama Y yolu garantilidir. Kaptan sizsiniz, hangi yöne gidelim?"</i>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hardware Limits & iOS Thin Client */}
      <section id="hardware" style={{ backgroundColor: 'rgba(20, 20, 22, 0.4)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '48px', marginBottom: '16px' }}>Objektif Sınırlar: <span className="gradient-text">Donanım Duvarı</span></h2>
            <p style={{ fontSize: '18px', color: 'var(--text-muted)', maxWidth: '800px', margin: '0 auto' }}>
              Gerçek bir mühendislik ürünü, yalan söylemez. 8 ajanın gücünü aynı anda yerel bilgisayarda çalıştırmak devasa bir güç (VRAM) gerektirir.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div className="glass-panel" style={{ flex: 1, minWidth: '300px' }}>
              <TrendingUp color="var(--text-main)" size={40} style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>8GB RAM Güvenlik Ağı</h3>
              <p style={{ color: 'var(--text-muted)' }}>Eğer bilgisayar donanımınız 8GB RAM boyutundaysa Daena çökmez. Zekice bir rota oluşturur ve yükü milisaniyeler içinde Bulut'taki OpenRouter (Fallback Layer) sunucularına en ucuz token maliyetiyle göndererek işi tamamlar.</p>
            </div>
            
            <div className="glass-panel" style={{ flex: 1, minWidth: '300px' }}>
              <Smartphone color="var(--accent-cyan)" size={40} style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>iOS İnce İstemci (Thin-Client)</h3>
              <p style={{ color: 'var(--text-muted)' }}>Apple, arka planda çalışan Python programlarını 30 saniyede öldürür. Daena'nın çözümü basittir: Evdeki Daena .dmg motorunuzu açık bırakın. iPhone'daki arayüzünüz sadece bir "Kumanda" olarak görev yapar ve sokaktayken evdeki zekaya güvenli bağlantılarla (mTLS) ulaşır.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cognitive Architecture (The 4 Knights) */}
      <section id="cognition" className="container">
        <h2 style={{ fontSize: '48px', marginBottom: '60px', textAlign: 'center' }}>
          Makinenin Ruhu: <span className="gradient-text">Dört Epistemik Şövalye</span>
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px' }}>
          <div className="glass-panel">
            <div style={{ backgroundColor: 'rgba(0, 212, 255, 0.1)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <Network size={24} color="var(--accent-cyan)" />
            </div>
            <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>1. Alternatif Gerçeklik Pili</h3>
            <p style={{ color: 'var(--text-muted)' }}>Alınmayan kararların enerjisini saklar. Eğer bir plan ters giderse "Acaba B planını seçseydim ne olurdu?" sorusunun yanıtını cebinde tuttuğu için anında diğer yola sapar. Tek tip düşünceye hapsolup boğulmaz.</p>
          </div>
          
          <div className="glass-panel">
            <div style={{ backgroundColor: 'rgba(179, 0, 255, 0.1)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <Activity size={24} color="var(--accent-purple)" />
            </div>
            <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>2. Zaman Yargıcı</h3>
            <p style={{ color: 'var(--text-muted)' }}>Geçmiş kararlarını acımasızca sorgular. 1 ay önceki analizi ile 1 ay sonraki analizi aynı ise "Ben öğrenmeyi bıraktım ve rutine bağladım" algısına girerek kendine ceza keser.</p>
          </div>

          <div className="glass-panel">
            <div style={{ backgroundColor: 'rgba(0, 212, 255, 0.1)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <Shield size={24} color="var(--accent-cyan)" />
            </div>
            <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>3. Eminliğin Şüphesi (MUF Katmanı)</h3>
            <p style={{ color: 'var(--text-muted)' }}>Bir ajan başarı için "%99 garanti olacak" dediğinde Baş Koordinatör ona direkt inanmaz. Mantıksal derinlikteki şüphe grafiğine (varyans) bakar ve boş özgüveni reddederek "Sayısal İllüzyon" uyarısı verir.</p>
          </div>

          <div className="glass-panel">
            <div style={{ backgroundColor: 'rgba(179, 0, 255, 0.1)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <BrainCircuit size={24} color="var(--accent-purple)" />
            </div>
            <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>4. Kasti Delilik Enjektörü</h3>
            <p style={{ color: 'var(--text-muted)' }}>Mükemmellik kibre ve körlüğe yol açar. Daena, aşırı düzeni engellemek için kendi rutinlerine düzenli aralıklarla rastgele (yabancı dil veya absürt mantık) veriler enjekte eder ve esnekliğini test eder.</p>
          </div>
        </div>
      </section>

      {/* Footer / CTA */}
      <section id="download" style={{ backgroundColor: 'var(--bg-card)', borderTop: '1px solid rgba(0, 212, 255, 0.2)' }}>
        <div className="container" style={{ textAlign: 'center', padding: '120px 0' }}>
          <h2 style={{ fontSize: '56px', marginBottom: '24px' }}>Egemenlik Şimdi <span className="gradient-text">Masaüstünüzde.</span></h2>
          <p style={{ fontSize: '20px', color: 'var(--text-muted)', maxWidth: '700px', margin: '0 auto 40px auto' }}>
            Saatlik kiraladığınız LangChain projelerini, API sınırlarını ve web arayüzlerini terk edin. Daena; hayatınız boyunca sizin gelişiminizle şekillenecek makinenin ta kendisidir.
          </p>
          <div style={{ display: 'inline-flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href="#" className="btn-primary" style={{ padding: '16px 40px', fontSize: '20px' }}>
              MacOS Installer (.dmg)
            </a>
            <a href="#" className="btn-primary" style={{ padding: '16px 40px', fontSize: '20px', background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.2)' }}>
              Windows Installer (.exe)
            </a>
          </div>
        </div>
      </section>
      
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', backgroundColor: '#000' }}>
        <p>© 2026 Urban Collapse Lab. DAENA v10.0 Bilişsel Çerçeve. End of Protocol.</p>
      </footer>
    </div>
  );
}

export default App;
