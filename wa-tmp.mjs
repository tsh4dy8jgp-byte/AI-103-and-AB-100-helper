import { ADVANCED_QUESTIONS } from "./lib/advanced-questions.ts";
const STOP = new Set("a an the is are was were be been being to of in on for with and or that this these those which what should must can could would may might how why when where who by from as at it its their your you not no if then than only also them there here each per use used using".split(" "));
const toks = t => t.toLowerCase().replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(w=>w.length>3&&!STOP.has(w));
const sc = q => { const c=new Set(q.correct.flatMap(i=>toks(q.options[i]))); const d=new Set();
  q.options.forEach((o,i)=>{ if(!q.correct.includes(i)) for(const w of toks(o)) if(!c.has(w)) d.add(w); });
  const e=new Set(toks(q.explanation)); let h=0; for(const w of d) if(e.has(w)) h++; return {h,p:d.size}; };
const weak = ADVANCED_QUESTIONS.filter(q => { const s=sc(q); return s.p>2 && s.h<2; });
console.error(`remaining scoreable weak: ${weak.length}`);
for (const q of weak) {
  console.log(`### ${q.id} | ${q.prompt.slice(0,84)}`);
  console.log(`  * ${q.correct.map(i=>q.options[i].slice(0,70)).join(" ++ ")}`);
  console.log(`  x ${q.options.filter((_,i)=>!q.correct.includes(i)).map(o=>o.slice(0,52)).join(" | ")}`);
  console.log(`E: ${q.explanation}\n`); }
