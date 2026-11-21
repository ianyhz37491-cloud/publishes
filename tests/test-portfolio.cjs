/* Deterministic model tests against the actual overlaid TypeScript modules. */
const fs=require('node:fs');
const assert=require('node:assert/strict');
const path=require('node:path');
const ts=require(path.resolve(process.cwd(),'node_modules/typescript'));
function load(file){
  const source=fs.readFileSync(path.resolve(process.cwd(),'src',file),'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const item={exports:{}};
  new Function('module','exports',compiled)(item,item.exports);
  return item.exports;
}
const {WakeField}=load('WakeField.ts');
const wake=new WakeField(128);
assert.equal(wake.paint({x:0,z:0},{x:0,z:0}),false,'stationary pointer must not stamp');
assert.equal(wake.paint({x:-0.6,z:0},{x:0.6,z:0},0.8),true);
assert(wake.sample(0,0.08)>0.002,'sweeping movement must leave a continuous wake');
assert.equal(wake.sample(0,2),0,'wake must be localised to the path');
assert.equal(wake.sample(3,0),0,'wake must not become a global sphere');
wake.tick(0.016);
assert([...wake.pixels].some((value,index)=>index%4===2&&value>0),'wake must encode to a texture');
for(let i=0;i<180;i++)wake.tick(0.05);
assert(wake.sample(0,0.08)<0.003,'wake must recover within a few seconds');
const {PROJECTS,filterProjects,CATEGORIES}=load('projectCatalog.ts');
assert.equal(PROJECTS.length,12);
assert.equal(new Set(PROJECTS.map(p=>p.id)).size,12,'serial codes must be unique');
assert(PROJECTS.every(p=>p.status==='placeholder'&&!p.title&&!p.liveUrl&&!p.thumbnail));
for(const category of CATEGORIES){
  const items=filterProjects(category);
  assert.equal(items.length,category==='ALL'?12:3,'filter must select prototype records');
}
const {routeFromHash,hashForRoute}=load('portfolioRoutes.ts');
assert.equal(routeFromHash(''), 'landing');
assert.equal(routeFromHash('#/work'),'work');
assert.equal(routeFromHash('#/field'),'field');
assert.equal(routeFromHash('#/invalid'),'landing');
for(const route of ['landing','work','field'])
  assert.equal(routeFromHash(hashForRoute(route)),route,'route deep link must round trip');
console.log('PASS: wake continuity, locality, decay, catalogue provenance, filters, and hash routes');
