/**
 * cart.js — Crust & Co. cart manager
 * Runs on every page. Handles add-to-cart buttons, cart page rendering,
 * and checkout summary population.
 */

const CART_KEY = 'cc_cart';
const DELIVERY_FEE = 1200.99;
const TAX_RATE = 0.08;
const FREE_DELIVERY_THRESHOLD = 3000;

function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(id, name, price) {
  const cart = getCart();
  const existing = cart.find(i => i.id == id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, name, price: parseFloat(price), qty: 1 });
  }
  saveCart(cart);
  showToast(`${name} added to cart`);
}

function updateCartBadge() {
  const cart = getCart();
  const total = cart.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = total;
    el.style.display = total > 0 ? 'inline-flex' : 'none';
  });
}

function formatRs(amount) {
  return 'Rs.' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function showToast(msg) {
  let toast = document.getElementById('cc-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cc-toast';
    toast.style.cssText = `
      position:fixed;bottom:32px;right:32px;background:var(--gold, #c9a84c);
      color:#000;padding:12px 22px;border-radius:8px;font-size:0.8rem;
      font-weight:600;z-index:9999;opacity:0;transition:opacity .3s;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}

// ── Add-to-cart buttons ─────────────────────────────────
document.addEventListener('click', e => {
  const btn = e.target.closest('.add-to-cart');
  if (!btn) return;
  addToCart(btn.dataset.id, btn.dataset.name, btn.dataset.price);
});

// ── Cart page rendering ─────────────────────────────────
function renderCartPage() {
  const wrap = document.getElementById('cartItemsWrap');
  if (!wrap) return;

  const cart = getCart();
  const emptyEl = document.getElementById('emptyCart');
  const layoutEl = document.getElementById('cartLayout');

  if (cart.length === 0) {
    emptyEl && (emptyEl.style.display = 'block');
    layoutEl && (layoutEl.style.display = 'none');
    return;
  }
  emptyEl && (emptyEl.style.display = 'none');
  layoutEl && (layoutEl.style.display = 'grid');

  wrap.innerHTML = cart.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <div class="ci-details">
        <div class="ci-name">${item.name}</div>
      </div>
      <div class="ci-qty">
        <button class="qty-btn qty-dec" data-id="${item.id}">−</button>
        <span class="qty-val">${item.qty}</span>
        <button class="qty-btn qty-inc" data-id="${item.id}">+</button>
      </div>
      <div class="ci-price">${formatRs(item.price * item.qty)}</div>
      <button class="ci-remove" data-id="${item.id}">✕</button>
    </div>
  `).join('');

  // Qty & remove buttons
  wrap.querySelectorAll('.qty-dec').forEach(btn => {
    btn.addEventListener('click', () => adjustQty(btn.dataset.id, -1));
  });
  wrap.querySelectorAll('.qty-inc').forEach(btn => {
    btn.addEventListener('click', () => adjustQty(btn.dataset.id, 1));
  });
  wrap.querySelectorAll('.ci-remove').forEach(btn => {
    btn.addEventListener('click', () => removeItem(btn.dataset.id));
  });

  updateSummary(cart, 'csSub', 'csDel', 'csTax', 'csTot', 'cartCountLbl');
}

function adjustQty(id, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id == id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart.splice(cart.indexOf(item), 1);
  saveCart(cart);
  renderCartPage();
}

function removeItem(id) {
  saveCart(getCart().filter(i => i.id != id));
  renderCartPage();
}

// ── Checkout summary ─────────────────────────────────────
function renderCheckoutSummary() {
  const listEl = document.getElementById('checkoutItemsList');
  if (!listEl) return;
  const cart = getCart();
  if (cart.length === 0) return;
  listEl.innerHTML = cart.map(i =>
    `<div style="display:flex;justify-content:space-between;margin-bottom:6px;">
      <span>${i.name} × ${i.qty}</span>
      <span>${formatRs(i.price * i.qty)}</span>
    </div>`
  ).join('');
  updateSummary(cart, 'coSub', 'coDel', 'coTax', 'coTot', null);
}

function updateSummary(cart, subId, delId, taxId, totId, countId) {
  const sub = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const del = sub >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const tax = sub * TAX_RATE;
  const tot = sub + del + tax;

  const $ = id => document.getElementById(id);
  if (subId && $(subId)) $(subId).textContent = formatRs(sub);
  if (delId && $(delId)) $(delId).textContent = del === 0 ? 'Free' : formatRs(del);
  if (taxId && $(taxId)) $(taxId).textContent = formatRs(tax);
  if (totId && $(totId)) $(totId).textContent = formatRs(tot);
  if (countId && $(countId)) $(countId).textContent = cart.reduce((s, i) => s + i.qty, 0) + ' items';
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  renderCartPage();
  renderCheckoutSummary();
});
