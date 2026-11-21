/** Prototype-only catalogue. Never present these empty slots as published work. */
export const CATEGORIES = ['ALL','SYSTEMS','EXPERIMENTS','RESEARCH','VISUAL'] as const;
export type Category = Exclude<(typeof CATEGORIES)[number], 'ALL'>;
export type CategoryFilter = (typeof CATEGORIES)[number];

export type ProjectRecord = {
  id: string;
  category: Category;
  status: 'placeholder' | 'published';
  title?: string;
  codename?: string;
  description?: string;
  thumbnail?: string;
  detailPath?: string;
  liveUrl?: string;
  repositoryUrl?: string;
  provenance?: string[];
  order: number;
};

const slots: ReadonlyArray<readonly [Category,string]> = [
  ['SYSTEMS','SYS'],['EXPERIMENTS','EXP'],['RESEARCH','RES'],['VISUAL','VIS']
];

/** Stable IDs, independent of sort or filter order. Actual projects are added later. */
export const PROJECTS: readonly ProjectRecord[] = slots.flatMap(([category,prefix],group) =>
  Array.from({length:3},(_,index)=>({
    id:`${prefix}-${String(index+1).padStart(3,'0')}`,
    category,
    status:'placeholder' as const,
    order:index*4+group
  }))
).sort((a,b)=>a.order-b.order);

export function filterProjects(category:CategoryFilter): readonly ProjectRecord[] {
  return category==='ALL' ? PROJECTS : PROJECTS.filter(project=>project.category===category);
}
