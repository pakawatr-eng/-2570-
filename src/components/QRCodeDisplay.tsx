import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Check, Copy } from 'lucide-react';

interface QRCodeDisplayProps {
  url: string;
  size?: number;
  label?: string;
  subLabel?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  url,
  size = 180,
  label,
  subLabel,
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, {
      width: size * 2,
      margin: 2,
      color: {
        dark: '#1e1b4b', // deep indigo
        light: '#ffffff',
      },
    })
      .then((res) => setDataUrl(res))
      .catch((err) => console.error('QR code error', err));
  }, [url, size]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `qrcode_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col items-center p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
      {dataUrl ? (
        <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-inner">
          <img
            src={dataUrl}
            alt="QR Code"
            style={{ width: size, height: size }}
            className="rounded"
          />
        </div>
      ) : (
        <div
          style={{ width: size, height: size }}
          className="flex items-center justify-center bg-slate-50 text-slate-400 text-xs rounded"
        >
          กำลังสร้าง QR Code...
        </div>
      )}

      {label && (
        <div className="mt-2 text-center">
          <div className="text-xs font-semibold text-slate-800">{label}</div>
          {subLabel && <div className="text-[11px] text-slate-500">{subLabel}</div>}
        </div>
      )}

      <div className="flex items-center gap-1.5 mt-2.5">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          title="คัดลอกลิงก์"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}</span>
        </button>

        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
          title="ดาวน์โหลดภาพ QR Code"
        >
          <Download className="w-3 h-3" />
          <span>บันทึกภาพ QR</span>
        </button>
      </div>
    </div>
  );
};
