

import { Dispatch } from 'react';
import type { Snapshot } from '../types';
import type { Action } from '../state/appReducer';
import { parseCSV } from './csvParser';
import { calculateStats, processRawData } from './dataProcessor';
import { getInsightsFromGemini } from './geminiService';

export const processFiles = async (
    files: FileList, 
    currentSnapshots: Record<string, Snapshot>,
    currentActiveKey: string | null,
    settings: { apiKey: string, aiFeaturesEnabled: boolean },
    dispatch: Dispatch<Action>
) => {
    if (files.length === 0) return;
    dispatch({ type: 'PROCESS_FILES_START' });
    
    const newSnapshots: Record<string, Snapshot> = {};
    const filesProcessedCount = files.length;

    try {
        let progress = 0;
        const progressStep = 90 / files.length;

        // Process each FBA snapshot.
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileName = file.name.replace('.csv', '');
            progress += progressStep;
            dispatch({ type: 'PROCESS_FILES_PROGRESS', payload: { message: `Processing ${file.name}...`, progress: Math.round(progress) } });
            
            // First, parse the CSV into raw data
            const rawData = await parseCSV(file);
            // Then, process the raw data to enrich and calculate metrics
            const data = processRawData(rawData);
            
            const stats = calculateStats(data);
            newSnapshots[fileName] = { name: fileName, data, stats, timestamp: new Date().toISOString() };
        }

        const allSnapshots = { ...currentSnapshots, ...newSnapshots };
        const latestSnapshotKey = Object.keys(newSnapshots).sort().pop() || currentActiveKey;

        let newInsights: string[] = [];
        if (settings.aiFeaturesEnabled && latestSnapshotKey) {
            dispatch({ type: 'PROCESS_FILES_PROGRESS', payload: { message: 'Generating AI Insights...', progress: 95 }});
            newInsights = await getInsightsFromGemini(allSnapshots[latestSnapshotKey].data, settings.apiKey);
        }

        dispatch({ type: 'PROCESS_FILES_SUCCESS', payload: { snapshots: allSnapshots, latestSnapshotKey, insights: newInsights, filesProcessedCount }});

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during file processing.';
        console.error(error);
        dispatch({ type: 'PROCESS_FILES_ERROR', payload: { message: errorMessage } });
    }
};