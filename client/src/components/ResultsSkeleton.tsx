import { Skeleton } from "@/components/ui/skeleton";

interface ResultsSkeletonProps {
    rows?: number;
}

export function ResultsSkeleton({ rows = 5 }: ResultsSkeletonProps) {
    return (
        <div className="animate-in fade-in duration-300" role="status" aria-label="Yükleniyor">
            {/* Mobile View */}
            <div className="md:hidden p-4 space-y-3">
                {Array.from({ length: rows }).map((_, idx) => (
                    <div
                        key={idx}
                        className="bg-white dark:bg-slate-800/30 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50"
                    >
                        {/* Header skeleton */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <Skeleton className="h-6 w-24 bg-blue-500/10" />
                                    <Skeleton className="h-6 w-6" />
                                </div>
                                <Skeleton className="h-4 w-full max-w-[200px]" />
                            </div>
                            <Skeleton className="h-8 w-8 rounded-full" />
                        </div>

                        {/* Info row skeleton */}
                        <div className="flex items-center gap-4 mb-3">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-6 w-6 rounded-full" />
                        </div>

                        {/* Qualifications skeleton */}
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full" aria-hidden="true">
                    <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700/50">
                            <th className="py-4 pl-6 w-[50px]"><Skeleton className="h-4 w-4" /></th>
                            <th className="py-4 text-left"><Skeleton className="h-4 w-20" /></th>
                            <th className="py-4 text-left"><Skeleton className="h-4 w-12" /></th>
                            <th className="py-4 text-left"><Skeleton className="h-4 w-12" /></th>
                            <th className="py-4 text-left"><Skeleton className="h-4 w-10" /></th>
                            <th className="py-4 text-center"><Skeleton className="h-4 w-10 mx-auto" /></th>
                            <th className="py-4 pr-6 text-left"><Skeleton className="h-4 w-16" /></th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: rows }).map((_, idx) => (
                            <tr
                                key={idx}
                                className="border-b border-slate-100 dark:border-slate-700/30"
                            >
                                {/* Favorite */}
                                <td className="py-4 pl-6">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                </td>

                                {/* ÖSYM Code */}
                                <td className="py-4">
                                    <Skeleton className="h-7 w-28 rounded-lg" />
                                </td>

                                {/* Institution */}
                                <td className="py-4">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-8 w-8 rounded-lg" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                </td>

                                {/* Title */}
                                <td className="py-4">
                                    <Skeleton className="h-4 w-24" />
                                </td>

                                {/* City */}
                                <td className="py-4">
                                    <Skeleton className="h-4 w-20" />
                                </td>

                                {/* Quota */}
                                <td className="py-4 text-center">
                                    <Skeleton className="h-8 w-8 rounded-full mx-auto" />
                                </td>

                                {/* Qualifications */}
                                <td className="py-4 pr-6">
                                    <div className="flex gap-1.5">
                                        <Skeleton className="h-6 w-12 rounded" />
                                        <Skeleton className="h-6 w-12 rounded" />
                                        <Skeleton className="h-6 w-12 rounded" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Screen reader text */}
            <span className="sr-only">Kadro listesi yükleniyor, lütfen bekleyin...</span>
        </div>
    );
}
