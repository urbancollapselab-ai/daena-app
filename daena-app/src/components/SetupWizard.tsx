import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Database, CheckCircle2, ChevronRight, GitMerge, Key, Terminal, Map as MapIcon, Layers } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';

interface Stats {
  cpu_percent: number;
  ram_percent: number;
  ram_used_gb: number;
  ram_total_gb: number;
  disk_percent: number;
  sqlite_wal: string;
  uptime: number;
}

const steps = [
  { id: 'diagnostics', title: 'Sistem Analizi' },
  { id: 'github', title: 'Zorunlu Entegrasyon' },
  { id: 'api', title: 'Ajan Bağlantıları' },
  { id: 'boot', title: 'Daena Uyanış' }
];

export const SetupWizard = ({ onComplete }: { onComplete: () => void }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [githubToken, setGithubToken] = useState('');
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [githubUser, setGithubUser] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const { getApiBase } = await import('../lib/api');
      const base = await getApiBase();
      const res = await fetch(`${base}/system/stats`);
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (currentStep === 0) {
      const interval = setInterval(fetchStats, 1000);
      return () => clearInterval(interval);
    }
  }, [currentStep]);

  const verifyGithub = async () => {
    setVerifying(true);
    setError(null);
    try {
      const { getApiBase } = await import('../lib/api');
      const base = await getApiBase();
      const res = await fetch(`${base}/github/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: githubToken })
      });
      const data = await res.json();
      if (data.valid) {
        setGithubUser(data.username);
        setTimeout(() => setCurrentStep(2), 1500);
      } else {
        setError(data.error || "Geçersiz veya yetkisiz Token.");
      }
    } catch {
      setError("Bağlantı hatası.");
    }
    setVerifying(false);
  };

  return (
    <div className="fixed inset-0 bg-neutral-950 flex flex-col items-center justify-center text-neutral-200 z-50 overflow-y-auto">
      <div className="max-w-3xl w-full p-8 relative">
        {/* Futuristic Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-12 relative z-10">
          <Layers className="w-16 h-16 mx-auto mb-4 text-emerald-400" />
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">DAENA v4.0</h1>
          <p className="text-neutral-400">Dünyanın en gelişmiş otonom komuta merkezi başlatılıyor...</p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-12 relative z-10">
          {steps.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-500 ${idx < currentStep ? 'bg-emerald-500 text-white' : idx === currentStep ? 'bg-neutral-800 text-emerald-400 ring-2 ring-emerald-500' : 'bg-neutral-900 text-neutral-600'}`}>
                  {idx < currentStep ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                </div>
                <span className={`text-xs mt-3 font-medium ${idx <= currentStep ? 'text-neutral-300' : 'text-neutral-600'}`}>{step.title}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-4 rounded-full transition-colors duration-500 ${idx < currentStep ? 'bg-emerald-500' : 'bg-neutral-800'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Content Box */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 backdrop-blur-xl relative z-10 shadow-2xl">
          
          {/* STEP 0: Diagnostics */}
          {currentStep === 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-2xl font-semibold text-white mb-6">Sistem Donanımı Analizi</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800/50 flex flex-col">
                  <div className="flex items-center space-x-3 mb-2 text-neutral-400">
                    <Cpu className="w-5 h-5" />
                    <span>İşlemci Yükü</span>
                  </div>
                  <span className="text-3xl font-light text-emerald-400">{stats ? `${stats.cpu_percent}%` : '--'}</span>
                </div>
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800/50 flex flex-col">
                  <div className="flex items-center space-x-3 mb-2 text-neutral-400">
                    <HardDrive className="w-5 h-5" />
                    <span>Bellek (RAM)</span>
                  </div>
                  <span className="text-3xl font-light text-emerald-400">{stats ? `${stats.ram_used_gb} GB` : '--'} <span className="text-sm text-neutral-500">/ {stats?.ram_total_gb} GB</span></span>
                </div>
              </div>
              
              <div className="mt-8 space-y-4">
                <div className="flex items-center space-x-3 text-sm">
                  {stats ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <div className="w-5 h-5 border-2 border-neutral-600 border-t-emerald-500 rounded-full animate-spin" />}
                  <span className={stats ? 'text-neutral-300' : 'text-neutral-500'}>Çekirdek Sistem API'leri taranıyor...</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  {stats ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <div className="w-5 h-5 border-2 border-neutral-600 border-t-emerald-500 rounded-full animate-spin" />}
                  <span className={stats ? 'text-neutral-300' : 'text-neutral-500'}>SQLite WAL modu (Gelişmiş Veritabanı) doğrulanıyor...</span>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button 
                  onClick={() => setCurrentStep(1)}
                  disabled={!stats}
                  className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <span>Devam Et</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: GitHub */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="flex items-center space-x-4 mb-4">
                <GitMerge className="w-8 h-8 text-emerald-400" />
                <h2 className="text-2xl font-semibold text-white">GitHub Zorunlu Bağlantısı</h2>
              </div>
              <p className="text-neutral-400 text-sm">
                Daena'nın oteleştilmiş kod okuma (Claude Code) ve dosya yönetimi yeteneklerini sergileyebilmesi için bir GitHub Personal Access Token gereklidir. Bu token sisteminizde güvenle şifrelenerek saklanacaktır.
              </p>
              
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                <h3 className="font-semibold text-emerald-400 text-sm mb-2">Nasıl Alınır?</h3>
                <ol className="text-sm text-neutral-300 space-y-2 list-decimal list-inside">
                  <li><a href="https://github.com/settings/tokens/new" target="_blank" className="text-emerald-400 hover:underline">Buraya tıklayarak</a> GitHub'a gidin.</li>
                  <li><strong>Note</strong> kısmına "Daena Kapsamı" yazın.</li>
                  <li><strong>repo</strong> ve <strong>workflow</strong> kutucuklarını işaretleyin.</li>
                  <li>En alttan <strong>Generate Token</strong> butonuna basın ve `ghp_` ile başlayan metni kopyalayın.</li>
                </ol>
              </div>

              <div className="space-y-4">
                <input 
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                />
                {error && <p className="text-red-400 text-sm">{error}</p>}
                {githubUser !== null && <p className="text-emerald-400 text-sm flex items-center"><CheckCircle2 className="w-4 h-4 mr-2" /> Hoş geldin, {githubUser}!</p>}
              </div>

              <div className="flex justify-end mt-8">
                <button 
                  onClick={verifyGithub}
                  disabled={!githubToken || verifying || !!githubUser}
                  className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {verifying ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <span>Doğrula & İlerle</span>}
                  {!verifying && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: API Keys */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="flex items-center space-x-4 mb-4">
                <Key className="w-8 h-8 text-emerald-400" />
                <h2 className="text-2xl font-semibold text-white">Yapay Zeka Anahtarı</h2>
              </div>
              <p className="text-neutral-400 text-sm">
                Daena'nın 15 modellik beyin kaskadını (Tier 0'dan Tier 3'e) çalıştırabilmesi için OpenRouter API anahtarına ihtiyacımız var. Ücretsiz modeller (Qwen, Llama vb.) otomatik olarak devrede olacaktır.
              </p>

              <div>
                <input 
                  type="password"
                  value={openRouterKey}
                  onChange={(e) => setOpenRouterKey(e.target.value)}
                  placeholder="sk-or-v1-xxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                />
              </div>

              <div className="flex justify-between mt-8">
                <button onClick={() => setCurrentStep(1)} className="px-6 py-3 bg-neutral-800 text-white font-semibold rounded-lg hover:bg-neutral-700 transition-colors">Geri</button>
                <button 
                  onClick={() => setCurrentStep(3)}
                  disabled={!openRouterKey}
                  className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <span>Kaydet</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Boot Success */}
          {currentStep === 3 && (
            <div className="text-center space-y-6 py-8 animate-in zoom-in duration-700">
              <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-bold text-white">Tüm Sistemler Çevrimiçi</h2>
              <p className="text-neutral-400 max-w-md mx-auto">
                Daena v4.0 bağlantıları doğruladı. 8 Yapay Zeka ajanı uyandırıldı. "Ruh" motoru ve Görsel Harita devrede.
              </p>
              
              <div className="pt-8">
                <button 
                  onClick={onComplete}
                  className="px-8 py-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 transform hover:-translate-y-1"
                >
                  Ana Monitöre Geçiş Yap
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
