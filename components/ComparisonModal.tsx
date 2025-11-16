
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../state/appContext';

const ComparisonModal: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { snapshots } = state;
    const [baseKey, setBaseKey] = useState<string>('');
    const [compareKey, setCompareKey] = useState<string>('');

    const snapshotOptions = useMemo(() => {
        return Object.keys(snapshots).sort();
    }, [snapshots]);

    const handleCompare = () => {
        if (baseKey && compareKey && baseKey !== compareKey) {
            const sortedKeys = [baseKey, compareKey].sort();
            dispatch({ type: 'START_COMPARISON', payload: { base: sortedKeys[0], compare: sortedKeys[1] } });
        }
    };
    
    const handleClose = () => {
        dispatch({ type: 'CLOSE_COMPARISON_MODAL' });
    };

    const isValid = baseKey && compareKey && baseKey !== compareKey;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={handleClose} role="dialog" aria-modal="true" aria-labelledby="comparison-modal-title">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <h2 id="comparison-modal-title" className="text-xl font-bold text-gray-800 mb-4">Select Snapshots to Compare</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="baseSnapshot" className="block text-sm font-medium text-gray-700 mb-1">Base Snapshot (Older)</label>
                        <select id="baseSnapshot" value={baseKey} onChange={e => setBaseKey(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9c4dff] focus:outline-none">
                            <option value="" disabled>Select a base snapshot</option>
                            {snapshotOptions.map(key => (
                                <option key={key} value={key} disabled={key === compareKey}>{snapshots[key].name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="compareSnapshot" className="block text-sm font-medium text-gray-700 mb-1">Compare Snapshot (Newer)</label>
                        <select id="compareSnapshot" value={compareKey} onChange={e => setCompareKey(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9c4dff] focus:outline-none">
                            <option value="" disabled>Select a snapshot to compare</option>
                            {snapshotOptions.map(key => (
                                <option key={key} value={key} disabled={key === baseKey}>{snapshots[key].name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={handleClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleCompare} disabled={!isValid} className="px-4 py-2 bg-[#9c4dff] text-white rounded-lg font-semibold hover:bg-[#7a33ff] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                        Compare
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ComparisonModal;
