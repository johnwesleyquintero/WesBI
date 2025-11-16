import React, { useMemo } from 'react';
import { useAppContext } from '../state/appContext';
import { FlagIcon, CheckIcon, XIcon } from './Icons';
import type { MissionTask } from '../types';

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white rounded-xl p-4 shadow-md h-full">
        <h3 className="text-base font-bold text-gray-800 mb-4">{title}</h3>
        <div className="h-[220px]">
            {children}
        </div>
    </div>
);

const TaskItem: React.FC<{ task: MissionTask; onToggle: () => void }> = ({ task, onToggle }) => {
    return (
        <li className="flex items-start gap-3 py-2 border-b border-gray-200 last:border-b-0">
            <input
                type="checkbox"
                id={task.id}
                checked={task.completed}
                onChange={onToggle}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-[#9c4dff] focus:ring-[#7a33ff]"
            />
            <label htmlFor={task.id} className={`text-sm ${task.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                {task.text}
            </label>
        </li>
    );
};


const MissionControl: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { missions, activeMissionId } = state;

    const activeMission = useMemo(() => {
        if (!activeMissionId) return null;
        return missions.find(m => m.id === activeMissionId) || null;
    }, [missions, activeMissionId]);

    if (!activeMission) {
        return null;
    }

    const handleToggleTask = (taskId: string) => {
        dispatch({ type: 'TOGGLE_TASK', payload: { missionId: activeMission.id, taskId } });
    };
    
    const handleCompleteMission = (status: 'completed' | 'aborted') => {
        dispatch({ type: 'COMPLETE_MISSION', payload: { missionId: activeMission.id, finalStatus: status } });
        dispatch({ type: 'ADD_TOAST', payload: {
            type: status === 'completed' ? 'success' : 'info',
            title: `Mission ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            message: `The mission "${activeMission.goal}" has been marked as ${status}.`
        }});
    };

    const completedTasks = activeMission.tasks.filter(t => t.completed).length;
    const totalTasks = activeMission.tasks.length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Check for Recharts on window
    if (!window.Recharts) {
        return <div>Loading chart library...</div>;
    }
    const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = window.Recharts;

    return (
        <div className="bg-gray-50 p-6 md:px-8 border-b border-gray-200">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
                 <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <FlagIcon className="h-6 w-6 mr-3 text-[#9c4dff]" />
                    Active Mission: <span className="ml-2 text-[#7a33ff]">{activeMission.goal}</span>
                </h2>
                <div className="flex items-center gap-3 mt-3 md:mt-0">
                     <button onClick={() => handleCompleteMission('aborted')} className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md font-semibold hover:bg-gray-300 transition-colors flex items-center gap-1">
                        <XIcon className="w-4 h-4" /> Abort
                    </button>
                    <button onClick={() => handleCompleteMission('completed')} className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-md font-semibold hover:bg-green-600 transition-colors flex items-center gap-1">
                        <CheckIcon className="w-4 h-4" /> Complete Mission
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* KPI Chart */}
                <div className="lg:col-span-2">
                     <ChartCard title={`KPI Trend: ${activeMission.kpi.name}`}>
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={activeMission.kpi.values}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="snapshotName" tick={{ fontSize: 10 }} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>

                {/* Task List */}
                <div className="bg-white p-4 rounded-xl shadow-md">
                     <h3 className="text-base font-bold text-gray-800 mb-2">Action Plan</h3>
                     <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                        <div className="bg-[#9c4dff] h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                     </div>
                     <p className="text-xs text-gray-600 mb-3 text-right font-medium">{completedTasks} of {totalTasks} tasks completed ({progress}%)</p>
                    <ul className="space-y-1 max-h-64 overflow-y-auto pr-2">
                       {activeMission.tasks.length > 0 ? (
                            activeMission.tasks.map(task => (
                                <TaskItem key={task.id} task={task} onToggle={() => handleToggleTask(task.id)} />
                            ))
                       ) : (
                           <p className="text-sm text-gray-500 text-center py-4">No specific action items were found in the plan.</p>
                       )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default MissionControl;
