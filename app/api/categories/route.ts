import { NextResponse } from 'next/server';

// Wildberries subject tree endpoints seen in the wild
const SUBJECT_TREE_URLS = [
  'https://static-basket-01.wb.ru/vol0/data/subject-tree.json',
  'https://static-basket-01.wbbasket.ru/vol0/data/subject-tree.json'
];

type SubjectNode = {
  id: number;
  name: string;
  url?: string;
  childs?: SubjectNode[];
};

type MenuNode = SubjectNode;

async function fetchSubjectTree(): Promise<MenuNode[] | null> {
  for (const url of SUBJECT_TREE_URLS) {
    try {
      const res = await fetch(url, { next: { revalidate: 60 * 60 } });
      if (!res.ok) continue;
      const json = (await res.json()) as MenuNode[];
      if (Array.isArray(json) && json.length > 0) return json;
    } catch {
      // try next
    }
  }
  return null;
}

// Reduce to only 2 levels: categories and their subcategories for simplicity
function flattenTwoLevels(tree: MenuNode[]): SubjectNode[] {
  return tree.map((n) => ({
    id: n.id,
    name: n.name,
    url: n.url,
    childs: (n.childs || []).map((c) => ({ id: c.id, name: c.name, url: c.url }))
  }));
}

export async function GET() {
  const tree = await fetchSubjectTree();
  if (!tree) {
    return NextResponse.json({ error: '?? ??????? ???????? ?????? ?????????' }, { status: 502 });
  }
  const two = flattenTwoLevels(tree);
  return NextResponse.json({ tree: two });
}
