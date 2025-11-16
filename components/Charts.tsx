import React, { useMemo } from 'react';
import type { ProductData } from '../types';

// Access Recharts from the global window object, as it's loaded from a CDN.
// DEFERRED: Destructuring is now done inside each component to avoid race conditions.

const CHART_COLORS = ['#2ecc71', '#3498db', '#f39c12', '#e67e22', '#e74c3c'];

interface ChartProps {
    data: ProductData[];
}

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white rounded-xl p-4 shadow-md">
        <h3 className="text-base font-bold text-gray-800 mb-4">{title}</h3>
        <div className="h-[220px]">
            {children}
        </div>
    </div>
);

export const AgeDistributionChart: React.FC<ChartProps> = ({ data }) => {
    const chartData = useMemo(() => {
        const distribution = [
            { name: '0-90 days', value: data.reduce((sum, item) => sum + item.invAge0to90, 0) },
            { name: '91-180 days', value: data.reduce((sum, item) => sum + item.invAge91to180, 0) },
            { name: '181-270 days', value: data.reduce((sum, item) => sum + item.invAge181to270, 0) },
            { name: '271-365 days', value: data.reduce((sum, item) => sum + item.invAge271to365, 0) },
            { name: '365+ days', value: data.reduce((sum, item) => sum + item.invAge365plus, 0) },
        ];
        return distribution.filter(d => d.value > 0);
    }, [data]);
    
    if (!window.Recharts) {
        return (
            <ChartCard title="Inventory Age Distribution">
                <div className="flex items-center justify-center h-full text-gray-500">Loading chart...</div>
            </ChartCard>
        );
    }
    const { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } = window.Recharts;
    
    if (chartData.length === 0) return <ChartCard title="Inventory Age Distribution"><div className="flex items-center justify-center h-full text-gray-500">No data</div></ChartCard>;

    return (
        <ChartCard title="Inventory Age Distribution">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </ChartCard>
    );
};

export const RiskChart: React.FC<ChartProps> = ({ data }) => {
    const chartData = useMemo(() => {
        return data
            .filter(item => item.riskScore > 50)
            .sort((a, b) => b.riskScore - a.riskScore)
            .slice(0, 8)
            .map(item => ({ name: item.sku, risk: item.riskScore }));
    }, [data]);
    
    if (!window.Recharts) {
        return (
            <ChartCard title="Top At-Risk SKUs">
                <div className="flex items-center justify-center h-full text-gray-500">Loading chart...</div>
            </ChartCard>
        );
    }
    const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } = window.Recharts;

    if (chartData.length === 0) return <ChartCard title="Top At-Risk SKUs"><div className="flex items-center justify-center h-full text-gray-500">No high-risk SKUs</div></ChartCard>;

    return (
        <ChartCard title="Top At-Risk SKUs">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="risk" fill="#e74c3c" />
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    );
};

export const PerformanceChart: React.FC<ChartProps> = ({ data }) => {
    const chartData = useMemo(() => {
        return data
            .filter(item => item.sellThroughRate > 0)
            .sort((a, b) => b.sellThroughRate - a.sellThroughRate)
            .slice(0, 10)
            .map(item => ({ name: item.sku, 'sell-through': item.sellThroughRate }));
    }, [data]);

    if (!window.Recharts) {
        return (
            <ChartCard title="Sell-Through Performance">
                <div className="flex items-center justify-center h-full text-gray-500">Loading chart...</div>
            </ChartCard>
        );
    }
    const { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } = window.Recharts;
    
    if (chartData.length === 0) return <ChartCard title="Sell-Through Performance"><div className="flex items-center justify-center h-full text-gray-500">No sales data</div></ChartCard>;

    return (
        <ChartCard title="Sell-Through Performance">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="sell-through" fill="#2ecc71" />
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    );
};
