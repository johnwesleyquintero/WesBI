
import * as React from 'react';
import { LightbulbIcon } from './Icons';

interface InsightsPanelProps {
    insights: string[];
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights }) => {
    if (insights.length === 0) {
        return null;
    }

    return (
        <div className="bg-gray-50 p-6 md:px-8 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <LightbulbIcon className="h-6 w-6 mr-2" />
                AI-Powered Insights
            </h2>
            <div className="space-y-3">
                {insights.map((insight, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-[#9c4dff]">
                        <p className="text-gray-700">{insight}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InsightsPanel;