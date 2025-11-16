import React from 'react';
import { BarChartIcon } from './Icons';

const Header: React.FC = () => {
    return (
        <header className="bg-gradient-to-br from-[#9c4dff] to-[#6c34ff] text-white p-8 text-center">
            <div className="flex items-center justify-center">
                <BarChartIcon className="w-10 h-10 mr-3" />
                <h1 className="text-3xl md:text-4xl font-bold">WesBI</h1>
            </div>
            <p className="text-lg opacity-90 max-w-2xl mx-auto mt-2">FBA Intelligence Cockpit - Real-time Amazon Ops Analytics</p>
        </header>
    );
};

export default Header;