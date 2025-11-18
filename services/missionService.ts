
import type { Mission, MissionTask, ProductData } from '../types';

/**
 * Parses list items from a Markdown string into an array of MissionTask objects.
 * @param markdown The raw Markdown string from the AI.
 * @returns An array of tasks.
 */
export const parseTasksFromMarkdown = (markdown: string): MissionTask[] => {
    if (!window.marked) {
        console.warn("Marked library not available for task parsing.");
        return [];
    }
    const html = window.marked.parse(markdown);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const tasks: MissionTask[] = [];
    const listItems = tempDiv.querySelectorAll('li');

    listItems.forEach((li, index) => {
        // Generate a unique ID using timestamp, index, and a random suffix to prevent collisions
        const uniqueSuffix = Math.random().toString(36).substring(2, 9);
        tasks.push({
            id: `task-${Date.now()}-${index}-${uniqueSuffix}`,
            text: li.textContent || 'Unnamed task',
            completed: false,
        });
    });

    return tasks;
};

/**
 * Determines the primary KPI name based on the mission goal.
 * @param missionGoal The selected goal for the mission.
 * @returns A human-readable name for the KPI.
 */
export const getKpiName = (missionGoal: string): string => {
    const goalLower = missionGoal.toLowerCase();
    if (goalLower.includes("risk")) {
        return "At-Risk SKUs (Risk Score > 70)";
    }
    if (goalLower.includes("sell-through")) {
        return "Overall Sell-Through Rate (%)";
    }
    if (goalLower.includes("storage fees")) {
        return "Units Aged 181+ Days";
    }
    if (goalLower.includes("cash flow") || goalLower.includes("profitable")) {
        return "Available Units of Top 20% SKUs";
    }
    return "Primary Metric";
};


/**
 * Calculates the value of the primary KPI for a given mission and snapshot data.
 * @param missionGoal The mission's goal string.
 * @param data The ProductData array from a snapshot.
 * @returns The calculated numerical value of the KPI.
 */
export const calculateMissionKpi = (missionGoal: string, data: ProductData[]): number => {
    if (data.length === 0) return 0;

    const goalLower = missionGoal.toLowerCase();

    if (goalLower.includes("risk")) {
        return data.filter(item => item.riskScore > 70).length;
    }

    if (goalLower.includes("sell-through")) {
        const totalAvailable = data.reduce((sum, item) => sum + item.available, 0);
        const totalShipped = data.reduce((sum, item) => sum + item.shippedT30, 0);
        return totalAvailable + totalShipped > 0 ? Math.round((totalShipped / (totalAvailable + totalShipped)) * 100) : 0;
    }

    if (goalLower.includes("storage fees")) {
        return data.reduce((sum, item) => sum + item.invAge181to270 + item.invAge271to365 + item.invAge365plus, 0);
    }

    if (goalLower.includes("cash flow") || goalLower.includes("profitable")) {
        // Assuming "profitable" means high sell-through for this context
        const sortedBySellThrough = [...data].sort((a, b) => b.sellThroughRate - a.sellThroughRate);
        const top20PercentIndex = Math.floor(sortedBySellThrough.length * 0.2);
        const topSKUs = sortedBySellThrough.slice(0, top20PercentIndex);
        return topSKUs.reduce((sum, item) => sum + item.available, 0);
    }

    return 0; // Default case
};


/**
 * Creates a complete Mission object.
 * @param goal The selected goal.
 * @param playbook The Markdown playbook from the AI.
 * @param initialSnapshot The snapshot data used to create the mission.
 * @returns A new Mission object.
 */
export const createMission = (goal: string, playbook: string, initialSnapshot: { name: string, data: ProductData[] }): Mission => {
    const initialKpiValue = calculateMissionKpi(goal, initialSnapshot.data);

    return {
        id: `mission-${Date.now()}`,
        goal,
        playbook,
        status: 'active',
        createdAt: new Date().toISOString(),
        tasks: parseTasksFromMarkdown(playbook),
        kpi: {
            name: getKpiName(goal),
            values: [{ snapshotName: initialSnapshot.name, value: initialKpiValue }],
        },
    };
};
