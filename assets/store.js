/* =========================================================
   茶屿 — 领域逻辑（状态 / 计价 / 库存 / 会员 / 报表）
   金额单位：分（整数）；原料单位成本：小数
   ========================================================= */
window.Store = (function () {
  'use strict';

  const S = window.SEED;
  const KEY = 'chayu.pos.v2';
  const T = window.I18N;
  let db = null;
  let storageOK = true;

  /* ---------------- 工具 ---------------- */
  const clone = o => JSON.parse(JSON.stringify(o));
  const now = () => Date.now();
  const pad3 = n => String(n).padStart(3, '0');
  const r3 = n => Math.round(n * 1000) / 1000;

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ---------------- 初始化 ---------------- */
  function fresh() {
    return {
      v: 2,
      store: clone(S.store),
      settings: clone(S.settings),
      ingredients: clone(S.ingredients),
      products: clone(S.products),
      optionGroups: clone(S.optionGroups),
      tiers: clone(S.tiers),
      members: clone(S.members),
      coupons: clone(S.coupons),
      orders: [],
      moves: [],
      waste: [],
      audit: [],
      counters: { call: 0 },
      cart: [],
      checkout: { memberId: null, couponId: null, points: 0, discount: null, pickupType: 'takeaway' },
      lang: 'zh'
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.v === 2 && Array.isArray(parsed.products)) { db = parsed; return; }
      }
    } catch (e) { storageOK = false; }
    db = fresh();
    seedHistory();
    save();
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); }
    catch (e) { storageOK = false; }
  }

  function reset() {
    db = fresh();
    seedHistory();
    save();
  }

  /* ---------------- 查询 ---------------- */
  const product = id => db.products.find(p => p.id === id);
  const ingredient = id => db.ingredients.find(i => i.id === id);
  const group = id => db.optionGroups.find(g => g.id === id);
  const option = (gid, oid) => {
    const g = group(gid);
    return g ? g.options.find(o => o.id === oid) : null;
  };
  const tier = id => db.tiers.find(t => t.id === id) || db.tiers[0];
  const member = id => db.members.find(m => m.id === id);
  const orderById = id => db.orders.find(o => o.id === id);
  const couponById = id => db.coupons.find(c => c.id === id);

  function tierOf(m) { return tier(m ? m.tierId : 't0'); }

  function recomputeTier(m) {
    let best = db.tiers[0];
    db.tiers.forEach(t => { if (m.totalSpentSen >= t.minSpentSen) best = t; });
    m.tierId = best.id;
    return best;
  }

  /* ---------------- 手机号 ---------------- */
  function normalizePhone(raw) {
    let d = String(raw || '').replace(/\D/g, '');
    if (d.startsWith('60')) d = d.slice(2);
    else if (d.startsWith('0')) d = d.slice(1);
    return '+60' + d;
  }
  function phoneDigits(p) { return String(p || '').replace('+60', ''); }
  function formatPhone(p) {
    const d = phoneDigits(p);
    if (d.length < 6) return p;
    return '0' + d.slice(0, 2) + '-' + d.slice(2, 5) + ' ' + d.slice(5);
  }
  function maskPhone(p) {
    const d = phoneDigits(p);
    if (d.length < 6) return p;
    return '0' + d.slice(0, 2) + '-*** ' + d.slice(-4);
  }
  function memberLabel(m) {
    if (!m) return '';
    return m.name && m.name.trim() ? m.name : '尾号 ' + phoneDigits(m.phone).slice(-4);
  }

  function searchMembers(q) {
    const raw = String(q || '').trim();
    if (!raw) return [];
    const digits = raw.replace(/\D/g, '');
    const norm = digits.length >= 8 ? normalizePhone(digits) : '';
    return db.members.filter(m =>
      (norm && m.phone === norm) ||
      (digits.length >= 3 && m.phone.endsWith(digits)) ||
      (raw.length >= 1 && m.name && m.name.toLowerCase().includes(raw.toLowerCase()))
    ).slice(0, 6);
  }

  function registerMember(rawPhone, name) {
    const phone = normalizePhone(rawPhone);
    if (phoneDigits(phone).length < 8) return { ok: false, msg: 'invalid' };
    const exist = db.members.find(m => m.phone === phone);
    if (exist) return { ok: true, member: exist, existed: true };
    const seq = db.members.length + 1;
    const m = {
      id: 'M' + pad3(seq),
      name: (name || '').trim(),
      phone,
      tierId: 't0',
      points: 0,
      balanceSen: 0,
      totalSpentSen: 0,
      joinedAt: new Date().toISOString().slice(0, 10)
    };
    db.members.push(m);
    audit('member', '新会员注册 ' + maskPhone(phone));
    save();
    return { ok: true, member: m, existed: false };
  }

  /* ---------------- 行项目计算 ---------------- */
  function calcLine(pid, sel) {
    const p = product(pid);
    if (!p) return null;
    const size = option('size', sel.size) || group('size').options[0];
    const sugar = option('sugar', sel.sugar) || group('sugar').options[2];
    const ice = option('ice', sel.ice) || group('ice').options[0];
    const toppings = (sel.toppings || []).map(id => option('topping', id)).filter(Boolean);

    const unitPriceSen = p.priceSen + (size.priceSen || 0) + toppings.reduce((s, t) => s + (t.priceSen || 0), 0);

    const scale = size.id === 'sz_l' ? db.settings.largeScale : 1;
    const usage = {};
    const put = (id, q) => { usage[id] = r3((usage[id] || 0) + q); };

    p.recipe.forEach(r => put(r.id, r.scale === false ? r.qty : r3(r.qty * scale)));
    put(size.id === 'sz_l' ? 'cup_l' : 'cup_m', 1);
    put('lid', 1); put('straw', 1); put('label', 1);
    toppings.forEach(t => { if (t.use) Object.keys(t.use).forEach(k => put(k, t.use[k])); });

    let cogsSen = 0;
    Object.keys(usage).forEach(id => {
      const ing = ingredient(id);
      if (ing) cogsSen += usage[id] * ing.cost * 100;
    });

    return {
      pid, product: p,
      size, sugar, ice, toppings,
      unitPriceSen,
      cogsSen: Math.round(cogsSen),
      usage
    };
  }

  function specText(sel, lang) {
    const isEn = lang === 'en';
    const parts = [
      isEn ? sel.size.nameEn : sel.size.nameZh,
      isEn ? sel.sugar.nameEn : sel.sugar.nameZh,
      isEn ? sel.ice.nameEn : sel.ice.nameZh
    ];
    const tp = (sel.toppings || []).map(t => '+' + (isEn ? t.nameEn : t.nameZh));
    return parts.join(' · ') + (tp.length ? '  ' + tp.join(' ') : '');
  }

  /* ---------------- 购物车 ---------------- */
  function sigOf(pid, sel, note) {
    return [pid, sel.size, sel.sugar, sel.ice, (sel.toppings || []).slice().sort().join(','), (note || '').trim()].join('|');
  }

  function addToCart(pid, sel, qty, note) {
    const sig = sigOf(pid, sel, note);
    const exist = db.cart.find(c => c.sig === sig);
    if (exist) exist.qty += qty;
    else db.cart.push({ uid: 'c' + now().toString(36) + Math.random().toString(36).slice(2, 5), sig, pid, sel: clone(sel), qty, note: note || '' });
    save();
  }

  function updateQty(uid, delta) {
    const it = db.cart.find(c => c.uid === uid);
    if (!it) return;
    it.qty += delta;
    if (it.qty <= 0) db.cart = db.cart.filter(c => c.uid !== uid);
    save();
  }

  function setQty(uid, qty) {
    const it = db.cart.find(c => c.uid === uid);
    if (!it) return;
    it.qty = Math.max(1, qty);
    save();
  }

  function removeLine(uid) {
    db.cart = db.cart.filter(c => c.uid !== uid);
    if (db.cart.length === 0) db.checkout = { memberId: db.checkout.memberId, couponId: null, points: 0, discount: null, pickupType: db.checkout.pickupType };
    save();
  }

  function replaceLine(uid, pid, sel, qty, note) {
    const idx = db.cart.findIndex(c => c.uid === uid);
    if (idx < 0) return;
    db.cart[idx] = { uid, sig: sigOf(pid, sel, note), pid, sel: clone(sel), qty, note: note || '' };
    save();
  }

  function clearCart() {
    db.cart = [];
    db.checkout = { memberId: null, couponId: null, points: 0, discount: null, pickupType: db.checkout.pickupType };
    save();
  }

  function cartLines() {
    return db.cart.map(entry => {
      const c = calcLine(entry.pid, entry.sel);
      if (!c) return null;
      return Object.assign(c, {
        uid: entry.uid,
        qty: entry.qty,
        note: entry.note,
        nameZh: c.product.nameZh,
        nameEn: c.product.nameEn,
        emoji: c.product.emoji,
        lineTotalSen: c.unitPriceSen * entry.qty,
        lineCogsSen: c.cogsSen * entry.qty
      });
    }).filter(Boolean);
  }

  /* ---------------- 计价 ---------------- */
  function computeTotals(lines, opt) {
    opt = opt || {};
    const subtotalSen = lines.reduce((s, l) => s + l.unitPriceSen * l.qty, 0);

    let discountSen = 0, discountMeta = null;
    if (opt.discount) {
      const d = opt.discount;
      discountSen = d.type === 'free' ? subtotalSen
        : d.type === 'percent' ? Math.round(subtotalSen * d.value / 100)
        : d.valueSen;
      discountSen = Math.max(0, Math.min(discountSen, subtotalSen));
      discountMeta = d;
    }

    let couponSen = 0, coupon = null;
    if (opt.couponId) {
      coupon = couponById(opt.couponId);
      if (coupon && !coupon.used && subtotalSen >= coupon.minSpendSen) {
        couponSen = coupon.type === 'percent'
          ? Math.round(subtotalSen * coupon.value / 100)
          : coupon.value * 100;
        if (coupon.maxDiscountSen) couponSen = Math.min(couponSen, coupon.maxDiscountSen);
        couponSen = Math.min(couponSen, subtotalSen - discountSen);
      }
    }

    let pointsUsed = 0, pointsSen = 0;
    const m = member(opt.memberId);
    if (m && opt.points > 0) {
      const cap = Math.round((subtotalSen - discountSen - couponSen) * db.settings.maxRedeemRatio);
      pointsUsed = Math.min(opt.points, m.points, Math.floor(cap / db.settings.pointValueSen));
      pointsUsed = Math.max(0, pointsUsed);
      pointsSen = pointsUsed * db.settings.pointValueSen;
    }

    const totalSen = Math.max(0, subtotalSen - discountSen - couponSen - pointsSen);
    const rate = db.store.taxRate;
    // 标价含税：先算不含税，再用减法得税额（避免双重四舍五入）
    const baseSen = Math.round(totalSen / (1 + rate));
    const taxSen = totalSen - baseSen;
    const cogsSen = lines.reduce((s, l) => s + l.cogsSen * l.qty, 0);

    return {
      subtotalSen, discountSen, discountMeta,
      couponSen, coupon, couponId: opt.couponId || null,
      pointsUsed, pointsSen,
      totalSen, baseSen, taxSen,
      cogsSen: Math.round(cogsSen),
      savedSen: discountSen + couponSen + pointsSen
    };
  }

  function totals() {
    const ck = db.checkout;
    return computeTotals(cartLines(), {
      discount: ck.discount,
      couponId: ck.couponId,
      points: ck.points,
      memberId: ck.memberId
    });
  }

  /* ---------------- 结算 ---------------- */
  function nextNo() {
    db.counters.call += 1;
    return 'A' + pad3(db.counters.call);
  }

  function audit(type, text, amountSen) {
    db.audit.unshift({ id: 'a' + now().toString(36) + Math.random().toString(36).slice(2, 4), at: now(), type, text, amountSen: amountSen || 0 });
    if (db.audit.length > 300) db.audit.length = 300;
  }

  function applyStock(items, sign, reason, ref) {
    items.forEach(it => {
      Object.keys(it.usage).forEach(id => {
        const ing = ingredient(id);
        if (!ing) return;
        const q = it.usage[id] * it.qty * sign;
        ing.stock = r3(ing.stock + q);
        if (sign < 0) ing.stock = Math.max(0, ing.stock);
        db.moves.unshift({ id: 'm' + now().toString(36) + Math.random().toString(36).slice(2, 4), at: now(), ingId: id, qty: q, reason, ref });
      });
    });
    if (db.moves.length > 800) db.moves.length = 800;
  }

  function pay(method, tenderedSen, extra) {
    const lines = cartLines();
    if (!lines.length) return { ok: false, code: 'empty' };
    const t = totals();
    const ck = db.checkout;
    const m = member(ck.memberId);

    if (method === 'balance') {
      if (!m) return { ok: false, code: 'no_member' };
      if (m.balanceSen < t.totalSen) return { ok: false, code: 'insufficient_balance' };
    }
    if (method === 'cash' && t.totalSen > 0 && tenderedSen < t.totalSen) {
      return { ok: false, code: 'insufficient_cash' };
    }

    const ts = now();
    const no = nextNo();
    const tierInfo = m ? tierOf(m) : null;

    const items = [];
    lines.forEach(l => {
      // 每杯一个工单行：杯贴、制作勾选、退单都以「杯」为单位
      for (let n = 0; n < l.qty; n++) {
        items.push({
          seq: items.length + 1,
          pid: l.pid,
          nameZh: l.nameZh, nameEn: l.nameEn, emoji: l.emoji,
          size: l.size.id, sugar: l.sugar.id, ice: l.ice.id,
          sizeZh: l.size.nameZh, sizeEn: l.size.nameEn,
          sugarZh: l.sugar.nameZh, sugarEn: l.sugar.nameEn,
          iceZh: l.ice.nameZh, iceEn: l.ice.nameEn,
          toppings: l.toppings.map(x => ({ id: x.id, nameZh: x.nameZh, nameEn: x.nameEn, priceSen: x.priceSen })),
          note: l.note,
          qty: 1,
          unitPriceSen: l.unitPriceSen,
          cogsSen: l.cogsSen,
          usage: l.usage,
          status: 'queued',
          doneAt: null,
          labelPrintedAt: null
        });
      }
    });

    const pointsEarned = m ? Math.floor((t.totalSen / 100) * db.settings.pointsPerRinggit * tierInfo.pointsRate) : 0;

    const payments = [];
    if (method === 'cash') {
      const change = Math.max(0, tenderedSen - t.totalSen);
      payments.push({ method: 'cash', amountSen: t.totalSen, tenderedSen, changeSen: change, at: ts });
    } else if (method === 'duitnow') {
      payments.push({ method: 'duitnow', amountSen: t.totalSen, ref: (extra && extra.ref) || ('DNQ' + ts.toString().slice(-8)), at: ts });
    } else if (method === 'balance') {
      payments.push({ method: 'balance', amountSen: t.totalSen, ref: 'WALLET', at: ts });
    } else {
      payments.push({ method: 'comp', amountSen: 0, ref: 'COMP', at: ts });
    }

    const order = {
      id: 'o' + ts.toString(36) + Math.random().toString(36).slice(2, 5),
      no,
      fullNo: 'S1-' + new Date(ts).toISOString().slice(0, 10).replace(/-/g, '') + '-' + no,
      storeId: 'S1',
      channel: 'walkin',
      pickupType: ck.pickupType,
      items,
      memberId: m ? m.id : null,
      memberLabel: m ? memberLabel(m) : '',
      tierName: tierInfo ? tierInfo.nameZh : '',
      subtotalSen: t.subtotalSen,
      discountSen: t.discountSen,
      discountMeta: t.discountMeta,
      couponId: t.couponId,
      couponCode: t.coupon ? t.coupon.code : null,
      couponSen: t.couponSen,
      pointsUsed: t.pointsUsed,
      pointsSen: t.pointsSen,
      totalSen: t.totalSen,
      baseSen: t.baseSen,
      taxSen: t.taxSen,
      cogsSen: t.cogsSen,
      savedSen: t.savedSen,
      payments,
      paymentStatus: method === 'comp' ? 'comp' : 'paid',
      status: 'paid',
      pointsEarned,
      createdAt: ts,
      paidAt: ts,
      claimedAt: null,
      readyAt: null,
      calledAt: null,
      completedAt: null,
      voidedAt: null,
      callCount: 0,
      seed: false
    };

    // 库存扣减（收款即扣）
    applyStock(items, -1, 'sale', order.id);

    // 会员：积分 / 储值 / 累计消费 / 等级
    if (m) {
      m.points = Math.max(0, m.points - t.pointsUsed + pointsEarned);
      if (method === 'balance') m.balanceSen -= t.totalSen;
      m.totalSpentSen += t.baseSen;
      const before = m.tierId;
      recomputeTier(m);
      if (before !== m.tierId) audit('member', memberLabel(m) + ' 升级为 ' + tier(m.tierId).nameZh);
    }
    // 券核销
    if (t.coupon) { const c = couponById(t.coupon.id); if (c) c.used = true; }

    if (t.discountSen > 0) {
      const label = t.discountMeta
        ? (t.discountMeta.type === 'free' ? '免单' : (t.discountMeta.type === 'percent' ? t.discountMeta.value + '% 折扣' : '立减')) + ' · ' + (t.discountMeta.reason || '')
        : '折扣';
      audit(t.discountMeta && t.discountMeta.type === 'free' ? 'comp' : 'discount', label + ' ' + order.no, t.discountSen);
    }
    if (t.couponSen > 0) audit('coupon', '券 ' + (t.coupon ? t.coupon.code : '') + ' ' + order.no, t.couponSen);

    db.orders.unshift(order);
    db.cart = [];
    db.checkout = { memberId: null, couponId: null, points: 0, discount: null, pickupType: ck.pickupType };
    save();
    return { ok: true, order };
  }

  /* ---------------- 制作看板 ---------------- */
  const isActive = o => ['paid', 'preparing', 'ready'].includes(o.status);

  function activeOrders() {
    return db.orders.filter(isActive).sort((a, b) => a.paidAt - b.paidAt);
  }
  function waitingOrders() { return activeOrders().filter(o => o.status === 'paid'); }
  function makingOrders() { return activeOrders().filter(o => o.status === 'preparing'); }
  function readyOrders() { return activeOrders().filter(o => o.status === 'ready'); }

  function claim(orderId) {
    const o = orderById(orderId);
    if (!o || o.status !== 'paid') return { ok: false };
    o.status = 'preparing';
    o.claimedAt = now();
    if (db.settings.labelPrintOn === 'claim') {
      o.items.forEach(i => { i.labelPrintedAt = now(); });
    }
    save();
    return { ok: true, order: o };
  }

  function toggleCup(orderId, seq) {
    const o = orderById(orderId);
    if (!o || o.status !== 'preparing') return { ok: false };
    const it = o.items.find(i => i.seq === seq);
    if (!it) return { ok: false };
    if (it.status === 'done') { it.status = 'queued'; it.doneAt = null; }
    else { it.status = 'done'; it.doneAt = now(); }
    save();
    return { ok: true, order: o, item: it };
  }

  function finish(orderId) {
    const o = orderById(orderId);
    if (!o || o.status !== 'preparing') return { ok: false };
    const leftCups = o.items.filter(i => i.status !== 'done').reduce((a, i) => a + i.qty, 0);
    if (leftCups) return { ok: false, code: 'missing', count: leftCups };
    o.status = 'ready';
    o.readyAt = now();
    o.calledAt = now();
    o.callCount = (o.callCount || 0) + 1;
    save();
    return { ok: true, order: o };
  }

  function callAgain(orderId) {
    const o = orderById(orderId);
    if (!o) return null;
    o.calledAt = now();
    o.callCount = (o.callCount || 0) + 1;
    save();
    return o;
  }

  function pickup(orderId) {
    const o = orderById(orderId);
    if (!o) return null;
    o.status = 'completed';
    o.completedAt = now();
    o.items.forEach(i => { if (i.status !== 'done') { i.status = 'done'; i.doneAt = now(); } });
    save();
    return o;
  }

  function reprintLabels(orderId) {
    const o = orderById(orderId);
    if (!o) return null;
    o.items.forEach(i => { i.labelPrintedAt = now(); });
    audit('print', '重打杯贴 ' + o.no);
    save();
    return o;
  }

  /* ---------------- 后台操作 ---------------- */
  function voidOrder(orderId, reason) {
    const o = orderById(orderId);
    if (!o || o.status === 'void') return { ok: false };
    if (o.status === 'completed') return { ok: false, code: 'completed' };
    applyStock(o.items, +1, 'void', o.id);
    const m = member(o.memberId);
    if (m) {
      m.points = Math.max(0, m.points - o.pointsEarned + o.pointsUsed);
      m.totalSpentSen = Math.max(0, m.totalSpentSen - o.baseSen);
      recomputeTier(m);
      if (o.payments.some(p => p.method === 'balance')) m.balanceSen += o.totalSen;
    }
    o.status = 'void';
    o.voidedAt = now();
    o.voidReason = reason || '';
    audit('void', '退单 ' + o.no + (reason ? ' · ' + reason : ''), -o.totalSen);
    save();
    return { ok: true, order: o };
  }

  function logWaste(ingId, qty, reason) {
    const ing = ingredient(ingId);
    if (!ing || !(qty > 0)) return { ok: false };
    ing.stock = Math.max(0, r3(ing.stock - qty));
    db.waste.unshift({ id: 'w' + now().toString(36), at: now(), ingId, qty, reason: reason || '' });
    db.moves.unshift({ id: 'm' + now().toString(36), at: now(), ingId, qty: -qty, reason: 'waste', ref: '' });
    audit('waste', '损耗 ' + ing.nameZh + ' ' + qty + ing.unit + (reason ? ' · ' + reason : ''));
    save();
    return { ok: true };
  }

  function topup(memberId, amountSen, bonusSen) {
    const m = member(memberId);
    if (!m || !(amountSen > 0)) return { ok: false };
    const total = amountSen + (bonusSen || 0);
    m.balanceSen += total;
    audit('topup', '充值 ' + memberLabel(m) + ' ' + (amountSen / 100).toFixed(2) + (bonusSen ? ' (送 ' + (bonusSen / 100).toFixed(2) + ')' : ''), total);
    save();
    return { ok: true, member: m, total };
  }

  /* ---------------- 报表 ---------------- */
  const dayKey = ts => {
    const d = new Date(ts);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  const todayKey = () => dayKey(now());
  const startOfDay = (ts) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };

  function ordersIn(fromTs, toTs) {
    return db.orders.filter(o => o.status !== 'void' && o.paidAt >= fromTs && o.paidAt < toTs);
  }

  function stats(fromTs, toTs) {
    const os = ordersIn(fromTs, toTs);
    const r = {
      orders: os.length, cups: 0,
      revenueSen: 0, netSen: 0, taxSen: 0, cogsSen: 0,
      discountSen: 0, compCount: 0, voidCount: 0,
      memberSen: 0, memberOrders: 0,
      cashSen: 0, duitnowSen: 0, balanceSen: 0
    };
    os.forEach(o => {
      r.revenueSen += o.totalSen;
      r.netSen += o.baseSen;
      r.taxSen += o.taxSen;
      r.cogsSen += o.cogsSen;
      r.discountSen += (o.discountSen + o.couponSen + o.pointsSen);
      o.items.forEach(i => { r.cups += i.qty; });
      if (o.payments.some(p => p.method === 'comp') || o.totalSen === 0) r.compCount++;
      if (o.memberId) { r.memberOrders++; r.memberSen += o.totalSen; }
      o.payments.forEach(p => {
        if (p.method === 'cash') r.cashSen += p.amountSen;
        else if (p.method === 'duitnow') r.duitnowSen += p.amountSen;
        else if (p.method === 'balance') r.balanceSen += p.amountSen;
      });
    });
    r.grossSen = r.netSen - r.cogsSen;
    r.margin = r.netSen > 0 ? r.grossSen / r.netSen : 0;
    r.avgTicketSen = r.orders ? Math.round(r.revenueSen / r.orders) : 0;
    r.voidCount = db.orders.filter(o => o.status === 'void' && o.voidedAt >= fromTs && o.voidedAt < toTs).length;
    return r;
  }

  function todayStats() { const s = startOfDay(now()); return stats(s, s + 86400000); }

  function series(days) {
    const out = [];
    const base = startOfDay(now());
    for (let i = days - 1; i >= 0; i--) {
      const from = base - i * 86400000;
      const st = stats(from, from + 86400000);
      out.push({ key: dayKey(from), date: new Date(from), revenueSen: st.revenueSen, orders: st.orders });
    }
    return out;
  }

  function topProducts(fromTs, toTs, limit) {
    const map = {};
    ordersIn(fromTs, toTs).forEach(o => {
      o.items.forEach(it => {
        if (!map[it.pid]) map[it.pid] = { pid: it.pid, nameZh: it.nameZh, nameEn: it.nameEn, emoji: it.emoji, qty: 0, revenueSen: 0, cogsSen: 0 };
        map[it.pid].qty += it.qty;
        map[it.pid].revenueSen += it.unitPriceSen * it.qty;
        map[it.pid].cogsSen += it.cogsSen * it.qty;
      });
    });
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, limit || 6);
  }

  function avgMakeSeconds(fromTs, toTs) {
    const os = ordersIn(fromTs, toTs).filter(o => o.readyAt && o.paidAt);
    if (!os.length) return 0;
    return Math.round(os.reduce((s, o) => s + (o.readyAt - o.paidAt), 0) / os.length / 1000);
  }

  function lowStock() {
    return db.ingredients.filter(i => i.stock <= i.min);
  }

  function cupsToday() {
    const s = startOfDay(now());
    let n = 0;
    db.orders.forEach(o => {
      if (o.status === 'void') return;
      if (o.paidAt >= s) o.items.forEach(i => { n += i.qty; });
    });
    return n;
  }

  /* ---------------- 演示历史 ---------------- */
  function mkSeedItem(pid, sel, qty) {
    const c = calcLine(pid, sel);
    if (!c) return null;
    return {
      seq: 1, pid,
      nameZh: c.product.nameZh, nameEn: c.product.nameEn, emoji: c.product.emoji,
      size: c.size.id, sugar: c.sugar.id, ice: c.ice.id,
      sizeZh: c.size.nameZh, sizeEn: c.size.nameEn,
      sugarZh: c.sugar.nameZh, sugarEn: c.sugar.nameEn,
      iceZh: c.ice.nameZh, iceEn: c.ice.nameEn,
      toppings: c.toppings.map(t => ({ id: t.id, nameZh: t.nameZh, nameEn: t.nameEn, priceSen: t.priceSen })),
      note: '', qty,
      unitPriceSen: c.unitPriceSen, cogsSen: c.cogsSen, usage: c.usage,
      status: 'done', doneAt: null, labelPrintedAt: null
    };
  }

  function seedHistory() {
    const rnd = mulberry32(20251105);
    const weights = [
      ['p_signature', 22], ['p_brownsugar', 14], ['p_passion', 11], ['p_taro', 9],
      ['p_mango', 8], ['p_jasmine', 8], ['p_oolong', 7], ['p_pudding', 6],
      ['p_grapefruit', 6], ['p_lemon', 5], ['p_coconut', 3], ['p_americano', 2]
    ];
    const totalW = weights.reduce((s, w) => s + w[1], 0);
    const pickProduct = () => {
      let x = rnd() * totalW;
      for (const [id, w] of weights) { x -= w; if (x <= 0) return id; }
      return 'p_signature';
    };
    const sizes = ['sz_m', 'sz_m', 'sz_l'];
    const sugars = ['sug_0', 'sug_30', 'sug_50', 'sug_50', 'sug_70', 'sug_100'];
    const ices = ['ice_n', 'ice_n', 'ice_l', 'ice_m', 'ice_0', 'ice_h'];
    const tpIds = ['tp_boba', 'tp_jelly', 'tp_taro', 'tp_pudding', 'tp_grass', 'tp_foam', 'tp_oat'];

    const base = startOfDay(now());
    let todayCount = 0;

    for (let d = 6; d >= 0; d--) {
      const dayStart = base - d * 86400000;
      const count = d === 0 ? 6 : 9 + Math.floor(rnd() * 7);
      for (let i = 0; i < count; i++) {
        const hNow = new Date().getHours();
        const hEnd = d === 0 ? Math.max(11, hNow) : 20;
        const hour = 10 + Math.floor(rnd() * Math.max(1, hEnd - 10));
        const minute = Math.floor(rnd() * 60);
        const ts = dayStart + hour * 3600000 + minute * 60000;
        if (ts > now() - 120000) continue;
        todayCount = (d === 0) ? todayCount + 1 : todayCount;

        const nItems = 1 + (rnd() < 0.45 ? 1 : 0) + (rnd() < 0.18 ? 1 : 0);
        const items = [];
        for (let k = 0; k < nItems; k++) {
          const pid = pickProduct();
          const sel = {
            size: sizes[Math.floor(rnd() * sizes.length)],
            sugar: sugars[Math.floor(rnd() * sugars.length)],
            ice: ices[Math.floor(rnd() * ices.length)],
            toppings: []
          };
          if (rnd() < 0.3) sel.toppings.push(tpIds[Math.floor(rnd() * tpIds.length)]);
          const it = mkSeedItem(pid, sel, 1);
          if (it) { it.seq = items.length + 1; items.push(it); }
        }
        if (!items.length) continue;

        const memberRoll = rnd();
        const mem = memberRoll < 0.38 ? db.members[Math.floor(rnd() * db.members.length)] : null;
        const useDiscount = rnd() < 0.14;

        const opt = {
          memberId: mem ? mem.id : null,
          discount: useDiscount ? { type: 'percent', value: 10, reason: '会员日' } : null
        };
        const t = computeTotals(items, opt);
        const method = rnd() < 0.42 ? 'cash' : 'duitnow';
        const payments = method === 'cash'
          ? [{ method: 'cash', amountSen: t.totalSen, tenderedSen: Math.ceil(t.totalSen / 1000) * 1000, changeSen: Math.ceil(t.totalSen / 1000) * 1000 - t.totalSen, at: ts }]
          : [{ method: 'duitnow', amountSen: t.totalSen, ref: 'DNQ' + String(ts).slice(-8), at: ts }];

        const no = 'A' + pad3(d === 0 ? todayCount : (i + 1));
        const order = {
          id: 'seed' + ts.toString(36) + i,
          no,
          fullNo: 'S1-' + dayKey(ts).replace(/-/g, '') + '-' + no,
          storeId: 'S1', channel: 'walkin',
          pickupType: rnd() < 0.72 ? 'takeaway' : 'dinein',
          items,
          memberId: mem ? mem.id : null,
          memberLabel: mem ? memberLabel(mem) : '',
          tierName: mem ? tier(mem.tierId).nameZh : '',
          subtotalSen: t.subtotalSen,
          discountSen: t.discountSen, discountMeta: t.discountMeta,
          couponId: null, couponCode: null, couponSen: 0,
          pointsUsed: 0, pointsSen: 0,
          totalSen: t.totalSen, baseSen: t.baseSen, taxSen: t.taxSen, cogsSen: t.cogsSen,
          savedSen: t.savedSen,
          payments,
          paymentStatus: 'paid',
          status: 'completed',
          pointsEarned: mem ? Math.floor((t.totalSen / 100) * db.settings.pointsPerRinggit * tier(mem.tierId).pointsRate) : 0,
          createdAt: ts, paidAt: ts,
          claimedAt: ts + 40000, readyAt: ts + 90000 + Math.floor(rnd() * 180000),
          calledAt: ts + 100000, completedAt: ts + 300000,
          voidedAt: null, callCount: 1, seed: true
        };
        db.orders.push(order);
        if (useDiscount) {
          db.audit.push({ id: 'a' + ts.toString(36) + i, at: ts, type: 'discount', text: '会员日 10% · ' + no, amountSen: t.discountSen });
        }
      }
    }
    db.counters.call = todayCount;
    db.orders.sort((a, b) => b.paidAt - a.paidAt);
    db.audit.sort((a, b) => b.at - a.at);
  }

  /* ---------------- 对外 ---------------- */
  return {
    get db() { return db; },
    get storageOK() { return storageOK; },
    load, save, reset,
    product, ingredient, group, option, tier, member, orderById, couponById, tierOf,
    normalizePhone, formatPhone, maskPhone, memberLabel, searchMembers, registerMember,
    calcLine, specText,
    cartLines, addToCart, updateQty, setQty, removeLine, replaceLine, clearCart,
    totals, computeTotals,
    pay, nextNo,
    activeOrders, waitingOrders, makingOrders, readyOrders,
    claim, toggleCup, finish, callAgain, pickup, reprintLabels,
    voidOrder, logWaste, topup,
    stats, todayStats, series, topProducts, avgMakeSeconds, lowStock, cupsToday,
    ordersIn, dayKey, startOfDay, todayKey,
    setLang(l) { db.lang = l; save(); },
    get lang() { return db.lang || 'zh'; }
  };
})();
