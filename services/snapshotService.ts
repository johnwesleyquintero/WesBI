
import { Dispatch } from 'react';
import type { Snapshot } from '../types';
import type { Action } from '../state/appReducer';
import { parseCSV } from './csvParser';
import { calculateStats } from './dataProcessor';
import { getInsightsFromGemini } from './geminiService';

export const processFiles = async (
    files: FileList, 
    currentSnapshots: Record<string, Snapshot>,
    currentActiveKey: string | null,
    dispatch: Dispatch<Action>
) => {
    if (files.length === 0) return;
    dispatch({ type: 'PROCESS_FILES_START' });
    
    const newSnapshots: Record<string, Snapshot> = {};
    const filesProcessedCount = files.length;

    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileName = file.name.replace('.csv', '');
            dispatch({ type: 'PROCESS_FILES_PROGRESS', payload: { message: `Processing ${file.name}...`, progress: Math.round(((i + 1) / files.length) * 90) } });
            
            const data = await parseCSV(file);
            const stats = calculateStats(data);
            newSnapshots[fileName] = { name: fileName, data, stats, timestamp: new Date().toISOString() };
        }

        const allSnapshots = { ...currentSnapshots, ...newSnapshots };
        const latestSnapshotKey = Object.keys(newSnapshots).sort().pop() || currentActiveKey;

        let newInsights: string[] = [];
        if (latestSnapshotKey) {
            dispatch({ type: 'PROCESS_FILES_PROGRESS', payload: { message: 'Generating AI Insights...', progress: 95 }});
            newInsights = await getInsightsFromGemini(allSnapshots[latestSnapshotKey].data);
        }

        dispatch({ type: 'PROCESS_FILES_SUCCESS', payload: { snapshots: allSnapshots, latestSnapshotKey, insights: newInsights, filesProcessedCount }});

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during file processing.';
        console.error(error);
        dispatch({ type: 'PROCESS_FILES_ERROR', payload: { message: errorMessage } });
    }
};