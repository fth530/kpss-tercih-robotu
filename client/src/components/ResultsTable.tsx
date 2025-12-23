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
import { Copy, Building2, MapPin, SearchX, CheckCircle2 } from "lucide-react";
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
           <CheckCircle2 className="w-4 h-4 text-green-500" />
           <span>ÖSYM Kodu kopyalandı: <strong>{code}</strong></span>
        </div>
      ),
      duration: 2000,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse mt-8">
        <div className="h-12 bg-card/50 rounded-lg w-full border border-border/50" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-card/30 rounded-lg w-full border border-border/30" />
          ))}
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-24 bg-card/50 rounded-2xl border-2 border-dashed border-muted mt-8 backdrop-blur-sm">
        <div className="bg-muted/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <SearchX className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Sonuç Bulunamadı</h3>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Seçtiğiniz kriterlere uygun kadro bulunamadı. Lütfen filtreleri değiştirerek tekrar deneyiniz.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent border-b border-border">
              <TableHead className="w-[160px] font-semibold text-primary">ÖSYM Kodu</TableHead>
              <TableHead className="min-w-[200px] font-semibold text-primary">Kurum Adı</TableHead>
              <TableHead className="min-w-[150px] font-semibold text-primary">Kadro Ünvanı</TableHead>
              <TableHead className="w-[140px] font-semibold text-primary">Şehir</TableHead>
              <TableHead className="w-[100px] font-semibold text-primary text-center">Kontenjan</TableHead>
              <TableHead className="min-w-[250px] font-semibold text-primary">Nitelikler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((position, idx) => (
              <motion.tr
                key={position.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="group hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0"
              >
                <TableCell className="font-mono font-medium">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 px-2 py-1 text-sm">
                      {position.osymCode}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/20 hover:text-primary"
                      onClick={() => handleCopyCode(position.osymCode)}
                      title="Kodu Kopyala"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-foreground">{position.institution}</span>
                  </div>
                </TableCell>
                <TableCell className="text-foreground/90 font-medium">{position.title}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {position.city}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {position.quota}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    {position.qualifications.map((qual) => (
                      <Tooltip key={qual.code}>
                        <TooltipTrigger asChild>
                          <Badge 
                            variant="secondary" 
                            className="cursor-help hover:bg-primary hover:text-primary-foreground transition-colors border border-border/50 bg-background/50"
                          >
                            {qual.code}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs p-3 bg-popover border-border text-popover-foreground shadow-xl">
                          <p className="font-bold text-sm mb-1 text-primary">{qual.code}</p>
                          <p className="text-xs leading-relaxed opacity-90">{qual.description}</p>
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
