/* =========================================================
   茶屿 — UI 外壳（路由 / 弹窗 / 提示 / 小票 / 杯贴 / 二维码）
   ========================================================= */
window.UI = (function () {
  'use strict';

  const T = window.I18N;
  const actions = {};
  const inputs = {};
  let view = 'pos';

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function money(sen) {
    const neg = sen < 0;
    const v = Math.abs(Math.round(sen)) / 100;
    return (neg ? '-' : '') + 'RM ' + v.toFixed(2);
  }
  function plain(sen) { return (Math.round(sen) / 100).toFixed(2); }
  function t(key, vars) { return T.t(key, vars); }
  function nm(obj) { return T.n(obj); }

  function hhmm(ts) {
    const d = new Date(ts);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  function elapsed(ts) {
    const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (s < 60) return s + 's';
    return Math.floor(s / 60) + 'm' + String(s % 60).padStart(2, '0');
  }

  /* ---------------- 事件注册 ---------------- */
  function on(name, fn) { actions[name] = fn; }
  function onInput(name, fn) { inputs[name] = fn; }

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const name = el.dataset.act;
    if (actions[name]) { e.preventDefault(); actions[name](el, e); }
    else if (name === 'close-modal') { closeModal(); }
  });
  document.addEventListener('input', e => {
    const el = e.target.closest('[data-input]');
    if (!el) return;
    const name = el.dataset.input;
    if (inputs[name]) inputs[name](el, e);
  });
  document.addEventListener('change', e => {
    const el = e.target.closest('[data-change]');
    if (!el) return;
    const name = el.dataset.change;
    if (inputs[name]) inputs[name](el, e);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Enter') {
      const el = e.target.closest('[data-enter]');
      if (el && actions[el.dataset.enter]) { e.preventDefault(); actions[el.dataset.enter](el, e); }
    }
  });

  /* ---------------- 路由 ---------------- */
  function go(v) {
    view = v;
    ['pos', 'kds', 'admin'].forEach(k => {
      const sec = $('#view-' + k);
      if (sec) sec.classList.toggle('hidden', k !== v);
    });
    $$('#nav .nav-btn').forEach(b => b.classList.toggle('active', b.dataset.nav === v));
    render();
  }
  function currentView() { return view; }

  function render() {
    if (window.ViewPOS && view === 'pos') ViewPOS.render();
    if (window.ViewKDS && view === 'kds') ViewKDS.render();
    if (window.ViewAdmin && view === 'admin') ViewAdmin.render();
    updateBadge();
  }

  function updateBadge() {
    const badge = $('#kds-badge');
    if (!badge) return;
    const n = window.Store.activeOrders().length;
    badge.textContent = n;
    badge.hidden = n === 0;
  }

  /* ---------------- 弹窗 ---------------- */
  function modal(opt) {
    const root = $('#modal-root');
    root.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'overlay';
    wrap.innerHTML =
      '<div class="modal ' + (opt.wide ? 'wide' : '') + ' ' + (opt.narrow ? 'narrow' : '') + '">' +
        '<div class="modal-head">' +
          '<div><h3>' + (opt.title || '') + '</h3>' + (opt.sub ? '<div class="sub">' + opt.sub + '</div>' : '') + '</div>' +
          '<button class="x" data-act="close-modal">×</button>' +
        '</div>' +
        '<div class="modal-body">' + (opt.body || '') + '</div>' +
        (opt.foot ? '<div class="modal-foot">' + opt.foot + '</div>' : '') +
      '</div>';
    wrap.addEventListener('mousedown', e => { if (e.target === wrap && !opt.locked) closeModal(); });
    root.appendChild(wrap);
    root.style.pointerEvents = 'auto';
    if (opt.onMount) opt.onMount(wrap);
    paintQRs(wrap);
    return wrap;
  }
  function closeModal() {
    const root = $('#modal-root');
    if (!root) return;
    root.innerHTML = '';
    root.style.pointerEvents = 'none';
  }
  function modalOpen() { return !!$('#modal-root .modal'); }
  function modalBody() { return $('#modal-root .modal-body'); }

  /* ---------------- 提示 ---------------- */
  function toast(msg, kind) {
    const root = $('#toast-root');
    const el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    el.textContent = msg;
    root.appendChild(el);
    setTimeout(() => { el.style.transition = 'opacity .25s'; el.style.opacity = '0'; }, 2200);
    setTimeout(() => el.remove(), 2500);
  }

  /* ---------------- 叫号 ---------------- */
  let callTimer = null;
  function beep() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      [880, 1180].forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
        g.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + i * 0.18 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.32);
        o.connect(g); g.connect(ctx.destination);
        o.start(ctx.currentTime + i * 0.18);
        o.stop(ctx.currentTime + i * 0.18 + 0.34);
      });
      setTimeout(() => ctx.close(), 1200);
    } catch (e) { /* 静默 */ }
  }
  function callout(orderNo, sub) {
    const el = $('#callout');
    el.innerHTML =
      '<div class="callout-inner">' +
        '<div class="lbl">' + esc(t('kds.readyHint')) + '</div>' +
        '<div class="no">' + esc(orderNo) + '</div>' +
        '<div class="sub">' + esc(sub || '') + '</div>' +
        '<div class="cls">' + esc(t('kds.call')) + ' · 3s</div>' +
      '</div>';
    el.classList.remove('hidden');
    beep();
    clearTimeout(callTimer);
    callTimer = setTimeout(() => el.classList.add('hidden'), 3200);
    el.onclick = () => { el.classList.add('hidden'); clearTimeout(callTimer); };
  }

  /* ---------------- 伪二维码（演示用，非真实支付码） ---------------- */
  function hash32(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function drawQR(canvas, text) {
    const N = 29, Q = 4, total = N + Q * 2;
    const px = Math.max(72, canvas.clientWidth || 196);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = px * dpr; canvas.height = px * dpr;
    const ctx = canvas.getContext('2d');
    const cell = canvas.width / total;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);

    const m = [];
    for (let y = 0; y < N; y++) { m.push(new Array(N).fill(0)); }
    let seed = hash32(text);
    const rnd = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; };
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) m[y][x] = rnd() < 0.47 ? 1 : 0;

    const clear = (x0, y0, w, h) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (m[y] && m[y][x] !== undefined) m[y][x] = 0; };
    const finder = (x0, y0) => {
      clear(x0 - 1, y0 - 1, 9, 9);
      for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
        const edge = x === 0 || y === 0 || x === 6 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        m[y0 + y][x0 + x] = (edge || core) ? 1 : 0;
      }
    };
    finder(0, 0); finder(N - 7, 0); finder(0, N - 7);
    // 定位校正块
    clear(N - 9, N - 9, 9, 9);
    for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
      const edge = x === 0 || y === 0 || x === 4 || y === 4;
      m[N - 5 + y][N - 5 + x] = (edge || (x === 2 && y === 2)) ? 1 : 0;
    }
    // 时序线
    for (let i = 8; i < N - 8; i++) { m[6][i] = i % 2 === 0 ? 1 : 0; m[i][6] = i % 2 === 0 ? 1 : 0; }

    ctx.fillStyle = '#12100e';
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (m[y][x]) ctx.fillRect((x + Q) * cell, (y + Q) * cell, cell + 0.4, cell + 0.4);
    }
  }
  function paintQRs(root) {
    $$('canvas[data-qr]', root || document).forEach(c => {
      if (c.dataset.painted === '1') return;
      drawQR(c, c.dataset.qr);
      c.dataset.painted = '1';
    });
  }

  /* ---------------- 小票 ---------------- */
  function receiptHtml(order) {
    const raddr = Store.db.store.addrZh;
    const st = Store.db.store;
    const rows = [];
    // 订单按「杯」拆行，小票按相同客制化合并显示
    const grouped = [];
    order.items.forEach(it => {
      const key = [it.pid, it.size, it.sugar, it.ice, (it.toppings || []).map(x => x.id).join(','), it.note || ''].join('|');
      const hit = grouped.find(g => g.key === key);
      if (hit) hit.qty += it.qty;
      else grouped.push({ key, it, qty: it.qty });
    });
    grouped.forEach(({ it, qty }) => {
      const spec = [it.sizeZh, it.sugarZh, it.iceZh].join(' / ');
      const tps = (it.toppings || []).map(x => '+' + x.nameZh).join(' ');
      rows.push(
        '<div class="rc-item">' +
          '<div class="rc-row"><div class="l"><span class="nm">' + qty + '× ' + esc(it.nameZh) + '</span></div>' +
          '<div class="r">' + plain(it.unitPriceSen * qty) + '</div></div>' +
          '<div class="sp">' + esc(it.nameEn) + '</div>' +
          '<div class="sp">' + esc(spec) + (tps ? ' ' + esc(tps) : '') + '</div>' +
          (it.note ? '<div class="sp">* ' + esc(it.note) + '</div>' : '') +
        '</div>'
      );
    });

    const payLines = order.payments.map(p => {
      if (p.method === 'cash') {
        return '<div class="rc-row"><span>现金 CASH</span><span>' + plain(p.tenderedSen || p.amountSen) + '</span></div>' +
               (p.changeSen ? '<div class="rc-row"><span>找零 CHANGE</span><span>' + plain(p.changeSen) + '</span></div>' : '');
      }
      if (p.method === 'duitnow') return '<div class="rc-row"><span>DuitNow QR</span><span>' + plain(p.amountSen) + '</span></div>';
      if (p.method === 'balance') return '<div class="rc-row"><span>储值 STORE CREDIT</span><span>' + plain(p.amountSen) + '</span></div>';
      return '<div class="rc-row"><span>免单 COMP</span><span>0.00</span></div>';
    }).join('');

    return '<div class="receipt" id="receipt-doc">' +
      '<div class="rc-center">' +
        '<div class="rc-brand">' + esc(st.nameZh) + '</div>' +
        '<div class="rc-small">' + esc(st.nameEn) + '</div>' +
        '<div class="rc-small">' + esc(raddr) + '</div>' +
        '<div class="rc-small">Tel ' + esc(st.phone) + '</div>' +
        '<div class="rc-small">' + esc(t('rc.sstNo')) + ' ' + esc(st.sstNo) + '</div>' +
      '</div>' +
      '<div class="rc-hr"></div>' +
      '<div class="rc-row"><span>单号 NO. <b>' + esc(order.no) + '</b></span><span>' + hhmm(order.paidAt) + '</span></div>' +
      '<div class="rc-row"><span>收银 CASHIER S1</span><span>' + (order.pickupType === 'dinein' ? '堂食 DINE-IN' : '外带 TAKEAWAY') + '</span></div>' +
      (order.memberLabel ? '<div class="rc-row"><span>会员 MEMBER</span><span>' + esc(order.memberLabel) + '</span></div>' : '') +
      '<div class="rc-hr"></div>' +
      rows.join('') +
      '<div class="rc-hr"></div>' +
      '<div class="rc-row"><span>小计 SUBTOTAL</span><span>' + plain(order.subtotalSen) + '</span></div>' +
      (order.discountSen ? '<div class="rc-row"><span>折扣 DISCOUNT</span><span>-' + plain(order.discountSen) + '</span></div>' : '') +
      (order.couponSen ? '<div class="rc-row"><span>优惠券 ' + esc(order.couponCode || '') + '</span><span>-' + plain(order.couponSen) + '</span></div>' : '') +
      (order.pointsSen ? '<div class="rc-row"><span>积分 POINTS</span><span>-' + plain(order.pointsSen) + '</span></div>' : '') +
      '<div class="rc-row rc-total"><span>合计 TOTAL</span><span>' + plain(order.totalSen) + '</span></div>' +
      '<div class="rc-row rc-small"><span>其中 SST 6%</span><span>' + plain(order.taxSen) + '</span></div>' +
      '<div class="rc-hr"></div>' +
      payLines +
      (order.pointsEarned ? '<div class="rc-row"><span>本单积分 POINTS EARNED</span><span>+' + order.pointsEarned + '</span></div>' : '') +
      '<div class="rc-hr"></div>' +
      '<div class="rc-center">谢谢惠顾，欢迎再来</div>' +
      '<div class="rc-center rc-small">Thank you, please come again</div>' +
      '<div class="rc-barcode">' + esc(order.fullNo) + '</div>' +
    '</div>';
  }

  /* ---------------- 杯贴 ---------------- */
  function labelHtml(order) {
    const n = order.items.length;
    return '<div class="label-sheet">' + order.items.map((it, idx) => {
      const spec = [it.sizeZh, it.sugarZh, it.iceZh].join(' · ');
      const tps = (it.toppings || []).map(x => '+' + x.nameZh).join('  ');
      return '<div class="cup-label">' +
        '<div class="cl-head"><div class="cl-no">' + esc(order.no) + '</div>' +
        '<div class="cl-seq">' + (idx + 1) + '/' + n + '</div></div>' +
        '<div class="cl-prod">' + esc(it.nameZh) + '</div>' +
        '<div class="cl-prod-en">' + esc(it.nameEn) + '</div>' +
        '<div class="cl-spec">' + esc(spec) + '</div>' +
        (tps ? '<div class="cl-top">' + esc(tps) + '</div>' : '') +
        (it.note ? '<div class="cl-note">备注：' + esc(it.note) + '</div>' : '') +
        '<div class="cl-bottom">' +
          '<div class="cl-qr"><canvas data-qr="' + esc(order.fullNo + '-' + (idx + 1)) + '"></canvas></div>' +
          '<div class="cl-time">' + hhmm(order.paidAt) + '<br>' + esc(order.fullNo.split('-')[1] || '') + '</div>' +
        '</div>' +
      '</div>';
    }).join('') + '</div>';
  }

  function printHtml(html) {
    const area = $('#print-area');
    area.innerHTML = html;
    paintQRs(area);
    setTimeout(() => {
      window.print();
      setTimeout(() => { area.innerHTML = ''; }, 600);
    }, 120);
  }

  /* ---------------- 语言 ---------------- */
  function applyI18n() {
    $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    const btn = $('#lang-btn');
    if (btn) btn.textContent = T.lang === 'zh' ? 'EN' : '中';
    document.documentElement.lang = T.lang === 'zh' ? 'zh-CN' : 'en';
  }

  /* ---------------- 时钟 ---------------- */
  function tickClock() {
    const d = new Date();
    const c = $('#clock'), td = $('#today');
    if (c) c.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    if (td) {
      if (T.lang === 'en') {
        td.textContent = new Intl.DateTimeFormat('en-GB', { month: 'short', day: 'numeric' }).format(d);
      } else {
        const wd = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
        td.textContent = (d.getMonth() + 1) + '月' + d.getDate() + '日 周' + wd;
      }
    }
  }

  return {
    on, onInput, modal, closeModal, modalOpen, modalBody, toast, go, render, currentView,
    callout, beep, money, plain, t, nm, esc, hhmm, elapsed,
    receiptHtml, labelHtml, printHtml, paintQRs, drawQR,
    applyI18n, tickClock, updateBadge,
    get view() { return view; }
  };
})();
