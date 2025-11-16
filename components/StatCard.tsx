
import React from 'react';

interface StatCardProps {
    label: string;
    value: string;
    change: number;
    isPercentage?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, change, isPercentage = false }) => {
    const isPositive = change >= 0;
    const changeText = `${isPositive ? '+' : ''}${change.toFixed(1)}${isPercentage ? '%' : ''}`;

    const changeColorClasses = isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';

    return (
        <div className="bg-white rounded-xl p-5 text-center shadow-md border-l-4 border-[#9c4dff] transition-transform hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between min-h-[140px]">
            <div>
                <div className="text-sm font-medium text-gray-500 mb-1">{label}</div>
                <div className="text-3xl font-bold text-[#7a33ff]">{value}</div>
            </div>
            <div className="mt-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${changeColorClasses}`}>
                    {isPositive ? '▲' : '▼'} {changeText}
                </span>
            </div>
        </div>
    );
};

export default StatCard;
