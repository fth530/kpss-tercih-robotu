import { useEffect, useState } from "react";

type Theme = "dark" | "light";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // localStorage'dan tema oku, yoksa dark varsayılan
    const stored = localStorage.getItem("kpss-theme") as Theme | null;
    return stored || "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Eski class'ları temizle
    root.classList.remove("dark", "light");
    
    // Yeni temayı ekle
    root.classList.add(theme);
    
    // localStorage'a kaydet
    localStorage.setItem("kpss-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  return { theme, toggleTheme };
}
