
import * as React from 'react';
import { CompareIcon } from './Icons';
import { useAppContext } from '../state/appContext';

interface ComparisonViewProps {
    info: string;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ info }) => {
    const { dispatch } = useAppContext();

    const onExit = () => {
        dispatch({ type: 'SET_COMPARISON_MODE', payload: false });
    };

    return (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-center p-4">
            <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold flex items-center">
                        <CompareIcon className="w-5 h-5 mr-2" />
                        Snapshot Comparison Mode
                    </h3>
                    <p className="text-sm">{info}</p>
                </div>
                <button 
                    onClick={onExit}
                    className="mt-2 sm:mt-0 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition-colors duration-300"
                >
                    Exit Comparison
                </button>
            </div>
        </div>
    );
};

export default ComparisonView;