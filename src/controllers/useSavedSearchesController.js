import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import {
  addSavedSearch,
  createSavedSearchesExportPayload,
  deleteSavedSearch,
  importSavedSearchesPayload,
  savedSearchStore,
} from '../models/savedSearchModel';
import { downloadJsonFile, readJsonFile } from '../services/fileTransferService';

export function useSavedSearchesController({ currentSearch }) {
  const savedSearches = useSyncExternalStore(
    savedSearchStore.subscribe,
    savedSearchStore.getSnapshot,
    savedSearchStore.getServerSnapshot
  );

  const [newName, setNewName] = useState('');
  const [statusMsg, setStatusMsg] = useState(null);
  const fileInputRef = useRef(null);

  const handleSave = useCallback(() => {
    const created = addSavedSearch(newName, currentSearch);
    if (!created) return;
    setNewName('');
    setStatusMsg({ type: 'ok', text: `Saved "${created.name}"` });
  }, [newName, currentSearch]);

  const handleDelete = useCallback((id, e) => {
    e?.stopPropagation?.();
    deleteSavedSearch(id);
  }, []);

  const handleExport = useCallback(() => {
    const payload = createSavedSearchesExportPayload(savedSearches);
    downloadJsonFile('pokesearch-saved-searches.json', payload);
    setStatusMsg({ type: 'ok', text: `Exported ${savedSearches.length} searches` });
  }, [savedSearches]);

  const triggerImportPicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportFile = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await readJsonFile(file);
      const result = importSavedSearchesPayload(parsed);
      if (result.ok) {
        setStatusMsg({ type: 'ok', text: `Imported ${result.count} search(es)` });
      } else {
        setStatusMsg({ type: 'err', text: result.error });
      }
    } catch {
      setStatusMsg({ type: 'err', text: 'Failed to parse JSON file.' });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, []);

  return {
    savedSearches,
    newName,
    setNewName,
    statusMsg,
    fileInputRef,
    handleSave,
    handleDelete,
    handleExport,
    triggerImportPicker,
    handleImportFile,
  };
}
