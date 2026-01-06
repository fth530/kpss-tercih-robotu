import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Copy, Building2, MapPin, SearchX, CheckCircle2, Star,
  ChevronDown, ChevronUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFavorites } from "@/hooks/use-favorites";
import { ShareButton } from "@/components/ShareButton";
import { ResultsSkeleton } from "@/components/ResultsSkeleton";

interface Qualification {
  code: string;
  description: string;
  educationLevel: string | null;
}

interface Position {
  id: number;
  osymCode: string;
  institution: string;
  title: string;
  city: string;
  quota: number;
  educationLevel: string;
  minScore: number | null;
  qualifications: Qualification[];
}

interface ResultsTableProps {
  results: Position[];
  isLoading: boolean;
}

// Mobile Card Component
function MobileCard({ position, onCopy, onToggleFavorite, isFav }: {
  position: Position;
  onCopy: (code: string) => void;
  onToggleFavorite: (position: Position) => void;
  isFav: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [selectedQual, setSelectedQual] = useState<Qualification | null>(null);

  return (
    <div className="bg-white dark:bg-slate-800/30 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <code className="text-blue-600 dark:text-blue-400 font-mono text-sm bg-blue-500/10 px-2 py-0.5 rounded">
              {position.osymCode}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              onClick={() => onCopy(position.osymCode)}
            >
              <Copy className="h-3 w-3" />
            </Button>
            <ShareButton position={position} />
          </div>
          <h3 className="text-slate-800 dark:text-slate-200 font-medium text-sm line-clamp-2">
            {position.institution}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label={isFav ? `${position.institution} favorilerden kaldır` : `${position.institution} favorilere ekle`}
          aria-pressed={isFav}
          className={`h-8 w-8 shrink-0 ${isFav ? 'text-yellow-500' : 'text-slate-400 dark:text-slate-600'
            }`}
          onClick={() => onToggleFavorite(position)}
        >
          <Star className={`h-4 w-4 ${isFav ? 'fill-yellow-500' : ''}`} />
        </Button>
      </div>

      {/* Info Row */}
      <div className="flex items-center gap-4 text-sm mb-3">
        <span className="text-slate-700 dark:text-slate-300">{position.title}</span>
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
          <MapPin className="h-3 w-3" />
          {position.city}
        </div>
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
          {position.quota}
        </span>
      </div>

      {/* Qualifications */}
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 mb-2"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          Nitelikler ({position.qualifications.length})
        </button>
        {expanded && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {position.qualifications.map((qual) => (
                <Badge
                  key={qual.code}
                  variant="outline"
                  className="cursor-pointer text-xs font-mono border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700/50 active:bg-slate-300 dark:active:bg-slate-700 transition-colors"
                  onClick={() => setSelectedQual(qual)}
                >
                  {qual.code}
                </Badge>
              ))}
            </div>

            {/* Açıklama Kutusu - Mobil için */}
            {selectedQual && (
              <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-bold text-sm text-blue-600 dark:text-blue-400">{selectedQual.code}</p>
                  <button
                    onClick={() => setSelectedQual(null)}
                    className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-xs"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{selectedQual.description}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Loading State - uses modern skeleton loader
function LoadingState() {
  return <ResultsSkeleton rows={5} />;
}

export function ResultsTable({ results, isLoading }: ResultsTableProps) {
  const { toast } = useToast();
  const { toggleFavorite, isFavorite } = useFavorites();

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      description: (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>ÖSYM Kodu kopyalandı: <strong>{code}</strong></span>
        </div>
      ),
      duration: 2000,
    });
  };

  const handleToggleFavorite = (position: Position) => {
    const wasFavorite = isFavorite(position.id);
    toggleFavorite(position);

    toast({
      description: (
        <div className="flex items-center gap-2">
          <Star className={`w-4 h-4 ${wasFavorite ? 'text-slate-500' : 'text-yellow-500 fill-yellow-500'}`} />
          <span>
            {wasFavorite ? 'Favorilerden kaldırıldı' : 'Favorilere eklendi'}
          </span>
        </div>
      ),
      duration: 2000,
    });
  };

  // Loading State
  if (isLoading) {
    return <LoadingState />;
  }

  // Empty State
  if (results.length === 0) {
    return (
      <div className="text-center py-16 px-6">
        <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
          <SearchX className="w-8 h-8 text-slate-400 dark:text-slate-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">Sonuç Bulunamadı</h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Seçtiğiniz kriterlere uygun kadro bulunamadı. Filtreleri değiştirerek tekrar deneyin.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden p-4 space-y-3">
        {results.map((position) => (
          <MobileCard
            key={position.id}
            position={position}
            onCopy={handleCopyCode}
            onToggleFavorite={handleToggleFavorite}
            isFav={isFavorite(position.id)}
          />
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto" role="region" aria-label="Kadro sonuçları tablosu">
        <table className="w-full" aria-describedby="results-desc">
          <caption id="results-desc" className="sr-only">
            KPSS kadro arama sonuçları. {results.length} sonuç gösteriliyor.
          </caption>
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700/50">
              <th className="text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider py-4 pl-6 w-[50px] text-left"></th>
              <th className="text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider py-4 text-left">ÖSYM Kodu</th>
              <th className="text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider py-4 text-left">Kurum</th>
              <th className="text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider py-4 text-left">Kadro</th>
              <th className="text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider py-4 text-left">Şehir</th>
              <th className="text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider py-4 text-center">Kont.</th>
              <th className="text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider py-4 pr-6 text-left">Nitelikler</th>
            </tr>
          </thead>
          <tbody>
            {results.map((position) => (
              <tr
                key={position.id}
                className="border-b border-slate-100 dark:border-slate-700/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <td className="py-4 pl-6">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={isFavorite(position.id) ? `${position.institution} favorilerden kaldır` : `${position.institution} favorilere ekle`}
                    aria-pressed={isFavorite(position.id)}
                    className={`h-8 w-8 transition-all ${isFavorite(position.id)
                      ? 'text-yellow-500 hover:text-yellow-400'
                      : 'text-slate-400 dark:text-slate-600 hover:text-yellow-500'
                      }`}
                    onClick={() => handleToggleFavorite(position)}
                  >
                    <Star className={`h-4 w-4 ${isFavorite(position.id) ? 'fill-yellow-500' : ''}`} />
                  </Button>
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <code className="text-blue-600 dark:text-blue-400 font-mono text-sm bg-blue-500/10 px-2.5 py-1 rounded-lg">
                      {position.osymCode}
                    </code>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                        onClick={() => handleCopyCode(position.osymCode)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <ShareButton position={position} />
                    </div>
                  </div>
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 text-slate-500" />
                    </div>
                    <span className="text-slate-800 dark:text-slate-200 text-sm font-medium line-clamp-2 max-w-[200px]">{position.institution}</span>
                  </div>
                </td>
                <td className="py-4">
                  <span className="text-slate-700 dark:text-slate-300 text-sm">{position.title}</span>
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                    {position.city}
                  </div>
                </td>
                <td className="py-4 text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                    {position.quota}
                  </span>
                </td>
                <td className="py-4 pr-6">
                  <div className="flex flex-wrap gap-1.5 max-w-[250px]">
                    {position.qualifications.slice(0, 4).map((qual) => (
                      <Tooltip key={qual.code} delayDuration={0}>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="outline"
                            className="cursor-help text-xs font-mono border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/50 hover:bg-blue-500/20 hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-300 transition-all"
                          >
                            {qual.code}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="max-w-sm p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xl z-[100]"
                        >
                          <p className="font-bold text-sm text-blue-600 dark:text-blue-400 mb-2">{qual.code}</p>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{qual.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {position.qualifications.length > 4 && (
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="outline"
                            className="cursor-help text-xs border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50"
                          >
                            +{position.qualifications.length - 4}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="max-w-md p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xl z-[100]"
                        >
                          <p className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-3">Diğer Nitelikler</p>
                          <div className="space-y-2 max-h-[200px] overflow-y-auto">
                            {position.qualifications.slice(4).map((qual) => (
                              <div key={qual.code} className="flex gap-2">
                                <span className="text-xs font-mono text-blue-600 dark:text-blue-400 shrink-0 w-10">{qual.code}</span>
                                <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{qual.description}</span>
                              </div>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
