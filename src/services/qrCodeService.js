export const QR_TOO_LONG_ERROR =
  'Query is too long for a single QR code (~2,900 byte QR limit). Copy to clipboard or split by league/type.';

let qrModulePromise = null;

async function loadQrCode() {
  if (!qrModulePromise) {
    qrModulePromise = import('qrcode').then((mod) => mod.default || mod);
  }
  return qrModulePromise;
}

export async function generateOfflineQrDataUrl(text) {
  if (!text) {
    return { ok: false, dataUrl: '', error: '' };
  }
  try {
    const QRCode = await loadQrCode();
    const dataUrl = await QRCode.toDataURL(text, {
      width: 224,
      margin: 2,
      errorCorrectionLevel: 'L',
      color: { dark: '#073b50', light: '#ffffff' },
    });
    return { ok: true, dataUrl, error: '' };
  } catch {
    return { ok: false, dataUrl: '', error: QR_TOO_LONG_ERROR };
  }
}
