
import React from 'react';
import type { LoadingState } from '../types';

interface LoaderProps {
    loadingState: LoadingState;
}

const Loader: React.FC<LoaderProps> = ({ loadingState }) => {
    if (!loadingState.isLoading) return null;

    return (
        <div className="absolute inset-0 bg-white/90 flex flex-col justify-center items-center z-50 backdrop-blur-sm">
            <div className="text-center">
                <div className="text-xl font-semibold text-[#9c4dff] mb-4">{loadingState.message}</div>
                <div className="w-64 bg-gray-200 rounded-full h-2.5">
                    <div 
                        className="bg-[#9c4dff] h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${loadingState.progress}%` }}
                    ></div>
                </div>
                <div className="mt-2 text-lg font-bold text-[#7a33ff]">{loadingState.progress}%</div>
            </div>
        </div>
    );
};

export default Loader;
