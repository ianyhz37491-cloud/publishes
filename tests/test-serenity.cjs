/* Standalone test of the *actual TypeScript* serenity timing model.
 * Run from the Zephyr checkout: node ../tests/test-serenity.cjs
 */
const fs=require('node:fs');
const assert=require('node:assert/strict');
const path=require('node:path');
const ts=require(path.resolve(process.cwd(),'node_modules/typescript'));
const file=path.resolve(process.cwd(),'src/serenityCycle.ts');
const source=fs.readFileSync(file,'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const moduleObj={exports:{}};
new Function('module','exports',js)(moduleObj,moduleObj.exports);
const {momentAt,atmosphereWeight}=moduleObj.exports;
const labels=['Sunrise','Daylight','Sunset','Night'];

for(let i=0;i<4;i++){
  const start=i/4,mid=start+1/8,end=(i+1)/4;
  assert.equal(momentAt(mid).mood,labels[i],labels[i]+' must occupy its own full quarter');
  assert.equal(momentAt(start).mood,labels[i]);
  assert.equal(momentAt(end-1e-6).mood,labels[i]);
  const weights=labels.map((_,k)=>atmosphereWeight(mid,k));
  assert(Math.abs(weights.reduce((a,b)=>a+b,0)-1)<1e-9,'ambience mixer gains must sum to 1');
}
for(const boundary of [0,0.25,0.5,0.75,1]){
  const left=momentAt(boundary-1e-6),right=momentAt(boundary+1e-6);
  assert(Math.abs(left.daylight-right.daylight)<0.001,'light intensity jump at '+boundary);
  assert(Math.abs(left.elevation-right.elevation)<0.001,'sun altitude jump at '+boundary);
  assert(Math.abs(left.twilight-right.twilight)<0.001,'sunset palette jump at '+boundary);
}
assert(momentAt(0.875).daylight>=0.45,'night must be intentionally visible');
assert.equal(momentAt(0.875).mood,'Night');
assert(momentAt(0.875).starOpacity>0.9,'stars should become visible at night');
assert(momentAt(0.375).starOpacity<0.01,'stars should disappear in daytime');
console.log('PASS: four equal intervals, continuous lighting, moonlit night, sound crossfades');
