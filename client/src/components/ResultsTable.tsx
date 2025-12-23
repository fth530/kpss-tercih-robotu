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
import { Copy, Building2, MapPin, Users, BookOpen } from "lucide-react";
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
      description: "ÖSYM Kodu kopyalandı: " + code,
      duration: 2000,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse mt-8">
        <div className="h-12 bg-muted rounded-lg w-full" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-muted/50 rounded-lg w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-24 bg-muted/30 rounded-2xl border-2 border-dashed border-muted mt-8">
        <div className="bg-muted rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Sonuç Bulunamadı</h3>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Arama kriterlerinize uygun kadro bulunamadı. Lütfen filtreleri değiştirerek tekrar deneyiniz.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-xl border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[140px] font-semibold text-primary">ÖSYM Kodu</TableHead>
            <TableHead className="font-semibold text-primary">Kurum Adı</TableHead>
            <TableHead className="font-semibold text-primary">Kadro Ünvanı</TableHead>
            <TableHead className="w-[120px] font-semibold text-primary">Şehir</TableHead>
            <TableHead className="w-[80px] font-semibold text-primary text-center">Kont.</TableHead>
            <TableHead className="min-w-[200px] font-semibold text-primary">Nitelikler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((position, idx) => (
            <motion.tr
              key={position.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="group hover:bg-muted/30 transition-colors"
            >
              <TableCell className="font-mono font-medium">
                <div className="flex items-center gap-2">
                  <span className="text-primary font-bold">{position.osymCode}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleCopyCode(position.osymCode)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                  <span className="font-medium">{position.institution}</span>
                </div>
              </TableCell>
              <TableCell>{position.title}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground/70" />
                  {position.city}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary" className="font-mono text-xs">
                  {position.quota}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1.5">
                  {position.qualifications.map((qual) => (
                    <Tooltip key={qual.code}>
                      <TooltipTrigger asChild>
                        <Badge 
                          variant="outline" 
                          className="cursor-help hover:bg-primary/10 hover:border-primary/50 transition-colors"
                        >
                          {qual.code}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs p-3">
                        <p className="font-semibold text-sm mb-1 text-primary">{qual.code}</p>
                        <p className="text-xs text-muted-foreground">{qual.description}</p>
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
  );
}
