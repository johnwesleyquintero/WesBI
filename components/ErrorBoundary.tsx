import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangleIcon } from './Icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

const DefaultFallbackUI = () => (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm m-4 flex items-center" role="alert">
        <AlertTriangleIcon className="w-6 h-6 mr-3 text-red-600" />
        <div>
            <p className="font-bold">Oops! Something went wrong.</p>
            <p className="text-sm">This section could not be loaded. Please try refreshing the page.</p>
        </div>
    </div>
);

// FIX: Imported `Component` directly and changed `extends React.Component` to `extends Component`.
// This resolves a TypeScript error where `props` was not found on the `ErrorBoundary` type.
// The global `window.React` can create ambiguity with the imported `React` object,
// so using a direct named import for `Component` ensures the correct base class is extended.
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultFallbackUI />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
