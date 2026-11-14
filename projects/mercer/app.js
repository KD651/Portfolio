'use strict';
const services = {
  signature: { name: 'The Signature Cut', price: 55, minutes: 45 },
  fade: { name: 'The Skin Fade', price: 60, minutes: 45 },
  beard: { name: 'The Beard Ritual', price: 35, minutes: 30 },
  full: { name: 'The Full Treatment', price: 80, minutes: 75 }
};
const $ = (selector) => document.querySelector(selector);
const nyDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const fromDate = (value) => new Date(value + 'T12:00:00Z');
const iso = (date) => date.toISOString().slice(0, 10);
const clockLabel = (minutes) => `${Math.floor(minutes / 60) % 12 || 12}:${String(minutes % 60).padStart(2, '0')} ${minutes < 720 ? 'AM' : 'PM'}`;
const dateInput = $('#date');
const serviceInput = $('#service');
const timeInput = $('#time');
const bookingForm = $('#booking-form');
let lastTrigger;
function dateLimits() {
  dateInput.min = nyDate();
  const max = fromDate(dateInput.min);
  max.setUTCDate(max.getUTCDate() + 60);
  dateInput.max = iso(max);
}
function validDate() { return dateInput.value && dateInput.value >= dateInput.min && dateInput.value <= dateInput.max; }
function availableSlots() {
  if (!validDate()) return [];
  const day = fromDate(dateInput.value).getUTCDay();
  if (day === 1) return [];
  const opening = day === 6 ? 540 : 600;
  const closing = day === 0 ? 960 : day === 6 ? 1080 : 1140;
  const parts = new Intl.DateTimeFormat('en-US', {timeZone: 'America/New_York', hourCycle: 'h23', hour: '2-digit', minute: '2-digit'}).formatToParts(new Date());
  const current = Number(parts.find(p => p.type === 'hour').value) * 60 + Number(parts.find(p => p.type === 'minute').value);
  const slots = [];
  for (let time = opening; time + services[serviceInput.value].minutes <= closing; time += 30) {
    if (dateInput.value !== nyDate() || time > current) slots.push(time);
  }
  return slots;
}
function updateSlots() {
  dateLimits();
  const previous = timeInput.value;
  const slots = availableSlots();
  timeInput.replaceChildren(new Option(dateInput.value ? (slots.length ? 'Choose a time' : 'No times on this date') : 'Choose a date first', ''));
  slots.forEach(time => timeInput.add(new Option(clockLabel(time), String(time))));
  if (previous && slots.includes(Number(previous))) timeInput.value = previous;
  dateInput.setCustomValidity('');
  if (validDate() && fromDate(dateInput.value).getUTCDay() === 1) dateInput.setCustomValidity('The demo shop is closed Mondays. Please choose another day.');
  $('#booking-error').textContent = validDate() && !slots.length ? 'No demo times are available. Please select another date.' : '';
}
function updateService() {
  const service = services[serviceInput.value];
  $('#booking-duration').textContent = `${service.minutes} minutes · No payment`;
  $('#booking-price').textContent = `$${service.price}`;
  updateSlots();
}
function openDialog(dialog, trigger) {
  lastTrigger = trigger;
  dialog.showModal();
  document.body.classList.add('modal-open');
}
function resetBooking() {
  bookingForm.reset();
  bookingForm.hidden = false;
  $('#booking-success').hidden = true;
  $('#guest-name').textContent = '';
  $('#reservation-summary').textContent = '';
  updateService();
}
document.querySelectorAll('[data-book]').forEach(button => button.addEventListener('click', () => {
  resetBooking();
  serviceInput.value = services[button.dataset.book] ? button.dataset.book : 'signature';
  updateService();
  openDialog($('#booking'), button);
}));
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const box = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    if (dialog.id === 'booking') resetBooking();
    if (dialog.id === 'contact') { $('#contact-form').reset(); $('#contact-form').hidden = false; $('#contact-success').hidden = true; }
    lastTrigger?.focus();
  });
});
serviceInput.addEventListener('change', updateService);
dateInput.addEventListener('change', updateSlots);
dateInput.addEventListener('input', () => dateInput.setCustomValidity(''));
bookingForm.addEventListener('submit', event => {
  event.preventDefault();
  dateLimits();
  const chosenTime = timeInput.value;
  if (!chosenTime || !availableSlots().includes(Number(chosenTime))) { updateSlots(); $('#booking-error').textContent = 'Please choose an available date and time.'; return; }
  const data = new FormData(bookingForm);
  const name = String(data.get('name')).trim();
  if (!name) { $('#booking-error').textContent = 'Please enter a sample name.'; bookingForm.elements.name.focus(); return; }
  const service = services[serviceInput.value];
  const day = new Intl.DateTimeFormat('en-US', {dateStyle: 'full', timeZone: 'UTC'}).format(fromDate(dateInput.value));
  $('#guest-name').textContent = name;
  $('#reservation-summary').textContent = `${service.name} · ${service.minutes} min · $${service.price}\n${day}\n${clockLabel(Number(chosenTime))} · New York time\nDEMO ONLY — NOT RESERVED`;
  bookingForm.hidden = true;
  $('#booking-success').hidden = false;
  $('#booking-success').focus();
  bookingForm.reset();
});
$('#book-again').addEventListener('click', () => { resetBooking(); serviceInput.focus(); });
document.querySelectorAll('[data-image]').forEach(button => button.addEventListener('click', () => {
  $('#lightbox-image').src = button.dataset.image;
  $('#lightbox-image').alt = button.querySelector('img').alt;
  $('#lightbox-caption').textContent = button.dataset.caption;
  openDialog($('#lightbox'), button);
}));
$('.contact-open').addEventListener('click', event => openDialog($('#contact'), event.currentTarget));
$('#privacy-open').addEventListener('click', event => openDialog($('#privacy'), event.currentTarget));
$('#contact-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  for (const name of ['name', 'message']) {
    const field = form.elements[name];
    if (!field.value.trim()) { field.value = ''; field.reportValidity(); return; }
  }
  form.reset(); form.hidden = true;
  $('#contact-success').hidden = false;
  $('#contact-success').focus();
});
const menu = $('.menu-toggle');
menu.addEventListener('click', () => {
  const expanded = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(expanded));
  $('#navigation').classList.toggle('is-open', expanded);
  menu.querySelector('span').textContent = expanded ? '−' : '+';
});
function closeMenu() { menu.setAttribute('aria-expanded', 'false'); $('#navigation').classList.remove('is-open'); menu.querySelector('span').textContent = '+'; }
$('#navigation').querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
$('#year').textContent = new Date().getFullYear();
dateLimits();
