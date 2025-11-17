
import * as React from 'react';
import type { ProductData } from '../types';
import { AlertTriangleIcon, ClockIcon } from './Icons';

interface AlertCenterProps {
    data: ProductData[];
    isComparisonMode: boolean;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

interface Alert {
    id: string;
    type: 'warning' | 'critical' | 'info';
    icon: React.ReactNode;
    title: string;
    message: React.ReactNode;
}

const AlertCard: React.FC<{ alert: Alert }> = ({ alert }) => {
    const colorClasses = {
        warning: 'border-amber-500 bg-amber-50 text-amber-800',
        critical: 'border-red-500 bg-red-50 text-red-800',
        info: 'border-blue-500 bg-blue-50 text-blue-800',
    };

    return (
        <div className={`p-4 rounded-lg shadow-sm border-l-4 ${colorClasses[alert.type]}`}>
            <div className="flex">
                <div className="flex-shrink-0">{alert.icon}</div>
                <div className="ml-3">
                    <h3 className="text-sm font-bold">{alert.title}</h3>
                    <div className="mt-1 text-sm">{alert.message}</div>
                </div>
            </div>
        </div>
    );
};


const AlertCenter: React.FC<AlertCenterProps> = ({ data, isComparisonMode }) => {

    const alerts = React.useMemo((): Alert[] => {
        const generatedAlerts: Alert[] = [];
        if (data.length === 0) return [];

        // 1. Stockout Alert (Critical)
        const stockoutCandidates = data
            .filter(item => item.available > 0 && item.shippedT30 > 0)
            .map(item => ({ ...item, daysToStockout: item.available / (item.shippedT30 / 30) }))
            .filter(item => item.daysToStockout < 14)
            .sort((a, b) => a.daysToStockout - b.daysToStockout);

        if (stockoutCandidates.length > 0) {
            generatedAlerts.push({
                id: 'stockout-alert',
                type: 'critical',
                icon: <ClockIcon className="h-5 w-5 text-red-500" />,
                title: `Projected Stockout Risk: ${stockoutCandidates.length} SKU(s)`,
                message: (
                    <p>
                        The following SKUs are projected to stock out in under 14 days: {' '}
                        <strong>{stockoutCandidates.slice(0, 3).map(i => i.sku).join(', ')}</strong>
                        {stockoutCandidates.length > 3 ? ' and more.' : '.'}
                    </p>
                ),
            });
        }
        
        // 2. Stagnation Alert (Warning) - Comparison Mode Only
        if (isComparisonMode) {
             const stagnationCandidates = data
                .filter(item => (item.velocityTrend ?? 0) < -40 && item.available > 0)
                .sort((a, b) => (a.velocityTrend ?? 0) - (b.velocityTrend ?? 0));
            
            if (stagnationCandidates.length > 0) {
                 generatedAlerts.push({
                    id: 'stagnation-alert',
                    type: 'warning',
                    icon: <AlertTriangleIcon className="h-5 w-5 text-amber-500" />,
                    title: `Sales Stagnation: ${stagnationCandidates.length} SKU(s)`,
                    message: (
                         <p>
                            Sales have dropped over 40% for SKUs like {' '}
                            <strong>{stagnationCandidates.slice(0, 3).map(i => i.sku).join(', ')}</strong>
                            . Review pricing and marketing.
                        </p>
                    ),
                });
            }
        }
        
        // 3. Long-Term Storage Fee Alert (Warning)
        const agedInventory = data.filter(item => item.invAge365plus > 0);
        if (agedInventory.length > 0) {
            const totalAgedUnits = agedInventory.reduce((sum, item) => sum + item.invAge365plus, 0);
            const totalAgedValue = agedInventory.reduce((sum, item) => sum + (item.invAge365plus * (item.cogs || 0)), 0);
            
            generatedAlerts.push({
                id: 'fee-alert',
                type: 'warning',
                icon: <AlertTriangleIcon className="h-5 w-5 text-amber-500" />,
                title: `Long-Term Storage Fee Risk: ${agedInventory.length} SKU(s)`,
                message: (
                    <p>
                        You have <strong>{totalAgedUnits.toLocaleString()}</strong> units aged over 365 days,
                        representing ~<strong>{formatCurrency(totalAgedValue)}</strong> in capital at risk for high fees.
                    </p>
                ),
            });
        }

        return generatedAlerts;

    }, [data, isComparisonMode]);


    if (alerts.length === 0) {
        return null;
    }

    return (
        <div className="bg-gray-50 p-6 md:px-8 border-b border-gray-200">
             <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                Proactive Alert Center
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {alerts.map(alert => <AlertCard key={alert.id} alert={alert} />)}
            </div>
        </div>
    );
};

export default AlertCenter;