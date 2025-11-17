import * as React from 'react';
import { BarChartIcon, QuestionMarkCircleIcon, CogIcon } from './Icons';
import { useAppContext } from '../state/appContext';

const Header: React.FC = () => {
    const { dispatch } = useAppContext();

    const openHelpModal = () => {
        dispatch({ type: 'OPEN_HELP_MODAL' });
    };
    
    const openSettingsModal = () => {
        dispatch({ type: 'OPEN_SETTINGS_MODAL' });
    };

    return (
        <header className="bg-gradient-to-br from-[#9c4dff] to-[#6c34ff] text-white p-8 text-center relative">
            <div className="flex items-center justify-center">
                <span title="WesBI Logo">
                    <BarChartIcon className="w-10 h-10 mr-3" />
                </span>
                <h1 className="text-3xl md:text-4xl font-bold">WesBI</h1>
            </div>
            <p className="text-lg opacity-90 max-w-2xl mx-auto mt-2">FBA Intelligence Cockpit - Real-time Amazon Ops Analytics</p>
            <div className="absolute top-4 right-4 flex items-center gap-2">
                 <button
                    onClick={openSettingsModal}
                    className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                    aria-label="Open settings"
                    title="Settings"
                >
                    <CogIcon className="w-7 h-7" />
                </button>
                <button
                    onClick={openHelpModal}
                    className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                    aria-label="Open help guide"
                    title="User Guide"
                >
                    <QuestionMarkCircleIcon className="w-7 h-7" />
                </button>
            </div>
        </header>
    );
};

export default Header;