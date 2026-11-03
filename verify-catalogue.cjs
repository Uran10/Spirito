// Run with: node verify-catalogue.cjs <path-to-data-response.json>
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const data=JSON.parse(fs.readFileSync(process.argv[2],'utf8').replace(/^\uFEFF/,''));
class Element{
 constructor(){this.children=[];this.dataset={};this.value='';this.classList={toggle(){}};}
 append(...items){this.children.push(...items);}
 replaceChildren(...items){this.children=items;}
 setAttribute(){}
 addEventListener(){}
}
const nodes=new Map();
const get=key=>{if(!nodes.has(key))nodes.set(key,new Element());return nodes.get(key);};
get('#app-data').textContent=JSON.stringify(data);
const serverButtons=data.ingredients.map(i=>({dataset:{ingredientId:String(i.id),ingredientName:i.name,ingredientCategory:i.category}}));
const events={};
const saved=new Map();
vm.runInNewContext(fs.readFileSync('app.js','utf8'),{
 document:{querySelector:get,querySelectorAll:s=>s==='#ingredients [data-ingredient-id]'?serverButtons:[],createElement:()=>new Element(),addEventListener(){}},
 window:{addEventListener:(event,fn)=>events[event]=fn},
 localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)},
 fetch:async()=>({ok:true,json:async()=>JSON.parse(JSON.stringify(data))})
});
const chips=()=>get('#ingredients').children.flatMap(group=>group.children[1]?.children||[]);
assert.equal(chips().length,data.ingredients.length,'All database ingredients must be selectable');
for(const ingredient of data.ingredients)assert.ok(chips().some(b=>b.textContent===`+ ${ingredient.name}`),ingredient.name);
const recipe=data.recipes.find(r=>r.name==='Gin Tonic');
for(const ingredient of recipe.ingredients)chips().find(b=>b.textContent===`+ ${ingredient.name}`).onclick();
assert.ok(Number(get('#ready-count').textContent)>=1,'String IDs from PDO must match selected ingredients');
const before=Number(get('#selected-count').textContent);
events.pageshow().then(()=>{
 assert.equal(chips().length,data.ingredients.length);
 assert.equal(Number(get('#selected-count').textContent),before,'Refresh must preserve selection with string IDs');
 assert.ok(Number(get('#ready-count').textContent)>=1);
 console.log(`OK: ${data.ingredients.length} selectable ingredients, ${data.recipes.length} recipes, string IDs, matching and selection after refresh.`);
}).catch(e=>{console.error(e);process.exitCode=1;});
