import { NextResponse } from 'next/server';
import { z } from 'zod';

const BodySchema = z.object({
  subjectId: z.number().int().positive(),
  threshold: z.number().int().min(1).max(999),
  maxPages: z.number().int().min(1).max(50).default(2),
});

type WBSearchProduct = {
  id: number; // nmID
};

type WBCardSizeStock = { wh: number; qty: number };

type WBCardSize = {
  name: string;
  stocks?: WBCardSizeStock[];
};

type WBCardProduct = {
  id: number; // nmID
  name: string;
  sizes?: WBCardSize[];
};

async function fetchSearchPage(subjectId: number, page: number): Promise<number[]> {
  const u = new URL('https://search.wb.ru/exactmatch/ru/common/v4/search');
  u.searchParams.set('appType', '1');
  u.searchParams.set('curr', 'rub');
  u.searchParams.set('dest', '-1257786');
  u.searchParams.set('resultset', 'catalog');
  u.searchParams.set('sort', 'popular');
  u.searchParams.set('spp', '0');
  u.searchParams.set('query', '');
  u.searchParams.set('subject', String(subjectId));
  u.searchParams.set('page', String(page));

  const res = await fetch(u.toString(), { cache: 'no-store' });
  if (!res.ok) return [];
  const json = await res.json().catch(() => null);
  const products = json?.data?.products as WBSearchProduct[] | undefined;
  if (!products || !Array.isArray(products)) return [];
  return products.map((p) => p.id);
}

async function fetchCardDetailsBatch(ids: number[]): Promise<WBCardProduct[]> {
  if (ids.length === 0) return [];
  const chunks: number[][] = [];
  for (let i = 0; i < ids.length; i += 100) chunks.push(ids.slice(i, i + 100));

  const results: WBCardProduct[] = [];
  for (const chunk of chunks) {
    const u = new URL('https://card.wb.ru/cards/detail');
    u.searchParams.set('appType', '1');
    u.searchParams.set('curr', 'rub');
    u.searchParams.set('dest', '-1257786');
    u.searchParams.set('nm', chunk.join(','));

    const res = await fetch(u.toString(), { cache: 'no-store' });
    if (!res.ok) continue;
    const json = await res.json().catch(() => null) as any;
    const items: WBCardProduct[] | undefined = json?.data?.products;
    if (Array.isArray(items)) results.push(...items);
  }
  return results;
}

function computeMinSizeQty(product: WBCardProduct): number | null {
  const sizes = product.sizes || [];
  let minQty: number | null = null;
  for (const s of sizes) {
    const total = (s.stocks || []).reduce((sum, st) => sum + (st.qty || 0), 0);
    if (total > 0) {
      if (minQty === null || total < minQty) minQty = total;
    }
  }
  return minQty;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: '???????? ?????????' }, { status: 400 });
  }
  const { subjectId, threshold, maxPages } = parsed.data;

  const nmIds: number[] = [];
  for (let p = 1; p <= maxPages; p++) {
    const pageIds = await fetchSearchPage(subjectId, p).catch(() => []);
    if (pageIds.length === 0) break;
    nmIds.push(...pageIds);
  }

  const uniqueIds = Array.from(new Set(nmIds));
  const cards = await fetchCardDetailsBatch(uniqueIds);

  const results = cards
    .map((c) => {
      const minQty = computeMinSizeQty(c);
      return { id: c.id, name: c.name, minSizeQty: minQty } as const;
    })
    .filter((r) => r.minSizeQty !== null && r.minSizeQty >= 1 && r.minSizeQty <= threshold)
    .map((r) => ({
      id: r.id,
      name: r.name,
      minSizeQty: r.minSizeQty as number,
      url: `https://www.wildberries.ru/catalog/${r.id}/detail.aspx`
    }));

  return NextResponse.json({ results });
}
