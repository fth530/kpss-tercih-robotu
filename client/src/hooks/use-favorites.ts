import { useSyncExternalStore, useCallback } from "react";
import type { PositionWithQualifications } from "@shared/schema";

const FAVORITES_KEY = "kpss-favorites";

// Global state to sync across components
let favorites: PositionWithQualifications[] = [];
let listeners: Set<() => void> = new Set();

// Initialize from localStorage
function initFavorites() {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        favorites = parsed;
      }
    }
  } catch (e) {
    console.error("Failed to parse favorites:", e);
    localStorage.removeItem(FAVORITES_KEY);
  }
}

// Initialize on load
initFavorites();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return favorites;
}

function emitChange() {
  listeners.forEach(listener => listener());
}

function saveFavorites(newFavorites: PositionWithQualifications[]) {
  favorites = newFavorites;
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
  } catch (e) {
    console.error("Failed to save favorites:", e);
  }
  emitChange();
}

export function useFavorites() {
  const favoritePositions = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const isFavorite = useCallback((positionId: number) => {
    return favorites.some(p => p.id === positionId);
  }, []);

  const toggleFavorite = useCallback((position: PositionWithQualifications) => {
    const exists = favorites.some(p => p.id === position.id);
    if (exists) {
      saveFavorites(favorites.filter(p => p.id !== position.id));
    } else {
      saveFavorites([...favorites, position]);
    }
  }, []);

  const clearFavorites = useCallback(() => {
    saveFavorites([]);
  }, []);

  return {
    favoritePositions,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    favoritesCount: favoritePositions.length,
    isLoaded: true,
  };
}
