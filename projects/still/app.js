'use strict';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const products = {
 solar: { name:'Solar', price:145, image:'assets/solar.jpg', chapter:'01 / THE LIGHT', notes:['Bergamot','Neroli','Sandalwood'], description:'The warmth of late afternoon, held in glass. An imagined composition of luminous citrus, soft white florals and the quiet comfort of sun-warmed wood.' },
 verdant: { name:'Verdant', price:145, image:'assets/verdant.jpg', chapter:'02 / THE STILLNESS', notes:['Fig leaf','Iris','Vetiver'], description:'A garden just after rain. Green fig leaves meet the powdery softness of iris and an earthy, grounded finish. An imagined moment of clarity.' },
 afterhours: { name:'Afterhours', price:165, image:'assets/afterhours.jpg', chapter:'03 / THE AFTERGLOW', notes:['Black tea','Cedar','Amber'], description:'The room after everyone has gone. Dark tea, dry cedar and a soft amber glow create an imagined fragrance for the hours that belong only to you.' }
};
const ids = Object.keys(products);
const money = amount => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(amount);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const story = $('.scroll-story');
const stage = $('.scene-stage');
const images = $$('.scene-image');
const copies = $$('.scene-copy');
let currentChapter = -1;
let queued = false;
const clamp = value => Math.max(0,Math.min(1,value));
const smooth = (a,b,x) => {const n=clamp((x-a)/(b-a));return n*n*(3-2*n);};
function updateScroll() {
 queued=false;
 const distance=Math.max(1,story.offsetHeight-stage.offsetHeight);
 const progress=clamp(-story.getBoundingClientRect().top/distance);
 const position=progress*3;
 const chapter=position<.95?0:position<1.95?1:2;
 const first=smooth(.75,1.15,position), second=smooth(1.75,2.15,position);
 const weights=reducedMotion.matches?ids.map((_,i)=>i===chapter?1:0):[1-first,first*(1-second),second];
 images.forEach((image,i)=>{
   image.style.opacity=weights[i];
   image.style.transform=reducedMotion.matches?'none':`scale(${1+progress*.035})`;
 });
 copies.forEach((copy,i)=>{
   copy.style.opacity=reducedMotion.matches?weights[i]:clamp((weights[i]-.3)/.7);
   copy.style.transform=reducedMotion.matches?'none':`translateY(${(1-weights[i])*14}px)`;
 });
 if(chapter!==currentChapter){
   currentChapter=chapter;
   copies.forEach((copy,i)=>{copy.classList.toggle('active',i===chapter);copy.inert=i!==chapter;copy.setAttribute('aria-hidden',String(i!==chapter));});
   $$('[data-chapter]').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===chapter)));
   const product=products[ids[chapter]];
   $('#scene-number').textContent=`0${chapter+1} / 03`;
   $('#scene-name').textContent=product.name.toUpperCase();
   $('#scene-notes').textContent=product.notes.join(' · ').toUpperCase();
 }
 $('#header').classList.toggle('on-paper',$('#story').getBoundingClientRect().top<=85);
}
function scheduleScroll(){if(!queued){queued=true;requestAnimationFrame(updateScroll);}}
window.addEventListener('scroll',scheduleScroll,{passive:true});
window.addEventListener('resize',scheduleScroll,{passive:true});
reducedMotion.addEventListener('change',scheduleScroll);
$$('[data-chapter]').forEach(button=>button.addEventListener('click',()=>{
 const chapter=Number(button.dataset.chapter);
 const distance=story.offsetHeight-stage.offsetHeight;
 const top=window.scrollY+story.getBoundingClientRect().top+distance*(chapter===0?0:(chapter+.35)/3);
 window.scrollTo({top,behavior:reducedMotion.matches?'instant':'smooth'});
}));
updateScroll();
// The bag is intentionally memory-only. Reloading clears it; no payment requests exist.
const bag = new Map();
let toastTimer;
let lastTrigger;
let detailProduct='solar';
function notify(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('visible');toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3000);}
function addProduct(id){
 const quantity=bag.get(id)||0;
 if(quantity>=9){notify('A maximum of 9 per composition in this demo.');return false;}
 bag.set(id,quantity+1);updateBagCount();notify(`${products[id].name} added to your demo bag.`);return true;
}
function updateBagCount(){const count=[...bag.values()].reduce((sum,n)=>sum+n,0);$('#bag-count').textContent=count;$('.bag-trigger').setAttribute('aria-label',`Open demo bag, ${count} ${count===1?'item':'items'}`);}
function openDialog(dialog,trigger){lastTrigger=trigger;dialog.showModal();document.body.classList.add('modal-open');}
$$('dialog').forEach(dialog=>{
 dialog.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>dialog.close()));
 dialog.addEventListener('click',event=>{
  const box=dialog.getBoundingClientRect();
  if(event.target===dialog&&(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom))dialog.close();
 });
 dialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]')){document.body.classList.remove('modal-open');lastTrigger?.focus();}});
});
$$('[data-product]').forEach(button=>button.addEventListener('click',()=>{
 detailProduct=button.dataset.product;const product=products[detailProduct];
 $('#detail-image').src=product.image;$('#detail-image').alt=`STILL ${product.name} concept perfume`;
 $('#detail-chapter').textContent=product.chapter;$('#product-dialog-title').textContent=product.name;
 $('#detail-description').textContent=product.description;
 ['top','heart','base'].forEach((name,i)=>{$(`#detail-${name}`).textContent=product.notes[i];});
 $('#detail-price').textContent=money(product.price);openDialog($('#product-dialog'),button);
}));
$$('[data-add]').forEach(button=>button.addEventListener('click',()=>addProduct(button.dataset.add)));
$('#detail-add').addEventListener('click',()=>{
 const added=addProduct(detailProduct);
 if(!added){$('#detail-add').textContent='Maximum quantity reached';setTimeout(()=>{$('#detail-add').innerHTML='Add to demo bag <span>+</span>';},1800);return;}
 $('#product-dialog').close();renderBag();openDialog($('#bag-dialog'),$('.bag-trigger'));
});
function renderBag(){
 $('#order-success').hidden=true;$('#order-summary').textContent='';
 $('#bag-items').hidden=false;$('#bag-items').replaceChildren();
 let total=0;
 for(const [id,quantity] of bag){
  const product=products[id];total+=product.price*quantity;
  const row=document.createElement('article');row.className='bag-line';
  row.innerHTML=`<img src="${product.image}" alt="${product.name} concept perfume"><div><h3>${product.name}</h3><p>EAU DE PARFUM · 50 ML</p><div class="quantity-control"><button data-adjust="-1" data-id="${id}" aria-label="Decrease ${product.name} quantity">−</button><span aria-label="Quantity">${quantity}</span><button data-adjust="1" data-id="${id}" aria-label="Increase ${product.name} quantity" ${quantity>=9?'disabled':''}>+</button><button class="remove-item" data-remove="${id}" aria-label="Remove ${product.name}">Remove</button></div></div><span>${money(product.price*quantity)}</span>`;
  $('#bag-items').append(row);
 }
 $('#bag-empty').hidden=bag.size>0;$('#bag-summary').hidden=bag.size===0;$('#bag-total').textContent=money(total);
}
$('.bag-trigger').addEventListener('click',event=>{renderBag();openDialog($('#bag-dialog'),event.currentTarget);});
$('#bag-items').addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button)return;
 if(button.dataset.remove)bag.delete(button.dataset.remove);
 else if(button.dataset.adjust){const id=button.dataset.id;const next=(bag.get(id)||0)+Number(button.dataset.adjust);if(next<=0)bag.delete(id);else bag.set(id,Math.min(next,9));}
 updateBagCount();renderBag();
 const id=button.dataset.id||button.dataset.remove;
 const target=$(`#bag-items button[data-id="${id}"]`)||$('#bag-dialog [data-close]');target?.focus();
});
$('#demo-checkout').addEventListener('click',()=>{
 if(!bag.size)return;
 let total=0;const lines=[];
 for(const [id,quantity] of bag){const p=products[id];total+=p.price*quantity;lines.push(`${quantity} × ${p.name} — ${money(p.price*quantity)}`);}
 $('#order-summary').textContent=lines.join('\n')+`\n\nIllustrative subtotal: ${money(total)}`;
 $('#bag-items').hidden=true;$('#bag-summary').hidden=true;$('#bag-empty').hidden=true;$('#order-success').hidden=false;
 bag.clear();updateBagCount();$('#order-success').focus();
});
$('#keep-exploring').addEventListener('click',()=>$('#bag-dialog').close());
$('#about-demo').addEventListener('click',event=>openDialog($('#demo-info'),event.currentTarget));
$$('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
 const filter=button.dataset.filter;
 $$('[data-filter]').forEach(item=>{const active=item===button;item.classList.toggle('selected',active);item.setAttribute('aria-pressed',String(active));});
 let count=0;
 $$('.product-card').forEach(card=>{card.hidden=filter!=='all'&&card.dataset.family!==filter;if(!card.hidden)count++;});
 $('#product-count').textContent=`${count} ${count===1?'composition':'compositions'}`;
}));
$('#year').textContent=new Date().getFullYear();
