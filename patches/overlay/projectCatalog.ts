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

/**
 * One verified project slot is open. Its public catalogue identity stays
 * anonymous until a broader naming convention is selected.
 *
 * The remote beta may be temporarily unavailable while its free host sleeps.
 * Do not imply robust PDF, lexical accuracy or cloud-sync functionality.
 */
const readerProject: ProjectRecord = {
  id:'SYS-001',
  category:'SYSTEMS',
  status:'published',
  description:'A browser-based multilingual reading environment for books and documents, with contextual word lookup and paragraph-aligned translation.',
  thumbnail:'media/reader-editorial.jpg',
  liveUrl:'https://margin-language-reader.onrender.com/',
  provenance:['projects/PR-18-language-reader/web/README.md'],
  order:0
};

/** Stable IDs are unaffected by category filtering or release ordering. */
export const PROJECTS:readonly ProjectRecord[] = slots.flatMap(([category,prefix],group)=>
  Array.from({length:3},(_,index)=>{
    const id=`${prefix}-${String(index+1).padStart(3,'0')}`;
    return id===readerProject.id ? readerProject : {
      id,category,status:'placeholder' as const,order:index*4+group
    };
  })
).sort((a,b)=>a.order-b.order);

export function filterProjects(category:CategoryFilter): readonly ProjectRecord[] {
  return category==='ALL' ? PROJECTS : PROJECTS.filter(project=>project.category===category);
}
