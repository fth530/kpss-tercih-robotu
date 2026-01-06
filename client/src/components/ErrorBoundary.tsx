import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to console in development
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-8 shadow-xl text-center">
                        {/* Icon */}
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>

                        {/* Title */}
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            Bir Hata Oluştu
                        </h1>

                        {/* Description */}
                        <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm leading-relaxed">
                            Üzgünüz, beklenmeyen bir hata meydana geldi.
                            Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.
                        </p>

                        {/* Error details (development only) */}
                        {process.env.NODE_ENV === "development" && this.state.error && (
                            <div className="mb-6 p-3 bg-red-500/10 rounded-lg text-left">
                                <p className="text-xs font-mono text-red-600 dark:text-red-400 break-all">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 justify-center">
                            <Button
                                variant="outline"
                                onClick={this.handleReset}
                                className="border-slate-300 dark:border-slate-600"
                            >
                                Tekrar Dene
                            </Button>
                            <Button
                                onClick={this.handleReload}
                                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Sayfayı Yenile
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
