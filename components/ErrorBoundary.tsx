

import * as React from 'react';
import { AlertTriangleIcon } from './Icons';

interface Props {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
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

// Changed the React import to a namespace import (`import * as React from 'react'`).
// This ensures all React APIs (Component, ReactNode, JSX factory) are accessed from a single,
// consistent module object. This can resolve subtle runtime errors like "Script error" that
// occur in mixed module environments (ESM vs. UMD) where references to React might become ambiguous.
class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  // Explicitly declare props to satisfy TypeScript if base class inference fails
  public props: Props;

  constructor(props: Props) {
      super(props);
      this.props = props;
  }

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
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