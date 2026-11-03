// Dependency-free checks for matching, filters, persistence and recipe details.
const fs=require('node:fs');const vm=require('node:vm');const assert=require('node:assert/strict');
class Element {constructor(){this.children=[];this.dataset={};this.classList={toggle(){}};this.value='';this.textContent='';}append(...children){this.children.push(...children);}replaceChildren(...children){this.children=children;}setAttribute(){}addEventListener(type,fn){this[type]=fn;}showModal(){this.open=true;}close(){this.open=false;}}
const nodes=new Map();const get=s=>{if(!nodes.has(s))nodes.set(s,new Element());return nodes.get(s);};
const data={ingredients:[{id:1,name:'Gin',category:'Alcolici'},{id:2,name:'Tonica',category:'Mixer'},{id:3,name:'Lime',category:'Extra'}],recipes:[{id:1,name:'Gin Tonic',description:'Fresco',glass:'Highball',instructions:'Mescola.',ingredients:[{id:1,name:'Gin',amount:'50 ml'},{id:2,name:'Tonica',amount:'150 ml'}]},{id:2,name:'Gin Lime',description:'Agrumato',glass:'Tumbler',instructions:'Agita.',ingredients:[{id:1,name:'Gin',amount:'50 ml'},{id:3,name:'Lime',amount:'20 ml'}]}]};
get('#app-data').textContent=JSON.stringify(data);const filters=['all','ready','almost'].map(f=>{const e=new Element();e.dataset.filter=f;return e;});const storage=new Map();
vm.runInNewContext(fs.readFileSync('app.js','utf8'),{document:{querySelector:get,querySelectorAll:()=>filters,createElement:()=>new Element()},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}});
assert.equal(get('#cards').children.length,2);assert.equal(get('#ready-count').textContent,0);
get('#ingredients').children[0].children[1].children[0].onclick();
assert.equal(get('#selected-count').textContent,1);assert.equal(storage.get('spirito-pantry'),'[1]');
get('#ingredients').children[1].children[1].children[0].onclick();
assert.equal(get('#ready-count').textContent,1);
filters[1].onclick();assert.equal(get('#cards').children.length,1);
get('#cards').children[0].children[1].children[3].children[1].onclick();
assert.equal(get('#recipe-dialog').open,true);assert.equal(get('#recipe-content').children[2].textContent,'Gin Tonic');
filters[2].onclick();assert.equal(get('#cards').children.length,1);assert.equal(get('#cards').children[0].children[1].children[1].textContent,'Gin Lime');
get('#reset').onclick();assert.equal(get('#selected-count').textContent,0);assert.equal(storage.has('spirito-pantry'),false);
get('#ingredient-search').value='inesistente';get('#ingredient-search').input();assert.equal(get('#ingredients').children[0].textContent,'Nessun ingrediente trovato.');
console.log('OK: ingredient selection, recipe matching, filters, persistence, details, reset and search.');
