import React, { useState } from 'react';
import { useAppContext } from '../state/appContext';
import { getStrategyFromGemini } from '../services/geminiService';
import { SparklesIcon, XIcon } from './Icons';

const STRATEGY_GOALS = [
    "Reduce Long-Term Storage Fees",
    "Improve Sell-Through Rate",
    "Liquidate High-Risk Inventory",
    "Optimize Cash Flow by Prioritizing Profitable SKUs"
];

const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center text-center p-8">
        <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-[#9c4dff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-gray-600 font-semibold">WesBI is generating your strategic plan...</p>
        <p className="text-sm text-gray-500">This may take a moment.</p>
    </div>
);

const StrategyModal: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { snapshots, activeSnapshotKey, apiKey } = state;

    const [goal, setGoal] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [plan, setPlan] = useState<string>('');
    const [error, setError] = useState<string>('');

    const handleClose = () => {
        dispatch({ type: 'CLOSE_STRATEGY_MODAL' });
    };

    const handleGenerate = async () => {
        if (!goal || !activeSnapshotKey) return;

        const activeSnapshot = snapshots[activeSnapshotKey];
        if (!activeSnapshot) return;

        setIsLoading(true);
        setPlan('');
        setError('');
        try {
            const result = await getStrategyFromGemini(activeSnapshot.data, goal, apiKey);
            setPlan(result);
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(plan);
        dispatch({ type: 'ADD_TOAST', payload: {
            type: 'success',
            title: 'Copied to Clipboard',
            message: 'The AI-generated strategy has been copied.'
        }});
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" 
            onClick={handleClose} 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="strategy-modal-title"
        >
            <div 
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col" 
                onClick={e => e.stopPropagation()}
                style={{ maxHeight: '90vh' }}
            >
                <div className="p-6 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                    <h2 id="strategy-modal-title" className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-teal-500" />
                        AI Strategy Session
                    </h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600" aria-label="Close modal">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto">
                    {!plan && !isLoading && (
                        <>
                            <div>
                                <label htmlFor="strategyGoal" className="block text-sm font-medium text-gray-700 mb-1">Select Your Primary Goal</label>
                                <select 
                                    id="strategyGoal" 
                                    value={goal} 
                                    onChange={e => setGoal(e.target.value)} 
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9c4dff] focus:outline-none"
                                >
                                    <option value="" disabled>Choose a strategic objective...</option>
                                    {STRATEGY_GOALS.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <p className="text-xs text-gray-500">
                                WesBI will analyze your current snapshot data to generate a custom action plan for the selected goal.
                            </p>
                        </>
                    )}
                    
                    {isLoading && <LoadingSpinner />}
                    
                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                            <p className="font-bold">Error</p>
                            <p>{error}</p>
                        </div>
                    )}
                    
                    {plan && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Your Action Plan for: <span className="text-[#9c4dff]">{goal}</span></h3>
                            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{plan}</pre>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
                    <button onClick={handleClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                        Close
                    </button>
                    {plan ? (
                         <button onClick={handleCopyToClipboard} className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors">
                            Copy to Clipboard
                        </button>
                    ) : (
                        <button onClick={handleGenerate} disabled={!goal || isLoading} className="px-4 py-2 bg-teal-500 text-white rounded-lg font-semibold hover:bg-teal-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {isLoading ? 'Generating...' : 'Generate Plan'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StrategyModal;
