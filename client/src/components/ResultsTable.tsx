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
import { Copy, Building2, MapPin, Users } from "lucide-react";
import type { SearchResponse } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface ResultsTableProps {
  results: SearchResponse;
  isLoading: boolean;
}

export function ResultsTable({ results, isLoading }: ResultsTableProps) {
  const { toast } = useToast();

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      description: (
        <div className="flex items-center gap-2">
          <Copy className="w-4 h-4 text-green-500" />
          <span>ÖSYM Kodu kopyalandı: <strong>{code}</strong></span>
        </div>
      ),
      duration: 2000,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 mt-8">
        <div className="h-12 bg-muted/50 rounded-xl w-full animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div 
              key={i} 
              className="h-16 bg-muted/30 rounded-xl w-full animate-pulse border border-border/40" 
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-24 bg-muted/30 rounded-2xl border-2 border-dashed border-muted mt-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-muted rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Building2 className="w-10 h-10 text-muted-foreground/50" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Sonuç Bulunamadı</h3>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Arama kriterlerinize uygun kadro bulunamadı. Lütfen filtreleri genişleterek tekrar deneyiniz.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-xl border bg-card shadow-lg shadow-black/5 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="p-4 bg-muted/30 border-b flex justify-between items-center">
        <h3 className="font-semibold flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          Bulunan Kadrolar
        </h3>
        <Badge variant="secondary" className="px-3">
          {results.length} Sonuç
        </Badge>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[160px] font-bold text-primary">ÖSYM Kodu</TableHead>
              <TableHead className="font-bold text-primary min-w-[200px]">Kurum & Ünvan</TableHead>
              <TableHead className="w-[140px] font-bold text-primary">Şehir</TableHead>
              <TableHead className="w-[100px] font-bold text-primary text-center">Kontenjan</TableHead>
              <TableHead className="min-w-[200px] font-bold text-primary">Nitelik Kodları</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((position, idx) => (
              <motion.tr
                key={position.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="group hover:bg-primary/[0.02] transition-colors border-b last:border-0"
              >
                <TableCell className="font-mono font-medium align-top py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-bold bg-primary/5 px-2 py-1 rounded select-all">
                      {position.osymCode}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-50 group-hover:opacity-100 transition-all hover:bg-primary/10 hover:text-primary"
                      onClick={() => handleCopyCode(position.osymCode)}
                      title="Kodu Kopyala"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="align-top py-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-foreground">{position.institution}</span>
                    <span className="text-sm text-muted-foreground">{position.title}</span>
                  </div>
                </TableCell>
                <TableCell className="align-top py-4">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-foreground/80">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {position.city}
                  </div>
                </TableCell>
                <TableCell className="text-center align-top py-4">
                  <Badge variant="outline" className="font-mono text-xs bg-background">
                    <Users className="w-3 h-3 mr-1 text-muted-foreground" />
                    {position.quota}
                  </Badge>
                </TableCell>
                <TableCell className="align-top py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {position.qualifications.map((qual) => (
                      <Tooltip key={qual.code} delayDuration={0}>
                        <TooltipTrigger asChild>
                          <Badge 
                            variant="outline" 
                            className="cursor-help hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
                          >
                            {qual.code}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs p-3 shadow-xl border-primary/20">
                          <p className="font-bold text-sm mb-1 text-primary">{qual.code}</p>
                          <p className="text-xs text-foreground/80 leading-relaxed">{qual.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
