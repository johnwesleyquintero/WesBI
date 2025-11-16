
import React from 'react';

interface ComparisonViewProps {
    onExit: () => void;
    info: string;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ onExit, info }) => {
    return (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-center p-4">
            <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold">📊 Snapshot Comparison Mode</h3>
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
