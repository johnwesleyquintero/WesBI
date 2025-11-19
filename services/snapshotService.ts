

import { Dispatch } from 'react';
import type { Snapshot } from '../types';
import type { Action } from '../state/appReducer';
import { parseCSV } from './csvParser';
import { calculateStats, processRawData, processMfiData, MfiData } from './dataProcessor';
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
    // Count only Snapshot files for the final toast, though we process all.
    let snapshotFilesCount = 0; 

    try {
        // 1. Separate files into "MFI" (Supplemental) and "Snapshot" (Primary)
        const snapshotFiles: File[] = [];
        const mfiFiles: File[] = [];

        // Since we need to read headers to distinguish, we'll do a quick pre-scan
        // However, for performance, we can often guess by filename or just parse all and check headers.
        // Strategy: Parse ALL files. Check headers of results. 
        // If header has 'afn-inbound-working-quantity', it's MFI.
        // If header has 'inv-age-0-to-90-days', it's Snapshot.
        
        // We need to process MFI files FIRST to build the map.
        const allParsedData: { fileName: string, data: any[], isMfi: boolean }[] = [];

        let progress = 0;
        const progressStep = 40 / files.length; // First 40% is parsing

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            dispatch({ type: 'PROCESS_FILES_PROGRESS', payload: { message: `Parsing ${file.name}...`, progress: Math.round(progress) } });
            
            const rawData = await parseCSV(file);
            progress += progressStep;

            if (rawData.length > 0) {
                const firstRow = rawData[0];
                const isMfi = 'afn-inbound-working-quantity' in firstRow || 'mfn-listing-exists' in firstRow;
                allParsedData.push({
                    fileName: file.name.replace('.csv', '').replace('.txt', ''),
                    data: rawData,
                    isMfi
                });
            }
        }

        // 2. Build MFI Merge Map
        // We aggregate all MFI data into a single map. If multiple MFI files are uploaded, later ones overwrite earlier ones for the same SKU.
        let mfiMap = new Map<string, MfiData>();
        const mfiDataSets = allParsedData.filter(d => d.isMfi);
        
        if (mfiDataSets.length > 0) {
            dispatch({ type: 'PROCESS_FILES_PROGRESS', payload: { message: `Consolidating logistics data...`, progress: 50 } });
            mfiDataSets.forEach(ds => {
                const dsMap = processMfiData(ds.data);
                mfiMap = new Map([...mfiMap, ...dsMap]);
            });
        }

        // 3. Process Snapshot Files
        const snapshotDataSets = allParsedData.filter(d => !d.isMfi);
        snapshotFilesCount = snapshotDataSets.length;
        
        const processingStep = 40 / (snapshotDataSets.length || 1);
        let processingProgress = 50;

        for (const ds of snapshotDataSets) {
             dispatch({ type: 'PROCESS_FILES_PROGRESS', payload: { message: `Analyzing ${ds.fileName}...`, progress: Math.round(processingProgress) } });
             
             // Pass the mfiMap to processRawData for enrichment
             const data = processRawData(ds.data, mfiMap);
             const stats = calculateStats(data);
             
             newSnapshots[ds.fileName] = { 
                 name: ds.fileName, 
                 data, 
                 stats, 
                 timestamp: new Date().toISOString() 
            };
            processingProgress += processingStep;
        }
        
        // Edge Case: User only uploaded MFI files but no snapshots.
        // We cannot create a full snapshot without sales data (shipped-t30), 
        // but we shouldn't crash. For now, WesBI requires a base snapshot.
        if (snapshotFilesCount === 0 && mfiDataSets.length > 0) {
             throw new Error("Manage FBA Inventory reports detected, but no FBA Inventory Snapshot was found. Please upload a standard FBA Snapshot to enable analysis.");
        }

        const allSnapshots = { ...currentSnapshots, ...newSnapshots };
        const latestSnapshotKey = Object.keys(newSnapshots).sort().pop() || currentActiveKey;

        let newInsights: string[] = [];
        if (settings.aiFeaturesEnabled && latestSnapshotKey) {
            dispatch({ type: 'PROCESS_FILES_PROGRESS', payload: { message: 'Generating AI Insights...', progress: 95 }});
            newInsights = await getInsightsFromGemini(allSnapshots[latestSnapshotKey].data, settings.apiKey);
        }

        dispatch({ type: 'PROCESS_FILES_SUCCESS', payload: { snapshots: allSnapshots, latestSnapshotKey, insights: newInsights, filesProcessedCount: snapshotFilesCount }});

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during file processing.';
        console.error(error);
        dispatch({ type: 'PROCESS_FILES_ERROR', payload: { message: errorMessage } });
    }
};