
import * as React from 'react';
import { useAppContext } from '../state/appContext';
import Toast from './Toast';

const ToastContainer: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { toasts } = state;

    const handleDismiss = (id: string) => {
        dispatch({ type: 'REMOVE_TOAST', payload: id });
    };

    return (
        <div
            aria-live="assertive"
            className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-[60]"
        >
            <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
                {toasts.map((toast) => (
                    <Toast key={toast.id} toast={toast} onDismiss={handleDismiss} />
                ))}
            </div>
        </div>
    );
};

export default ToastContainer;
