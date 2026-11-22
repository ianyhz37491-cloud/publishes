/* Deterministic geometry/LOD model checks against the shipped overlay. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require(path.resolve(process.cwd(),'node_modules/typescript'));
const source=fs.readFileSync(path.resolve(process.cwd(),'src/meadowLayout.ts'),'utf8');
const compiled=ts.transpileModule(source,{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText;
const mod={exports:{}};
new Function('module','exports',compiled)(mod,mod.exports);
const {meadowSpec,meadowDensity,sampleMeadowCell}=mod.exports;
assert.equal(meadowDensity('near',0),1,'original centre remains at full sampling');
assert.equal(meadowDensity('near',11),0,'near sampling tapers without square boundary');
assert.equal(meadowDensity('middle',0),0,'mid sampling does not duplicate close-up');
assert.equal(meadowDensity('far',0),0,'far samples do not clutter foreground');
for(const r of [0,3.5,5,7,10,15,20,26,36,50]){
  for(const band of ['near','middle','far']){
    const weight=meadowDensity(band,r);
    assert(weight>=0&&weight<=1,'density is a bounded probability');
  }
}
for(const r of [5,7,9,12,18,23,30,40]){
  assert(['near','middle','far'].some(b=>meadowDensity(b,r)>0.15),
    'no entirely bald annulus within the visible meadow at radius '+r);
}
for(const quality of ['desktop','touch','low']){
  assert.equal(meadowSpec(quality,'near').segments,7);
  for(const band of ['near','middle','far']){
    const spec=meadowSpec(quality,band);
    assert(spec.spacing>0&&spec.extent>=10.5);
    const a=sampleMeadowCell(quality,band,4,-7);
    assert.deepEqual(sampleMeadowCell(quality,band,4,-7),a,'world seeds are deterministic');
    if(a){assert(a.size>=.8&&a.size<=1.2);assert(a.accent===0||a.accent===1);}
  }
}
assert(meadowSpec('desktop','near').spacing<meadowSpec('touch','near').spacing);
assert(meadowSpec('touch','near').spacing<meadowSpec('low','near').spacing);
assert(meadowSpec('desktop','far').segments<meadowSpec('desktop','near').segments);
let counts={};
for(const quality of ['desktop','touch','low']){
  counts[quality]={};
  for(const band of ['near','middle','far']){
    const spec=meadowSpec(quality,band);
    const n=Math.ceil(spec.extent/spec.spacing);
    let found=0;
    for(let i=-n;i<n;i++)for(let j=-n;j<n;j++)
      if(sampleMeadowCell(quality,band,i,j))found++;
    assert(found>100,'every visual band must contain grass, '+quality+' '+band);
    counts[quality][band]=found;
  }
  const total=Object.values(counts[quality]).reduce((a,b)=>a+b,0);
  assert(total<550000,'budget caps per preset prevent runaway instancing');
}
for(const band of ['near','middle','far']){
  assert(counts.desktop[band]>counts.touch[band]);
  assert(counts.touch[band]>counts.low[band]);
}
console.log('PASS: unified meadow world sampling, continuous overlap, deterministic seeds, geometry and quality budgets',counts);
