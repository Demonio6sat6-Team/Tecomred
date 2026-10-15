import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useCustomer } from './CustomerContext';
import { useStore } from './StoreContext';
import { ProductListsContext, type CompareResult } from './useProductLists';

const EMPTY_IDS: number[] = [];
const COMPARE_LIMIT = 3;

export function ProductListsProvider({ children }: { children: ReactNode }) {
  const { user } = useCustomer();
  const [favoritesByAccount, setFavoritesByAccount] = useLocalStorage<Record<string, number[]>>('favorite_products_by_account', {});
  const favoriteAccountKey = user ? String(user.id || user.email.toLowerCase()) : 'guest';
  const guestFavorites = favoritesByAccount.guest ?? EMPTY_IDS;
  const storedFavorites = favoritesByAccount[favoriteAccountKey] ?? EMPTY_IDS;
  const setStoredFavorites = useCallback((update: number[] | ((previous: number[]) => number[])) => {
    setFavoritesByAccount(previous => {
      const current = previous[favoriteAccountKey] ?? EMPTY_IDS;
      const next = typeof update === 'function' ? update(current) : update;
      return { ...previous, [favoriteAccountKey]: next };
    });
  }, [favoriteAccountKey, setFavoritesByAccount]);
  const [storedCompare, setCompare] = useLocalStorage<number[]>('compare_product_ids', EMPTY_IDS);
  const { products } = useStore();
  const availableIds = useMemo(() => new Set(products.map(product => product.id)), [products]);
  const favoriteIds = storedFavorites.filter(id => availableIds.has(id));
  const compareIds = storedCompare.filter(id => availableIds.has(id)).slice(0, COMPARE_LIMIT);

  useEffect(() => {
    if (!user || guestFavorites.length === 0) return;
    setStoredFavorites(previous => [...new Set([...previous, ...guestFavorites])]);
    setFavoritesByAccount(previous => ({ ...previous, guest: [] }));
  }, [guestFavorites, setFavoritesByAccount, setStoredFavorites, user]);

  const toggleFavorite = (id: number) => {
    if (!availableIds.has(id)) return;
    setStoredFavorites(previous => previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id]);
  };

  const toggleCompare = (id: number): CompareResult => {
    if (!availableIds.has(id)) return 'unavailable';
    if (compareIds.includes(id)) {
      setCompare(previous => previous.filter(item => item !== id));
      return 'removed';
    }
    if (compareIds.length >= COMPARE_LIMIT) return 'limit';
    setCompare(previous => [...previous.filter(item => availableIds.has(item)), id]);
    return 'added';
  };

  return (
    <ProductListsContext.Provider value={{
      favoriteIds, compareIds,
      isFavorite: id => favoriteIds.includes(id),
      isCompared: id => compareIds.includes(id),
      toggleFavorite, toggleCompare,
      clearCompare: () => setCompare([]),
    }}>
      {children}
    </ProductListsContext.Provider>
  );
}
