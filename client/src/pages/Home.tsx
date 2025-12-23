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
import { Label } from "@/components/ui/label";
import { MultiSelect, type Option } from "@/components/MultiSelect";
import { 
  Search, 
  GraduationCap, 
  Map, 
  BookOpen, 
  Users, 
  Building2,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  const { data: meta, isLoading: isMetaLoading } = useKpssMeta();
  const searchMutation = useSearchPositions();

  // Form State
  const [educationLevel, setEducationLevel] = useState<string>("");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

  // Derived Options
  const cityOptions: Option[] = [
    { label: "Tüm Şehirler", value: "Tümü" },
    ...(meta?.cities.map(c => ({ label: c, value: c })) || [])
  ];

  const filteredQualifications = meta?.qualifications.filter(q => 
    !educationLevel || q.educationLevel === educationLevel || q.educationLevel === 'Special'
  ) || [];

  // Create department options from filtered qualifications
  const departmentOptions: Option[] = filteredQualifications.map(q => ({
    label: `${q.code} - ${q.description}`,
    value: q.code
  }));

  const handleSearch = () => {
    if (!educationLevel) return;
    
    // Logic: If "Tümü" is selected or empty array, send ["All"]
    const citiesPayload = (selectedCities.length === 0 || selectedCities.includes("Tümü")) 
      ? ["All"] 
      : selectedCities;

    const deptPayload = selectedDepartments;

    searchMutation.mutate({
      educationLevel,
      cities: citiesPayload,
      departmentCodes: deptPayload,
    });
  };

  const handleReset = () => {
    setEducationLevel("");
    setSelectedCities([]);
    setSelectedDepartments([]);
    searchMutation.reset();
  };

  return (
    <div className="min-h-screen bg-background pb-20 selection:bg-primary/20">
      
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
         <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[128px]" />
      </div>

      {/* Hero Header */}
      <div className="relative z-10 border-b border-border/40 bg-card/30 backdrop-blur-md">
        <div className="container max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center gap-12">
            
            <div className="flex-1 space-y-8 animate-in slide-in-from-left-4 duration-700 fade-in">
              <div className="space-y-4">
                <Badge variant="outline" className="px-4 py-1.5 text-sm font-medium border-primary/30 text-primary bg-primary/5 rounded-full">
                  <Sparkles className="w-3.5 h-3.5 mr-2 inline-block fill-primary" />
                  2025/1 Dönemi Güncel
                </Badge>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
                  KPSS <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">Tercih Robotu</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                  Puanınıza ve niteliklerinize en uygun kamu kadrolarını saniyeler içinde bulun.
                  %100 güncel ve resmi kılavuz verileri.
                </p>
              </div>
              
              <div className="flex items-center gap-6 pt-4">
                 <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                            <Users className="w-5 h-5" />
                        </div>
                    ))}
                 </div>
                 <div className="text-sm">
                    <span className="font-bold text-foreground">50,000+</span> aday tarafından kullanılıyor
                 </div>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="flex-1 w-full flex justify-center md:justify-end animate-in slide-in-from-right-4 duration-1000 fade-in">
              <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                <div className="bg-card/50 backdrop-blur-sm p-6 rounded-2xl border border-border/50 hover:border-primary/50 transition-colors group">
                  <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-foreground">1200+</div>
                  <div className="text-sm text-muted-foreground font-medium">Aktif Kadro</div>
                </div>
                <div className="bg-card/50 backdrop-blur-sm p-6 rounded-2xl border border-border/50 hover:border-accent/50 transition-colors group mt-8">
                  <div className="bg-accent/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6 text-accent" />
                  </div>
                  <div className="text-3xl font-bold text-foreground">85+</div>
                  <div className="text-sm text-muted-foreground font-medium">Kurum</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container max-w-7xl mx-auto px-4 -mt-12 relative z-20">
        
        {/* Filter Card */}
        <div className="bg-card rounded-2xl shadow-2xl shadow-black/20 border border-border p-6 md:p-8 animate-in slide-in-from-bottom-8 duration-700 fade-in">
          
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              Kadro Arama Kriterleri
            </h2>
            { (educationLevel || selectedCities.length > 0 || selectedDepartments.length > 0) && (
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-foreground">
                <RefreshCw className="w-4 h-4 mr-2" />
                Filtreleri Temizle
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-end">
            
            {/* Education Level */}
            <div className="space-y-2.5 lg:col-span-3">
              <Label className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                <GraduationCap className="w-4 h-4 text-primary" />
                Öğrenim Düzeyi
              </Label>
              <Select value={educationLevel} onValueChange={setEducationLevel}>
                <SelectTrigger className="h-12 bg-background border-input hover:border-primary/50 transition-colors focus:ring-primary/20">
                  <SelectValue placeholder="Seçiniz..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ortaöğretim">Ortaöğretim (Lise)</SelectItem>
                  <SelectItem value="Önlisans">Önlisans</SelectItem>
                  <SelectItem value="Lisans">Lisans</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* City Selection (Multi) */}
            <div className="space-y-2.5 lg:col-span-3">
              <Label className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                <Map className="w-4 h-4 text-primary" />
                Şehir Tercihi
              </Label>
              <MultiSelect 
                options={cityOptions}
                selected={selectedCities}
                onChange={setSelectedCities}
                placeholder="Şehir Seçiniz (Çoklu)"
                className="h-12 bg-background"
                emptyMessage="Şehir bulunamadı."
              />
            </div>

            {/* Department/Qualification Search (Multi) */}
            <div className="space-y-2.5 lg:col-span-4">
              <Label className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                <BookOpen className="w-4 h-4 text-primary" />
                Bölüm / Nitelik Kodu
              </Label>
              <MultiSelect 
                options={departmentOptions}
                selected={selectedDepartments}
                onChange={setSelectedDepartments}
                placeholder={!educationLevel ? "Önce öğrenim düzeyi seçiniz" : "Bölüm veya kod arayın..."}
                className="h-12 bg-background"
                emptyMessage={!educationLevel ? "Öğrenim düzeyi seçiniz." : "Bölüm bulunamadı."}
              />
            </div>
            
            {/* Action Button */}
            <div className="lg:col-span-2">
              <Button 
                size="lg" 
                className="w-full h-12 text-base font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300"
                onClick={handleSearch}
                disabled={searchMutation.isPending || !educationLevel}
              >
                {searchMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Aranıyor...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Listele
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="min-h-[400px]">
          {searchMutation.isError && (
            <div className="mt-6 p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
               <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                  <span className="font-bold">!</span>
               </div>
              <span className="font-medium">{searchMutation.error.message}</span>
            </div>
          )}

          {searchMutation.data ? (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
               <div className="mt-12 flex items-center gap-4 mb-4">
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    {searchMutation.data.length} Sonuç Bulundu
                  </Badge>
                  <Separator className="flex-1" />
               </div>
               <ResultsTable 
                 results={searchMutation.data} 
                 isLoading={searchMutation.isPending} 
               />
            </div>
          ) : (
             !searchMutation.isPending && (
              <div className="flex flex-col items-center justify-center mt-24 opacity-40 space-y-4">
                <BookOpen className="w-16 h-16" />
                <p className="text-xl font-medium">Kadro aramak için formu kullanınız.</p>
              </div>
             )
          )}
        </div>
      </div>
    </div>
  );
}
