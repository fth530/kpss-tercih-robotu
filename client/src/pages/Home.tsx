import { useState } from "react";
import { useKpssMeta, useSearchPositions } from "@/hooks/use-kpss";
import { useFavorites } from "@/hooks/use-favorites";
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
  MapPin, 
  BookOpen, 
  Building2,
  RefreshCw,
  Sparkles,
  TrendingUp,
  ChevronRight,
  Star
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const { data: meta, isLoading: isMetaLoading } = useKpssMeta();
  const searchMutation = useSearchPositions();
  const { favoritePositions, favoritesCount } = useFavorites();

  const [educationLevel, setEducationLevel] = useState<string>("");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"search" | "favorites">("search");

  const cityOptions: Option[] = [
    { label: "Tüm Şehirler", value: "Tümü" },
    ...(meta?.cities.map(c => ({ label: c, value: c })) || [])
  ];

  const filteredQualifications = meta?.qualifications.filter(q => 
    !educationLevel || q.educationLevel === educationLevel || q.educationLevel === 'Special'
  ) || [];

  const departmentOptions: Option[] = filteredQualifications.map(q => ({
    label: `${q.code} - ${q.description}`,
    value: q.code
  }));

  const handleSearch = () => {
    if (!educationLevel) return;
    const citiesPayload = (selectedCities.length === 0 || selectedCities.includes("Tümü")) 
      ? ["All"] : selectedCities;
    searchMutation.mutate({
      educationLevel,
      cities: citiesPayload,
      departmentCodes: selectedDepartments,
    });
  };

  const handleReset = () => {
    setEducationLevel("");
    setSelectedCities([]);
    setSelectedDepartments([]);
    searchMutation.reset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-xl bg-slate-950/50">
        <div className="container max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-lg blur-sm" />
                    <svg className="w-7 h-7 text-white relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Brand */}
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white tracking-tight">KPSS Tercih</span>
                <span className="text-xs text-slate-500 font-medium">Kadro Arama Robotu</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("favorites")}
                className={`relative ${
                  activeTab === "favorites"
                    ? "text-yellow-400 bg-yellow-500/10"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Star className={`w-4 h-4 mr-2 ${activeTab === "favorites" ? "fill-yellow-400" : ""}`} />
                Favoriler
                {favoritesCount > 0 && (
                  <Badge className="ml-2 bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30">
                    {favoritesCount}
                  </Badge>
                )}
              </Button>
              
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 px-3 py-1.5">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                2025/2 Güncel
              </Badge>
            </div>
          </div>
        </div>
      </header>


      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-8">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Hayalindeki Kadroya
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400">
                Bir Adım Daha Yakın
              </span>
            </h1>
            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
              KPSS puanınıza ve mezuniyet alanınıza uygun tüm kamu kadrolarını 
              anında listeleyin. Resmi kılavuz verileriyle %100 doğru sonuçlar.
            </p>
            
            {/* Stats */}
            <div className="flex items-center justify-center gap-8 mb-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">1,795</div>
                <div className="text-sm text-slate-500">Kadro</div>
              </div>
              <div className="w-px h-10 bg-slate-700" />
              <div className="text-center">
                <div className="text-3xl font-bold text-white">1,300</div>
                <div className="text-sm text-slate-500">Nitelik</div>
              </div>
              <div className="w-px h-10 bg-slate-700" />
              <div className="text-center">
                <div className="text-3xl font-bold text-white">81</div>
                <div className="text-sm text-slate-500">Şehir</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="relative z-10 pb-20">
        <div className="container max-w-5xl mx-auto px-6">
          
          {/* Filter Card */}
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-8 shadow-2xl shadow-black/20">
            
            {/* Card Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Search className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Kadro Ara</h2>
                  <p className="text-sm text-slate-500">Kriterleri belirleyin</p>
                </div>
              </div>
              {(educationLevel || selectedCities.length > 0 || selectedDepartments.length > 0) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleReset}
                  className="text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Temizle
                </Button>
              )}
            </div>

            {/* Filters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              
              {/* Education Level */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-400" />
                  Öğrenim Düzeyi
                </Label>
                <Select value={educationLevel} onValueChange={setEducationLevel}>
                  <SelectTrigger className="h-12 bg-slate-800/50 border-slate-700 text-white hover:border-blue-500/50 focus:border-blue-500 focus:ring-blue-500/20 transition-all">
                    <SelectValue placeholder="Seçiniz..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="Ortaöğretim" className="text-white focus:bg-slate-700">Ortaöğretim (Lise)</SelectItem>
                    <SelectItem value="Önlisans" className="text-white focus:bg-slate-700">Önlisans</SelectItem>
                    <SelectItem value="Lisans" className="text-white focus:bg-slate-700">Lisans</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* City */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  Şehir
                </Label>
                <MultiSelect 
                  options={cityOptions}
                  selected={selectedCities}
                  onChange={setSelectedCities}
                  placeholder="Tüm şehirler"
                  className="h-12 bg-slate-800/50 border-slate-700 text-white"
                  emptyMessage="Şehir bulunamadı."
                />
              </div>

              {/* Department */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  Bölüm / Nitelik
                </Label>
                <MultiSelect 
                  options={departmentOptions}
                  selected={selectedDepartments}
                  onChange={setSelectedDepartments}
                  placeholder={!educationLevel ? "Önce düzey seçin" : "Bölüm arayın..."}
                  className="h-12 bg-slate-800/50 border-slate-700 text-white"
                  emptyMessage={!educationLevel ? "Önce öğrenim düzeyi seçin." : "Bölüm bulunamadı."}
                />
              </div>
            </div>

            {/* Search Button */}
            <Button 
              size="lg" 
              className="w-full h-14 text-base font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300"
              onClick={handleSearch}
              disabled={searchMutation.isPending || !educationLevel}
            >
              {searchMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Aranıyor...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Kadroları Listele
                  <ChevronRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </div>


          {/* Results Section */}
          <div className="mt-8">
            {searchMutation.isError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                  <span className="text-lg">!</span>
                </div>
                <span>{searchMutation.error.message}</span>
              </div>
            )}

            {activeTab === "search" && searchMutation.data ? (
              <div className="space-y-6">
                {/* Results Header - Daha Vurgulu */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-2xl border border-emerald-500/20">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                      <TrendingUp className="w-7 h-7 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {searchMutation.data.length.toLocaleString('tr-TR')} Kadro Bulundu!
                      </h3>
                      <p className="text-sm text-slate-400">
                        {educationLevel} düzeyinde 
                        {selectedCities.length > 0 && !selectedCities.includes("Tümü") 
                          ? ` • ${selectedCities.length} şehir` 
                          : " • Tüm şehirler"}
                        {selectedDepartments.length > 0 
                          ? ` • ${selectedDepartments.length} nitelik` 
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-emerald-400">
                      {searchMutation.data.length}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">Kadro</div>
                  </div>
                </div>
                
                {/* Results Table */}
                <div className="bg-slate-900/50 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden">
                  <ResultsTable 
                    results={searchMutation.data} 
                    isLoading={searchMutation.isPending} 
                  />
                </div>
              </div>
            ) : activeTab === "favorites" ? (
              <div className="space-y-6">
                {/* Favorites Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Favorilerim</h3>
                      <p className="text-sm text-slate-500">{favoritesCount} favori kadro</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("search")}
                    className="text-slate-400 hover:text-white"
                  >
                    Aramaya Dön
                  </Button>
                </div>
                
                {/* Favorites Table */}
                {favoritePositions.length > 0 ? (
                  <div className="bg-slate-900/50 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden">
                    <ResultsTable 
                      results={favoritePositions} 
                      isLoading={false} 
                    />
                  </div>
                ) : (
                  <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-700/30">
                    <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-6">
                      <Star className="w-10 h-10 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-400 mb-2">Henüz Favori Yok</h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-6">
                      Kadro listesinde yıldız ikonuna tıklayarak favorilerinize ekleyin
                    </p>
                    <Button
                      onClick={() => setActiveTab("search")}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
                    >
                      Kadro Ara
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              !searchMutation.isPending && (
                <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-700/30">
                  {/* Animated Icon */}
                  <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
                    <div className="relative w-24 h-24 rounded-full bg-slate-800/80 flex items-center justify-center">
                      <Search className="w-10 h-10 text-blue-400" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-3">Kadro Aramaya Başlayın</h3>
                  <p className="text-slate-400 max-w-lg mx-auto mb-8 leading-relaxed">
                    KPSS puanınıza uygun binlerce kamu kadrosunu keşfedin. 
                    Yukarıdaki filtrelerden öğrenim düzeyinizi seçerek başlayın.
                  </p>
                  
                  {/* Quick Guide */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full">
                      <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">1</span>
                      <span className="text-slate-300">Öğrenim düzeyi seçin</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 hidden sm:block" />
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full">
                      <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">2</span>
                      <span className="text-slate-300">Şehir/Bölüm filtreleyin</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 hidden sm:block" />
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full">
                      <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">3</span>
                      <span className="text-slate-300">Kadroları listeleyin</span>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 py-8">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <div>© 2025 KPSS Tercih Robotu. Tüm hakları saklıdır.</div>
            <div className="flex items-center gap-2">
              <span>Veriler:</span>
              <Badge variant="outline" className="border-slate-700 text-slate-400">ÖSYM 2025/2 Kılavuzu</Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
