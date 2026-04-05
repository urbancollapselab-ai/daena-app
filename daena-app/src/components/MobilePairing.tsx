import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, ShieldCheck, X, Loader2, Wifi } from 'lucide-react';

interface PairPayload {
  url: string;
  pin: string;
  ip: string;
  port: number;
  qr_content: string;
}

export const MobilePairing = ({ onClose }: { onClose: () => void }) => {
  const [payload, setPayload] = useState<PairPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQR = async () => {
      try {
        const port = (window as any).__TAURI__ ? 8910 : window.location.port || 80;
        const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
        
        const response = await fetch(`http://${host}:${port}/mobile/pair`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        
        if (data.success && data.payload) {
          setPayload(data.payload);
        } else {
          setError(data.error || 'Bilinmeyen Hata');
        }
      } catch (err) {
        setError('Sunucu bağlantısı kurulamadı.');
      } finally {
        setLoading(false);
      }
    };
    fetchQR();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-8 max-w-sm w-full relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors">
          <X size={18} />
        </button>
        
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[var(--color-primary-dim)] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[var(--color-primary)]/20 shadow-lg shadow-[var(--color-primary-dim)]">
            <Smartphone className="w-7 h-7 text-[var(--color-primary)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">Mobil PWA Bağlantısı</h2>
          <p className="text-[var(--color-text-secondary)] text-xs leading-relaxed">
            iPhone kamerası ile kodu okutun ve <strong>Ana Ekrana Ekle</strong> diyerek PWA uygulamasını kurun.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center mb-6 shadow-inner mx-8 aspect-square relative">
          {loading ? (
            <div className="flex flex-col items-center text-neutral-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
              <span className="text-sm font-medium">QR Üretiliyor...</span>
            </div>
          ) : error ? (
            <div className="text-center">
              <div className="text-red-500 font-medium mb-1">Bağlantı Hatası</div>
              <div className="text-xs text-neutral-500">{error}</div>
            </div>
          ) : payload ? (
            <QRCodeSVG value={payload.qr_content} size={100} style={{ width: '100%', height: '100%' }} />
          ) : null}
        </div>

        {payload && (
          <div className="mb-6 text-center">
            <div className="text-[0.65rem] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">EŞLEŞME PİN KODU</div>
            <div className="text-3xl font-mono tracking-[0.25em] font-light text-[var(--color-text-primary)]">
              {payload.pin}
            </div>
          </div>
        )}

        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-center space-x-2 text-[var(--color-primary)] text-[0.7rem] font-medium bg-[var(--color-primary-dim)]/50 py-2 rounded-lg border border-[var(--color-primary)]/10">
            <ShieldCheck size={14} />
            <span>JWT Şifreli Yerel Ağ İletişimi</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-[var(--color-text-tertiary)] text-[0.65rem]">
            <Wifi size={12} />
            <span>Telefon ve PC aynı Wi-Fi ağında olmalıdır</span>
          </div>
        </div>
      </div>
    </div>
  );
};
