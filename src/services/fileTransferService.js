export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;
const BLOB_REVOKE_DELAY_MS = 60_000;

export function downloadJsonFile(filename, payloadObject) {
  const jsonText = JSON.stringify(payloadObject, null, 2);
  const blob = new Blob([jsonText], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  link.style.display = 'none';
  if (document.body) {
    document.body.appendChild(link);
  }
  link.click();
  if (link.parentNode) {
    link.parentNode.removeChild(link);
  }
  // Defer revocation so iOS Safari / WebKit finishes streaming the blob download
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, BLOB_REVOKE_DELAY_MS);
}

export async function readJsonFile(file) {
  if (!file) {
    throw new Error('No file selected.');
  }
  if (typeof file.size === 'number' && file.size > MAX_IMPORT_FILE_BYTES) {
    throw new Error('File exceeds the 5 MB JSON import safety limit.');
  }
  const text =
    typeof file.text === 'function'
      ? await file.text()
      : await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('Failed to read file.'));
          reader.readAsText(file);
        });
  return JSON.parse(text);
}
