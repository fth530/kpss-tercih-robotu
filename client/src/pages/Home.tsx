import { useState } from "react";
import { useKpssMeta, useSearchPositions } from "@/hooks/use-kpss";
import { ResultsTable } from "@/components/ResultsTable";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem 
} from "@/components/ui/command";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Check, 
  ChevronsUpDown, 
  Search, 
  GraduationCap, 
  Map, 
  BookOpen, 
  Star,
  Users,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const { data: meta, isLoading: isMetaLoading } = useKpssMeta();
  const searchMutation = useSearchPositions();

  // Form State
  const [educationLevel, setEducationLevel] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>(""); // Use single select for simplicity, could be multi
  const [departmentCode, setDepartmentCode] = useState<string>("");
  const [score, setScore] = useState<string>("");
  
  // UI State
  const [openDepartment, setOpenDepartment] = useState(false);

  // Derived Data
  const filteredQualifications = meta?.qualifications.filter(q => 
    !educationLevel || q.educationLevel === educationLevel || q.educationLevel === 'Special'
  ) || [];

  const handleSearch = () => {
    if (!educationLevel) return; // Basic validation
    
    searchMutation.mutate({
      educationLevel,
      cities: selectedCity && selectedCity !== "Tümü" ? [selectedCity] : ["All"],
      departmentCode: departmentCode || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Header */}
      <div className="bg-primary/5 border-b border-primary/10">
        <div className="container max-w-6xl mx-auto px-4 py-12 md:py-20">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-6 animate-fade-in">
              <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium bg-white shadow-sm text-primary">
                2025/1 Dönemi Güncel
              </Badge>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                KPSS <span className="text-primary">Tercih Robotu</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
                Puanınıza ve niteliklerinize en uygun kamu kadrolarını saniyeler içinde bulun.
                Resmi kılavuz verileriyle %100 uyumlu.
              </p>
            </div>
            
            {/* Stats / Visual Decor */}
            <div className="flex-1 w-full flex justify-center md:justify-end animate-fade-in delay-100">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card p-6 rounded-2xl shadow-xl shadow-primary/5 border border-border/50">
                  <Users className="w-8 h-8 text-primary mb-3" />
                  <div className="text-2xl font-bold">1200+</div>
                  <div className="text-sm text-muted-foreground">Aktif Kadro</div>
                </div>
                <div className="bg-card p-6 rounded-2xl shadow-xl shadow-primary/5 border border-border/50 mt-8">
                  <Building2 className="w-8 h-8 text-accent mb-3" />
                  <div className="text-2xl font-bold">85+</div>
                  <div className="text-sm text-muted-foreground">Kurum</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container max-w-6xl mx-auto px-4 -mt-10 relative z-10 animate-fade-in delay-200">
        <div className="bg-card rounded-2xl shadow-xl border border-border p-6 md:p-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            
            {/* Education Level */}
            <div className="space-y-2.5">
              <Label className="text-base font-semibold flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary" />
                Öğrenim Düzeyi
              </Label>
              <Select value={educationLevel} onValueChange={setEducationLevel}>
                <SelectTrigger className="h-12 text-base bg-background">
                  <SelectValue placeholder="Seçiniz..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ortaöğretim">Ortaöğretim (Lise)</SelectItem>
                  <SelectItem value="Önlisans">Önlisans</SelectItem>
                  <SelectItem value="Lisans">Lisans</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* City Selection */}
            <div className="space-y-2.5">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Map className="w-4 h-4 text-primary" />
                Şehir Tercihi
              </Label>
              <Select value={selectedCity} onValueChange={setSelectedCity} disabled={isMetaLoading}>
                <SelectTrigger className="h-12 text-base bg-background">
                  <SelectValue placeholder="Tüm Şehirler" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="Tümü">Tüm Şehirler</SelectItem>
                  {meta?.cities.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department/Qualification Search */}
            <div className="space-y-2.5 lg:col-span-2">
              <Label className="text-base font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Bölüm / Nitelik Kodu
              </Label>
              <Popover open={openDepartment} onOpenChange={setOpenDepartment}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openDepartment}
                    className="w-full h-12 justify-between text-base font-normal bg-background"
                    disabled={isMetaLoading}
                  >
                    {departmentCode
                      ? meta?.qualifications.find((q) => q.code === departmentCode)?.description
                        ? `${departmentCode} - ${meta?.qualifications.find((q) => q.code === departmentCode)?.description.substring(0, 30)}...`
                        : departmentCode
                      : "Bölüm veya Kod Ara..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Örn: 3249 veya Bilgisayar..." />
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                      <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
                      <CommandGroup>
                        {filteredQualifications.map((q) => (
                          <CommandItem
                            key={q.code}
                            value={`${q.code} ${q.description}`}
                            onSelect={() => {
                              setDepartmentCode(q.code === departmentCode ? "" : q.code);
                              setOpenDepartment(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 text-primary",
                                departmentCode === q.code ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground">{q.code}</span>
                              <span className="text-xs text-muted-foreground">{q.description}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </div>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Score (Informational) */}
            <div className="space-y-2.5">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Star className="w-4 h-4 text-primary" />
                KPSS Puanı
              </Label>
              <Input 
                placeholder="Örn: 85.4" 
                className="h-12 text-base bg-background" 
                value={score}
                onChange={(e) => setScore(e.target.value)}
              />
            </div>

            {/* Action Button */}
            <div className="lg:col-span-3 flex items-end">
              <Button 
                size="lg" 
                className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                onClick={handleSearch}
                disabled={searchMutation.isPending || !educationLevel}
              >
                {searchMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Kadrolar Aranıyor...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    KADROLARI LİSTELE
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Error State */}
          {searchMutation.isError && (
            <div className="mt-6 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <span className="font-semibold">Hata:</span>
              {searchMutation.error.message}
            </div>
          )}
          
        </div>

        {/* Results Area */}
        <div className="min-h-[400px]">
          {searchMutation.data ? (
            <ResultsTable 
              results={searchMutation.data} 
              isLoading={searchMutation.isPending} 
            />
          ) : (
             !searchMutation.isPending && (
              <div className="text-center mt-20 opacity-50">
                <p className="text-lg">Kadro aramak için yukarıdaki formu doldurunuz.</p>
              </div>
             )
          )}
        </div>
      </div>
    </div>
  );
}
