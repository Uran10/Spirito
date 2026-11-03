let {ingredients,recipes}=JSON.parse(document.querySelector('#app-data').textContent);
function normalizeCatalogue(data){
 return {
  ingredients:data.ingredients.map(i=>({...i,id:Number(i.id),category:String(i.category??'').trim()||'Altri ingredienti'})),
  recipes:data.recipes.map(r=>({...r,id:Number(r.id),ingredients:r.ingredients.map(i=>({...i,id:Number(i.id)}))}))
 };
}
({ingredients,recipes}=normalizeCatalogue({ingredients,recipes}));
// PHP renders every row from ingredients into the sidebar. Use those same rows
// for selection and matching, including ingredients not used by any recipe.
const ingredientButtons=[...document.querySelectorAll('#ingredients [data-ingredient-id]')];
if(ingredientButtons.length){
 ingredients=ingredientButtons.map(button=>({
  id:Number(button.dataset.ingredientId),
  name:button.dataset.ingredientName,
  category:button.dataset.ingredientCategory
 }));
}
let saved=[];try{saved=JSON.parse(localStorage.getItem('spirito-pantry')||'[]');}catch{}
const selected=new Set(Array.isArray(saved)?saved.map(Number).filter(id=>ingredients.some(i=>i.id===id)):[]);
let filter='all';
const $=s=>document.querySelector(s);
function element(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
function missing(recipe){return recipe.ingredients.filter(i=>!selected.has(i.id));}
function pantry(){const container=$('#ingredients');container.replaceChildren();const term=$('#ingredient-search').value.toLocaleLowerCase('it');let total=0;for(const category of new Set(ingredients.map(i=>i.category))){const list=ingredients.filter(i=>i.category===category&&i.name.toLocaleLowerCase('it').includes(term));if(!list.length)continue;total+=list.length;const group=element('div','ingredient-group');group.append(element('h3','',category));const chips=element('div','chips');for(const i of list){const b=element('button',selected.has(i.id)?'chip selected':'chip',`${selected.has(i.id)?'✓':'+'} ${i.name}`);b.setAttribute('aria-pressed',String(selected.has(i.id)));b.onclick=()=>{selected.has(i.id)?selected.delete(i.id):selected.add(i.id);try{localStorage.setItem('spirito-pantry',JSON.stringify([...selected]));}catch{}render();};chips.append(b);}group.append(chips);container.append(group);}if(!total)container.append(element('p','','Nessun ingrediente trovato.'));$('#selected-count').textContent=selected.size;const totalLabel=$('#ingredient-total');if(totalLabel)totalLabel.textContent=`${ingredients.length} ingredienti dal database`;}
function art(index){const scene=element('div',`card-art scene-${index%4}`);const decor=element('span','art-star','✦');const glass=element('div','mini-glass');glass.append(element('span','mini-face','•‿•'));scene.append(decor,glass,element('span','art-spark','✧'));return scene;}
function cards(){const ready=recipes.filter(r=>!missing(r).length).length;$('#ready-count').textContent=ready;const list=recipes.filter(r=>filter==='ready'?!missing(r).length:filter==='almost'?missing(r).length>0&&missing(r).length<=2:true).sort((a,b)=>missing(a).length-missing(b).length);$('#result-count').textContent=`${list.length} drink`;$('#result-note').textContent=selected.size?`${ready?`${ready} drink pront${ready===1?'o':'i'} da preparare.`:'Il mix giusto si avvicina.'} Scopri cosa puoi creare con la tua selezione.`:'Ogni grande drink inizia da un ingrediente. Scegli i tuoi!';$('#cards').replaceChildren();if(!list.length){$('#cards').append(element('div','empty','Nessun drink qui, per ora. Prova a selezionare altri ingredienti o cambia filtro.'));return;}for(const r of list){const m=missing(r);const card=element('article','card');const picture=art(recipes.indexOf(r));picture.append(element('span',`badge ${!m.length?'ready':''}`,!m.length?'✓ Hai tutto!':selected.size?`Mancano ${m.length} ingredient${m.length===1?'e':'i'}`:`${r.ingredients.length} ingredienti`));card.append(picture);const body=element('div','card-body');body.append(element('span','eyebrow',r.glass),element('h3','',r.name),element('p','',r.description));const bottom=element('div','card-bottom');bottom.append(element('span','',`${r.ingredients.filter(i=>selected.has(i.id)).length}/${r.ingredients.length} nel tuo bar`));const button=element('button','','La ricetta ↗');button.onclick=()=>showRecipe(r);bottom.append(button);body.append(bottom);card.append(body);$('#cards').append(card);}}
function showRecipe(r){const content=$('#recipe-content');content.replaceChildren();content.append(art(recipes.indexOf(r)),element('span','eyebrow',r.glass),element('h2','',r.name),element('p','',r.description),element('h3','','Ingredienti · 1 persona'));const list=element('ul','recipe-ingredients');for(const i of r.ingredients){const li=element('li','');li.append(element('span','',`${selected.has(i.id)?'✓':'○'} ${i.name}`),element('strong','',i.amount));list.append(li);}content.append(list,element('h3','','Si prepara così'),element('p','instructions',r.instructions),element('p','ice-note','Servi con ghiaccio secondo la preparazione. Le guarnizioni facoltative sono indicate nella ricetta.'));$('#recipe-dialog').showModal();}
function render(){pantry();cards();}
$('#ingredient-search').addEventListener('input',pantry);$('#reset').onclick=()=>{selected.clear();try{localStorage.removeItem('spirito-pantry');}catch{}render();};document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));cards();});$('.close').onclick=()=>$('#recipe-dialog').close();$('#recipe-dialog').addEventListener('click',e=>{if(e.target===$('#recipe-dialog'))$('#recipe-dialog').close();});render();

// Refresh the catalogue when returning from administration or another tab.
let refreshing=false;
async function refreshCatalogue(){
 if(refreshing)return;
 refreshing=true;
 try{
  const response=await fetch('?data=1',{cache:'no-store',headers:{Accept:'application/json'}});
  if(!response.ok)throw new Error('Catalogue unavailable');
  const data=await response.json();
  if(!Array.isArray(data.ingredients)||!Array.isArray(data.recipes))throw new Error('Invalid catalogue');
  ({ingredients,recipes}=normalizeCatalogue(data));
  for(const id of selected)if(!ingredients.some(i=>i.id===id))selected.delete(id);
  render();
 }catch{
  // Keep the last successfully loaded catalogue available if the server is unreachable.
 }finally{refreshing=false;}
}
window.addEventListener('pageshow',refreshCatalogue);
window.addEventListener('focus',refreshCatalogue);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshCatalogue();});
