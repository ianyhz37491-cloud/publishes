/** Hash routes survive hard refresh on GitHub Pages subpaths. */
export type PortfolioRoute='landing'|'work'|'field';
export function routeFromHash(hash:string):PortfolioRoute {
  if(hash==='#/field')return 'field';
  if(hash==='#/work')return 'work';
  return 'landing';
}
export function hashForRoute(route:PortfolioRoute):string {
  return route==='landing'?'#/':`#/${route}`;
}
