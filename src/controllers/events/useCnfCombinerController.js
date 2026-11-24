import { useCallback, useMemo, useState } from 'react';
import { compileDnfToPogoCnfSafe } from '../../models/searchEngine';

const DEFAULT_CNF_BRANCHES = [
  '4*',
  'gigantamax',
  'shiny&shadow',
  'shiny&legendary',
  'shiny&mythical',
  'shiny&ultrabeast',
  'shiny&locationbackground',
];

export function useCnfCombinerController({ untaggedOnly }) {
  const [cnfBranches, setCnfBranches] = useState(DEFAULT_CNF_BRANCHES);
  const [newBranchInput, setNewBranchInput] = useState('');

  const cnfResult = useMemo(
    () => compileDnfToPogoCnfSafe(cnfBranches, untaggedOnly ? ['!#'] : []),
    [cnfBranches, untaggedOnly]
  );

  const addCnfBranch = useCallback(() => {
    const trimmed = newBranchInput.trim();
    if (!trimmed) return;
    setCnfBranches((prev) => [...prev, trimmed]);
    setNewBranchInput('');
  }, [newBranchInput]);

  const removeCnfBranch = useCallback((idx) => {
    setCnfBranches((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  return useMemo(
    () => ({
      cnfBranches,
      setCnfBranches,
      newBranchInput,
      setNewBranchInput,
      addCnfBranch,
      removeCnfBranch,
      customCompiledCnfString: cnfResult.query,
      cnfClauseCount: cnfResult.clauseCount,
      cnfTruncated: cnfResult.truncated,
      cnfTruncatedReason: cnfResult.reason,
    }),
    [cnfBranches, newBranchInput, addCnfBranch, removeCnfBranch, cnfResult]
  );
}
