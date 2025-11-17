import * as React from 'react';
import { useAppContext } from '../state/appContext';

const ToggleSwitch: React.FC<{
    label: string;
    enabled: boolean;
    onChange: (enabled: boolean) => void;
}> = ({ label, enabled, onChange }) => {
    return (
        <label htmlFor="ai-toggle" className="flex items-center cursor-pointer">
            <span className="mr-3 text-sm font-medium text-gray-700">{label}</span>
            <div className="relative">
                <input
                    id="ai-toggle"
                    type="checkbox"
                    className="sr-only"
                    checked={enabled}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <div className={`block w-14 h-8 rounded-full transition-colors ${enabled ? 'bg-[#9c4dff]' : 'bg-gray-300'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
        </label>
    );
};


const SettingsModal: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { apiKey, aiFeaturesEnabled } = state;

    const [localApiKey, setLocalApiKey] = React.useState(apiKey);
    const [localAiEnabled, setLocalAiEnabled] = React.useState(aiFeaturesEnabled);

    const handleSave = () => {
        dispatch({ type: 'SAVE_SETTINGS', payload: { apiKey: localApiKey, aiFeaturesEnabled: localAiEnabled } });
    };

    const handleClose = () => {
        dispatch({ type: 'CLOSE_SETTINGS_MODAL' });
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" 
            onClick={handleClose} 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="settings-modal-title"
        >
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <h2 id="settings-modal-title" className="text-xl font-bold text-gray-800 mb-6">Settings</h2>
                
                <div className="space-y-6">
                    <div>
                        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">Gemini API Key</label>
                        <input 
                            id="apiKey"
                            type="password" 
                            value={localApiKey}
                            onChange={e => setLocalApiKey(e.target.value)}
                            placeholder="Enter your Gemini API key"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9c4dff] focus:outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Your key is stored only in your browser and is never sent to our servers.
                        </p>
                    </div>

                    <div>
                         <ToggleSwitch
                            label="Enable AI-Powered Insights"
                            enabled={localAiEnabled}
                            onChange={setLocalAiEnabled}
                        />
                         <p className="text-xs text-gray-500 mt-1">
                            Toggle off to use the app without AI features.
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <button onClick={handleClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 bg-[#9c4dff] text-white rounded-lg font-semibold hover:bg-[#7a33ff] transition-colors">
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;