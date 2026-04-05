import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, ShieldCheck, X } from 'lucide-react';

export const MobilePairing = ({ onClose }: { onClose: () => void }) => {
  // Normally generated dynamically by backend mapping to a local IP or ngrok/cloudflare tunnel
  const connectionUrl = "daena://pair?host=192.168.1.105&port=8911&token=sec_98124xza";

  return (
    <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 max-w-sm w-full relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-500 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-center mb-6">
          <Smartphone className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">iOS Cihazı Eşleştir</h2>
          <p className="text-neutral-400 text-sm leading-relaxed">
            iPhone kamerasını kullanarak Daena'yı cebinizden yönetmek için aşağıdaki kodu okutun.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <QRCodeSVG value={connectionUrl} size={200} />
        </div>

        <div className="flex items-center justify-center space-x-2 text-emerald-500 text-sm font-medium bg-emerald-500/10 py-2 rounded-lg">
          <ShieldCheck className="w-4 h-4" />
          <span>Uçtan uca şifreli (E2EE)</span>
        </div>
      </div>
    </div>
  );
};
