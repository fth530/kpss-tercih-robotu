import { useState } from "react";
import { useKpssMeta, useSearchPositions } from "@/hooks/use-kpss";
import { ResultsTable } from "@/components/ResultsTable";
import { MultiSelect, type Option } from "@/components/MultiSelect";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  GraduationCap, 
  Map, 
  BookOpen,
  Building2,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const { data: meta, isLoading: isMetaLoading } = useKpssMeta();
  const searchMutation = useSearchPositions();

  // Form State
  const [educationLevel, setEducationLevel] = useState<string>("");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  
  // Derived Data
  const filteredQualifications = meta?.qualifications.filter(q => 
    !educationLevel || q.educationLevel === educationLevel || q.educationLevel === 'Special'
  ) || [];

  const cityOptions: Option[] = [
    { label: "Tüm Şehirler", value: "Tümü" },
    ...(meta?.cities.map(c => ({ label: c, value: c })) || [])
  ];

  const departmentOptions: Option[] = filteredQualifications.map(q => ({
    label: `${q.code} - ${q.description}`,
    value: q.code,
    badge: q.code
  }));

  const handleSearch = () => {
    if (!educationLevel) return;
    
    // Logic for "All" in cities
    const citiesPayload = selectedCities.includes("Tümü") ? ["All"] : selectedCities;

    searchMutation.mutate({
      educationLevel,
      cities: citiesPayload.length > 0 ? citiesPayload : ["All"],
      departmentCodes: selectedDepartments,
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20 font-sans">
      {/* Hero Header */}
      <div className="bg-gradient-to-b from-primary/5 via-primary/[0.02] to-background border-b border-primary/10">
        <div className="container max-w-7xl mx-auto px-4 py-12 md:py-20">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6 animate-in slide-in-from-left duration-700">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background border shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-xs font-medium text-foreground/80">2025/1 Dönemi Güncel</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-display font-extrabold tracking-tight text-foreground leading-[1.1]">
                KPSS <span className="text-primary">Tercih Robotu</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
                Nitelik kodlarınıza ve tercihlerinize en uygun kamu kadrolarını saniyeler içinde analiz edin.
              </p>
            </div>
            
            {/* Stats / Visual Decor */}
            <div className="flex-1 w-full flex justify-center md:justify-end animate-in slide-in-from-right duration-700 delay-100">
              <div className="grid grid-cols-2 gap-4 md:gap-6 w-full max-w-md">
                <div className="bg-card p-6 rounded-2xl shadow-xl shadow-primary/5 border border-border hover:border-primary/30 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-3xl font-bold font-display">1200+</div>
                  <div className="text-sm text-muted-foreground font-medium mt-1">Aktif Kadro</div>
                </div>
                <div className="bg-card p-6 rounded-2xl shadow-xl shadow-accent/5 border border-border hover:border-accent/30 transition-colors mt-8">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                    <Building2 className="w-6 h-6 text-accent" />
                  </div>
                  <div className="text-3xl font-bold font-display">85+</div>
                  <div className="text-sm text-muted-foreground font-medium mt-1">Kamu Kurumu</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container max-w-7xl mx-auto px-4 -mt-10 relative z-10">
        <div className="bg-card rounded-2xl shadow-2xl shadow-black/5 border border-border p-6 md:p-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-end">
            
            {/* Education Level */}
            <div className="space-y-2.5 lg:col-span-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary" />
                Öğrenim Düzeyi
              </Label>
              <Select value={educationLevel} onValueChange={setEducationLevel}>
                <SelectTrigger className="h-12 text-base bg-background border-2 focus:ring-primary/20 focus:border-primary transition-all">
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
              <Label className="text-base font-semibold flex items-center gap-2">
                <Map className="w-4 h-4 text-primary" />
                Şehir Tercihi
              </Label>
              <MultiSelect
                options={cityOptions}
                selected={selectedCities}
                onChange={setSelectedCities}
                placeholder="Şehir Seçiniz..."
                searchPlaceholder="Şehir ara..."
                disabled={isMetaLoading}
                className="h-auto min-h-[3rem] border-2"
              />
            </div>

            {/* Department/Qualification Search (Multi) */}
            <div className="space-y-2.5 lg:col-span-4">
              <Label className="text-base font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Bölüm / Nitelik Kodları
              </Label>
              <MultiSelect
                options={departmentOptions}
                selected={selectedDepartments}
                onChange={setSelectedDepartments}
                placeholder="Kod veya Bölüm Ara..."
                searchPlaceholder="Örn: 3249, Bilgisayar..."
                disabled={isMetaLoading || !educationLevel}
                emptyMessage={!educationLevel ? "Önce öğrenim düzeyi seçiniz" : "Sonuç bulunamadı"}
                className="h-auto min-h-[3rem] border-2"
              />
            </div>

            {/* Action Button */}
            <div className="lg:col-span-2">
              <Button 
                size="lg" 
                className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300"
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
                    LİSTELE
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Error State */}
          {searchMutation.isError && (
            <div className="mt-6 p-4 bg-destructive/5 text-destructive rounded-xl border border-destructive/20 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <span className="font-bold">!</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold">Arama Başarısız</p>
                <p className="text-sm opacity-90">{searchMutation.error.message}</p>
              </div>
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
              <div className="text-center mt-24 opacity-60 animate-in fade-in duration-1000">
                <p className="text-xl font-medium text-muted-foreground">Kadro aramak için yukarıdaki formu doldurunuz.</p>
                <p className="text-sm text-muted-foreground mt-2">Nitelik kodlarınıza uygun tüm kadroları tek tıkla listeleyin.</p>
              </div>
             )
          )}
        </div>
      </div>
    </div>
  );
}
