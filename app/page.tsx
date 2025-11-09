"use client";

import { useEffect, useMemo, useState } from 'react';

type SubjectNode = {
  id: number;
  name: string;
  url?: string;
  childs?: SubjectNode[];
};

type CategoryTree = SubjectNode[];

type SearchResult = {
  id: number;
  name: string;
  minSizeQty: number;
  url: string;
};

export default function Page() {
  const [tree, setTree] = useState<CategoryTree>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);
  const [threshold, setThreshold] = useState<number>(2);
  const [maxPages, setMaxPages] = useState<number>(2);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/categories');
        if (!res.ok) throw new Error('?? ??????? ????????? ?????????');
        const json = await res.json();
        setTree(json.tree as CategoryTree);
      } catch (e: any) {
        setError(e.message || '?????? ??? ???????? ?????????');
      }
    })();
  }, []);

  const rootCategories = useMemo(() => tree, [tree]);
  const subcategories = useMemo(() => {
    const node = rootCategories.find((n) => n.id === selectedCatId);
    return node?.childs ?? [];
  }, [rootCategories, selectedCatId]);

  async function onSearch() {
    setError(null);
    setLoading(true);
    setResults([]);
    try {
      if (!selectedSubId) throw new Error('???????? ????????????');
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: selectedSubId, threshold, maxPages })
      });
      if (!res.ok) throw new Error('?????? ??????');
      const data = (await res.json()) as { results: SearchResult[] };
      setResults(data.results);
    } catch (e: any) {
      setError(e.message || '??????');
    } finally {
      setLoading(false);
    }
  }

  function downloadTxt() {
    const lines = results.map((r) => `${r.name} | ???????: ${r.minSizeQty} | ${r.url}`);
    const blob = new Blob([lines.join('\n') || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wb_low_stock.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, opacity: 0.8, marginBottom: 8 }}>?????????</label>
          <select
            value={selectedCatId ?? ''}
            onChange={(e) => {
              setSelectedCatId(e.target.value ? Number(e.target.value) : null);
              setSelectedSubId(null);
            }}
            style={{ width: '100%', padding: 10, borderRadius: 8, background: '#0b0f14', color: '#e6edf3', border: '1px solid #283042' }}
          >
            <option value="">? ???????? ?</option>
            {rootCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, opacity: 0.8, marginBottom: 8 }}>????????????</label>
          <select
            value={selectedSubId ?? ''}
            onChange={(e) => setSelectedSubId(e.target.value ? Number(e.target.value) : null)}
            style={{ width: '100%', padding: 10, borderRadius: 8, background: '#0b0f14', color: '#e6edf3', border: '1px solid #283042' }}
            disabled={!selectedCatId}
          >
            <option value="">? ???????? ?</option>
            {subcategories.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, opacity: 0.8, marginBottom: 8 }}>????? ??????? (? N, ? 1)</label>
          <input
            type="number"
            min={1}
            value={threshold}
            onChange={(e) => setThreshold(Math.max(1, Number(e.target.value)))}
            style={{ width: '100%', padding: 10, borderRadius: 8, background: '#0b0f14', color: '#e6edf3', border: '1px solid #283042' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, opacity: 0.8, marginBottom: 8 }}>???????? ??????? ????????</label>
          <input
            type="number"
            min={1}
            max={50}
            value={maxPages}
            onChange={(e) => setMaxPages(Math.min(50, Math.max(1, Number(e.target.value))))}
            style={{ width: '100%', padding: 10, borderRadius: 8, background: '#0b0f14', color: '#e6edf3', border: '1px solid #283042' }}
          />
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
        <button onClick={onSearch} disabled={loading || !selectedSubId} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #375a7f', background: '#1b2636', color: 'white', cursor: 'pointer' }}>
          {loading ? '???? ??????' : '??????'}
        </button>
        <button onClick={downloadTxt} disabled={results.length === 0} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #375a7f', background: '#142233', color: 'white', cursor: 'pointer' }}>
          ??????? .txt
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 12, color: '#ff8080' }}>{error}</div>
      )}

      <div style={{ marginTop: 20 }}>
        <div style={{ opacity: 0.8, marginBottom: 8 }}>???????: {results.length}</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {results.map((r) => (
            <a key={r.id} href={r.url} target="_blank" rel="noreferrer" style={{ display: 'block', padding: 12, borderRadius: 10, border: '1px solid #283042', background: '#0b0f14', color: '#e6edf3', textDecoration: 'none' }}>
              <div style={{ fontWeight: 600 }}>{r.name}</div>
              <div style={{ opacity: 0.9 }}>??????? (??? ?? ???????): {r.minSizeQty}</div>
              <div style={{ opacity: 0.7, fontSize: 12 }}>{r.url}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
