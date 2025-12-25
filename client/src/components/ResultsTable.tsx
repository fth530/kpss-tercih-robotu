import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Building2, MapPin, SearchX, CheckCircle2, Star } from "lucide-react";
import type { SearchResponse } from "@shared/routes";
import type { PositionWithQualifications } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useFavorites } from "@/hooks/use-favorites";

interface ResultsTableProps {
  results: SearchResponse;
  isLoading: boolean;
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

  const handleToggleFavorite = (position: PositionWithQualifications) => {
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

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-16 px-6">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
          <SearchX className="w-8 h-8 text-slate-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-300 mb-2">Sonuç Bulunamadı</h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Seçtiğiniz kriterlere uygun kadro bulunamadı. Filtreleri değiştirerek tekrar deneyin.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-700/50 hover:bg-transparent">
            <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider py-4 pl-6 w-[50px]"></TableHead>
            <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider">ÖSYM Kodu</TableHead>
            <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Kurum</TableHead>
            <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Kadro</TableHead>
            <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Şehir</TableHead>
            <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider text-center">Kont.</TableHead>
            <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider pr-6">Nitelikler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((position, idx) => (
            <TableRow 
              key={position.id}
              className="border-slate-700/30 hover:bg-slate-800/50 transition-colors group"
            >
              <TableCell className="py-4 pl-6">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 transition-all ${
                    isFavorite(position.id)
                      ? 'text-yellow-500 hover:text-yellow-400'
                      : 'text-slate-600 hover:text-yellow-500'
                  }`}
                  onClick={() => handleToggleFavorite(position)}
                >
                  <Star className={`h-4 w-4 ${isFavorite(position.id) ? 'fill-yellow-500' : ''}`} />
                </Button>
              </TableCell>
              <TableCell className="py-4">
                <div className="flex items-center gap-2">
                  <code className="text-blue-400 font-mono text-sm bg-blue-500/10 px-2.5 py-1 rounded-lg">
                    {position.osymCode}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-white hover:bg-slate-700"
                    onClick={() => handleCopyCode(position.osymCode)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                    <Building2 className="h-4 w-4 text-slate-500" />
                  </div>
                  <span className="text-slate-200 text-sm font-medium line-clamp-2">{position.institution}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-slate-300 text-sm">{position.title}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                  {position.city}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold text-sm">
                  {position.quota}
                </span>
              </TableCell>
              <TableCell className="pr-6">
                <div className="flex flex-wrap gap-1.5">
                  {position.qualifications.map((qual) => (
                    <Tooltip key={qual.code} delayDuration={0}>
                      <TooltipTrigger>
                        <Badge 
                          variant="outline"
                          className="cursor-help text-xs font-mono border-slate-600 text-slate-300 bg-slate-800/50 hover:bg-blue-500/20 hover:border-blue-500/50 hover:text-blue-300 transition-all"
                        >
                          {qual.code}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent 
                        side="top" 
                        className="max-w-sm p-4 bg-slate-800 border-slate-700 shadow-xl z-[100]"
                      >
                        <p className="font-bold text-sm text-blue-400 mb-2">{qual.code}</p>
                        <p className="text-xs text-slate-300 leading-relaxed">{qual.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
