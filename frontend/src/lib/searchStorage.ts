export type Lead = {
  name: string;
  status: string;
  phone?: string;
  address?: string;
  website?: string;
};

export function normalizeLead(
  lead: Omit<Lead, "status"> & { status?: string },
): Lead {
  return {
    ...lead,
    status: lead.status ?? "novo",
  };
}

export type SearchHistoryRow = {
  id: number;
  user_id: string;
  query: string;
  created_at: string;
  leads_json: Lead[];
};

function safeParseLeads(input: unknown): Lead[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return (input as any[]).map((l) => normalizeLead(l));
  }
  try {
    const parsed = JSON.parse(String(input));
    return Array.isArray(parsed)
      ? (parsed as any[]).map((l) => normalizeLead(l))
      : [];
  } catch {
    return [];
  }
}

function safeReadJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export type LastSearchCache = {
  query: string;
  leads: Lead[];
  updatedAt: number;
};

export function getLastCachedSearchLeads(
  userId: string,
): LastSearchCache | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(LS2.lastSearch(userId));

  return safeReadJson<LastSearchCache>(raw);
}

export function setLastCachedSearchLeads(opts: {
  userId: string;

  query: string;
  leads: Lead[];
}): void {
  const { userId, query, leads } = opts;
  if (typeof window === "undefined") return;

  const payload: LastSearchCache = {
    query,
    leads,
    updatedAt: Date.now(),
  };

  window.localStorage.setItem(LS2.lastSearch(userId), JSON.stringify(payload));
}

export function getCachedSearchLeads(userId: string, query: string): Lead[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(LS2.searchByQuery(userId, query));

  const parsed = safeReadJson<{ leads: Lead[] }>(raw);
  return parsed?.leads ? safeParseLeads(parsed.leads) : [];
}

export function setCachedSearchLeads(opts: {
  userId: string;
  query: string;
  leads: Lead[];
}): void {
  const { userId, query, leads } = opts;
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    LS2.searchByQuery(userId, query),
    JSON.stringify({ leads }),
  );
}

const LS2 = {
  version: "v1",
  lastSearch: (userId: string) => `lastSearchCache:${userId}:${"v1"}`,
  searchByQuery: (userId: string, query: string) =>
    `searchCache:${userId}:${"v1"}:${encodeURIComponent(query)}`,
  favorites: (userId: string) => `favoritesCache:${userId}:${"v1"}`,
  // Histórico completo no local (ordenado por createdAt desc)
  history: (userId: string) => `searchHistoryCache:${userId}:${"v1"}`,
};

type SearchHistoryCache = {
  // Mesmo formato do SearchHistoryRow, mas sem necessidade de compatível com Supabase.
  items: SearchHistoryRow[];
};

function readHistoryCache(userId: string): SearchHistoryRow[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(LS2.history(userId));
  const parsed = safeReadJson<SearchHistoryCache>(raw);
  return parsed?.items ? parsed.items : [];
}

function writeHistoryCache(userId: string, items: SearchHistoryRow[]): void {
  if (typeof window === "undefined") return;
  const payload: SearchHistoryCache = { items };
  window.localStorage.setItem(LS2.history(userId), JSON.stringify(payload));
}

export async function getLastSearchLeads(userId: string): Promise<Lead[]> {
  // Fonte de verdade primária: cache do último resultado
  const cached = getLastCachedSearchLeads(userId);
  if (cached?.leads?.length) return cached.leads;

  // Fallback: último item do histórico persistido localmente
  const items = readHistoryCache(userId);
  const last = items[0];
  return last?.leads_json ? safeParseLeads(last.leads_json) : [];
}

export async function upsertSearchHistory(opts: {
  userId: string;
  query: string;
  leads: Lead[];
}): Promise<void> {
  const { userId, query, leads } = opts;
  if (typeof window === "undefined") return;

  // Atualiza cache “last search”
  setLastCachedSearchLeads({ userId, query, leads });
  setCachedSearchLeads({ userId, query, leads });

  const normalized = safeParseLeads(leads);
  const current = readHistoryCache(userId);

  // Insere novo item (mantém ordenação por created_at desc)
  const nextIdBase = current.reduce((max, i) => Math.max(max, i.id ?? 0), 0);
  const created_at = new Date().toISOString();
  const newRow: SearchHistoryRow = {
    id: nextIdBase + 1,
    user_id: userId,
    query,
    created_at,
    leads_json: normalized,
  };

  const updated = [newRow, ...current]
    // evita crescimento infinito por query duplicada recente (opcional)
    .filter((_row, idx) => {
      if (idx > 200) return false;
      return true;
    });

  writeHistoryCache(userId, updated);
}

export async function getSearchHistoryGroups(userId: string): Promise<
  Array<{
    categoria: string;
    items: SearchHistoryRow[];
  }>
> {
  const rows = readHistoryCache(userId);

  const groupedMap = rows.reduce<Record<string, SearchHistoryRow[]>>(
    (acc, item) => {
      const categoria = item.query.split(" em ")[0].toLowerCase();
      if (!acc[categoria]) acc[categoria] = [];
      acc[categoria].push(item);
      return acc;
    },
    {},
  );

  return Object.entries(groupedMap).map(([categoria, items]) => ({
    categoria,
    items,
  }));
}

export async function getFavorites(userId: string): Promise<Lead[]> {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(LS2.favorites(userId));
  const parsed = safeReadJson<{ leads: Lead[] }>(raw);
  return parsed?.leads ? safeParseLeads(parsed.leads) : [];
}

export async function setFavorites(
  userId: string,
  leads: Lead[],
): Promise<void> {
  const normalized = safeParseLeads(leads);
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    LS2.favorites(userId),
    JSON.stringify({ leads: normalized }),
  );
}
