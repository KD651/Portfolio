'use strict';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const config = window.DRM_CONFIG;
const caseStudies = {
 still: {
  title:'STILL', category:'01 / FRAGRANCE · CONCEPT PROJECT',
  intro:'An editorial experience for an imagined fragrance house. The website tells a story before introducing its products.',
  sections:[
   ['The idea','Express three moods—light, nature and night—through one cohesive visual identity.'],
   ['The experience','Scroll-driven backgrounds give way to the brand story, collection and fragrance notes.'],
   ['What you can try','Collection filters, product details, quantities and a shopping bag with a simulated order summary.'],
   ['The build','HTML, CSS and JavaScript. Responsive design, reduced-motion support and AI-generated campaign imagery.']
  ],
  disclaimer:'Fictional brand and products. No real checkout, payment gateway, inventory or shipping. No sales or commercial results are attributed to this project.',
  url:'proyectos/still/index.html'
 },
 mercer: {
  title:'Mercer Barber', category:'02 / BARBERSHOP · CONCEPT PROJECT',
  intro:'A concept for an imagined New York barbershop. A distinctive identity and a structure designed around a local business.',
  sections:[
   ['The idea','Make services, prices and personality clear at a glance, with a dark aesthetic and lime accents.'],
   ['The experience','A journey through services, the gallery, the shop story and opening hours.'],
   ['What you can try','An expandable gallery and a demo booking flow with service, date and time. Options follow the illustrative New York opening hours.'],
   ['The build','HTML, CSS and JavaScript, locally included photography and a mobile-friendly layout. Demo forms without a backend.']
  ],
  disclaimer:'A fictional barbershop with no real premises or clients. Forms do not send messages or book appointments. Unsplash photography is visual inspiration, not work by the brand.',
  url:'proyectos/mercer/index.html'
 }
};
let dialogTrigger;
function showDialog(dialog,trigger){dialogTrigger=trigger;dialog.showModal();document.body.classList.add('modal-open');}
$$('dialog').forEach(dialog=>{
 dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{const rect=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom))dialog.close();});
 dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');dialogTrigger?.focus();});
});
$$('[data-case]').forEach(button=>button.addEventListener('click',()=>{
 const data=caseStudies[button.dataset.case];
 $('#case-title').textContent=data.title;$('#case-category').textContent=data.category;
 $('#case-intro').textContent=data.intro;$('#case-disclaimer').textContent=data.disclaimer;
 $('#case-link').href=data.url;$('#case-sections').replaceChildren();
 data.sections.forEach(([title,body])=>{const section=document.createElement('section');const heading=document.createElement('h3');heading.textContent=title;const paragraph=document.createElement('p');paragraph.textContent=body;section.append(heading,paragraph);$('#case-sections').append(section);});
 showDialog($('#case-dialog'),button);
}));
$('#privacy-trigger').addEventListener('click',event=>showDialog($('#privacy-dialog'),event.currentTarget));
const menuButton=$('.menu-toggle');
function closeMenu(){menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open menu');$('#navigation').classList.remove('is-open');}
menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close menu':'Open menu');$('#navigation').classList.toggle('is-open',open);});
$$('#navigation a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
// Only public contact details belong in config.js. Never put credentials in this file.
const emailLink=$('[data-contact="email"]');
emailLink.href=`mailto:${config.email}`;emailLink.firstChild.textContent=config.email+' ';
const whatsappLink=$('[data-contact="whatsapp"]');
whatsappLink.href=`https://wa.me/${config.whatsapp}`;whatsappLink.firstChild.textContent=`WhatsApp · ${config.whatsappLabel} `;
function makeBrief(values){
 return `Hi ${config.name}, my name is ${values.name}.\n\n${values.business?'My business: '+values.business+'\n':''}I am interested in: ${values.service}.\n\n${values.message}\n\nI found you through the ${config.brand} portfolio.`;
}
const form=$('#brief-form');
form.querySelectorAll('button[type="submit"]').forEach(button=>{button.disabled=false;});
const status=$('#form-status');
const output=document.createElement('div');output.className='message-preview';output.hidden=true;form.append(output);
for(const name of ['name','message'])form.elements[name].addEventListener('input',()=>{form.elements[name].setCustomValidity('');});
form.addEventListener('input',()=>{output.hidden=true;status.hidden=true;});
form.addEventListener('submit',event=>{
 event.preventDefault();
 for(const name of ['name','message']){const field=form.elements[name];if(!field.value.trim()){field.setCustomValidity('Please complete this field to prepare your message.');field.reportValidity();return;}}
 const values={name:form.elements.name.value.trim(),business:form.elements.business.value.trim(),service:form.elements.service.value,message:form.elements.message.value.trim()};
 const message=makeBrief(values);
 const channel=event.submitter?.value==='whatsapp'?'whatsapp':'email';
 const url=channel==='whatsapp'?`https://wa.me/${config.whatsapp}?text=${encodeURIComponent(message)}`:`mailto:${config.email}?subject=${encodeURIComponent('Website project inquiry — '+(values.business||values.name))}&body=${encodeURIComponent(message)}`;
 output.replaceChildren();output.hidden=false;
 const heading=document.createElement('h3');heading.textContent='Your message is ready.';
 const preview=document.createElement('textarea');preview.readOnly=true;preview.rows=7;preview.value=message;preview.setAttribute('aria-label','Message preview');
 const actions=document.createElement('div');actions.className='message-actions';
 const link=document.createElement('a');link.className='button primary';link.href=url;link.textContent=channel==='whatsapp'?'Open WhatsApp ↗':'Open my email app ↗';
 if(channel==='whatsapp'){link.target='_blank';link.rel='noopener noreferrer';}
 const copy=document.createElement('button');copy.type='button';copy.className='underlined';copy.textContent='Copy message';
 copy.addEventListener('click',async()=>{
  try{if(!navigator.clipboard)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(message);status.textContent='Message copied. Paste it into your email or WhatsApp.';}
  catch{preview.focus();preview.select();status.textContent='Text selected. Use Copy on your device to copy it.';}
  status.hidden=false;
 });
 actions.append(link,copy);output.append(heading,preview,actions);
 const note=document.createElement('p');note.textContent='Nothing has been sent. Review the text and open your app to send it.';note.className='form-note';output.append(note);
 status.hidden=true;output.setAttribute('tabindex','-1');output.focus();
});
$('#year').textContent=new Date().getFullYear();
