/* =========================================================
   收银台
   ========================================================= */
window.ViewPOS = (function () {
  'use strict';

  const T = window.I18N, S = window.Store, U = window.UI;
  let cat = '全部';
  let cust = null;
  let payState = null;
  let searchQ = '';
  let focusId = null;

  const t = (k, v) => T.t(k, v);

  /* ---------------- 主渲染 ---------------- */
  function render() {
    const el = document.getElementById('view-pos');
    const active = document.activeElement;
    focusId = active && active.id ? active.id : null;
    const caret = active && active.selectionStart;

    el.innerHTML = shellHtml();

    if (focusId) {
      const again = document.getElementById(focusId);
      if (again && again.focus) {
        again.focus();
        try { if (caret != null && again.setSelectionRange) again.setSelectionRange(again.value.length, again.value.length); } catch (e) {}
      }
      focusId = null;
    }
    U.paintQRs(el);
  }

  function shellHtml() {
    const t2 = S.totals();
    return '<div class="pos">' +
      '<div class="pos-left">' + headHtml() + chipsHtml() + gridHtml() + '</div>' +
      '<aside class="pos-right">' + cartHeadHtml() + memberHtml() + cartListHtml() + footHtml(t2) + '</aside>' +
    '</div>';
  }

  function headHtml() {
    const st = S.todayStats();
    const pk = S.db.checkout.pickupType;
    return '<div class="pos-head">' +
      '<div><div class="pos-title">' + t('pos.title') + '</div>' +
      '<div class="pos-sub">' + S.db.products.length + (T.lang === 'en' ? ' items · ' : ' 款 · ') + t('kds.today') + ' ' + st.cups + ' ' + t('kds.cups') + '</div></div>' +
      '<div class="seg" style="margin-left:auto">' +
        '<button data-act="pickup" data-v="takeaway" class="' + (pk === 'takeaway' ? 'active' : '') + '">' + t('pos.pickup') + '</button>' +
        '<button data-act="pickup" data-v="dinein" class="' + (pk === 'dinein' ? 'active' : '') + '">' + t('pos.dinein') + '</button>' +
      '</div>' +
    '</div>';
  }

  function cats() {
    const set = [];
    S.db.products.forEach(p => { if (set.indexOf(p.cat) < 0) set.push(p.cat); });
    return ['全部'].concat(set);
  }

  function chipsHtml() {
    return '<div class="chips">' + cats().map(c =>
      '<button class="chip ' + (cat === c ? 'active' : '') + '" data-act="cat" data-v="' + U.esc(c) + '">' +
      U.esc(T.cat(c)) + '</button>'
    ).join('') + '</div>';
  }

  function gridHtml() {
    const list = S.db.products.filter(p => cat === '全部' || p.cat === cat);
    return '<div class="grid">' + list.map(p =>
      '<button class="prod" data-act="prod" data-id="' + p.id + '">' +
        (p.tag ? '<span class="prod-tag ' + (p.tag === '销冠' ? 'hot' : p.tag === '新品' ? 'new' : '') + '">' + U.esc(p.tag) + '</span>' : '') +
        '<span class="prod-thumb" style="background:' + p.color + '1f;color:' + p.color + '">' + U.esc(p.nameZh.slice(0, 1)) + '</span>' +
        '<div class="prod-name">' + U.esc(T.n(p)) + '</div>' +
        '<div class="prod-en">' + U.esc(T.lang === 'en' ? p.nameZh : p.nameEn) + '</div>' +
        '<div class="prod-price">' + U.money(p.priceSen) + '</div>' +
      '</button>'
    ).join('') + '</div>';
  }

  /* ---------------- 购物车 ---------------- */
  function cartHeadHtml() {
    const lines = S.cartLines();
    const n = lines.reduce((s, l) => s + l.qty, 0);
    return '<div class="cart-head"><h2>' + t('pos.cart') + '</h2>' +
      '<span class="count">' + n + ' ' + t('pos.items') + '</span>' +
      (n ? '<button class="link" style="margin-left:auto" data-act="clear-cart">' + t('pos.clear') + '</button>' : '') +
    '</div>';
  }

  function memberHtml() {
    const ck = S.db.checkout;
    const m = ck.memberId ? S.member(ck.memberId) : null;
    if (m) {
      const tier = S.tierOf(m);
      return '<div class="member-box">' +
        '<div class="member-chip">' +
          '<div class="member-avatar">' + U.esc((m.name || '会')[0]) + '</div>' +
          '<div class="member-meta"><b>' + U.esc(S.memberLabel(m)) + ' <span class="tier-pill" style="color:' + tier.color + '">' + U.esc(T.n(tier)) + '</span></b>' +
            '<small>' + S.maskPhone(m.phone) + ' · ' + m.points + ' 分 · 储值 ' + U.money(m.balanceSen) + '</small></div>' +
          '<button class="member-close" data-act="unset-member" title="移除">×</button>' +
        '</div>' +
      '</div>';
    }
    const results = searchQ ? S.searchMembers(searchQ) : [];
    const digits = searchQ.replace(/\D/g, '');
    const canReg = digits.length >= 8;
    return '<div class="member-box">' +
      '<div class="member-row">' +
        '<input id="phone-input" class="phone-input" data-input="phone" data-enter="phone-enter" placeholder="' + t('pos.phonePlaceholder') + '" value="' + U.esc(searchQ) + '" autocomplete="off" />' +
        (canReg ? '<button class="btn-mini" data-act="reg-member">' + t('pos.register') + '</button>' : '') +
      '</div>' +
      (results.length
        ? '<div style="margin-top:8px;display:flex;flex-direction:column;gap:6px">' + results.map(r =>
            '<button class="member-chip" style="text-align:left" data-act="set-member" data-id="' + r.id + '">' +
              '<div class="member-avatar">' + U.esc((r.name || '会')[0]) + '</div>' +
              '<div class="member-meta"><b>' + U.esc(S.memberLabel(r)) + '</b><small>' + S.maskPhone(r.phone) + ' · ' + r.points + ' 分</small></div>' +
            '</button>').join('') + '</div>'
        : '<div class="muted-sm" style="margin-top:7px">' + t('pos.memberHint') + '</div>') +
      (results.length || searchQ ? '' :
        '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">' +
          S.db.members.slice(0, 2).map(m2 =>
            '<button class="chip" style="padding:4px 10px;font-size:11px;max-width:100%;overflow:hidden;text-overflow:ellipsis" data-act="set-member" data-id="' + m2.id + '">' +
              U.esc(S.memberLabel(m2)) + ' · ' + S.maskPhone(m2.phone).slice(-4) + '</button>').join('') +
        '</div>') +
    '</div>';
  }

  function cartListHtml() {
    const lines = S.cartLines();
    if (!lines.length) {
      return '<div class="cart-list"><div class="cart-empty"><span class="ico">🧋</span>' +
        t('pos.empty') + '<br><span style="font-size:11.5px">' + t('pos.emptyHint') + '</span></div></div>';
    }
    return '<div class="cart-list">' + lines.map(l => {
      const spec = [T.n(l.size), T.n(l.sugar), T.n(l.ice)].join(' · ') +
        (l.toppings.length ? '  ' + l.toppings.map(x => '+' + T.n(x)).join(' ') : '');
      return '<div class="cart-line">' +
        '<div class="cl-main">' +
          '<div class="cl-top"><span class="cl-name">' + U.esc(T.n(l.product)) + '</span>' +
          '<span class="cl-price">' + U.money(l.unitPriceSen * l.qty) + '</span></div>' +
          '<div class="cl-spec">' + U.esc(spec) + '</div>' +
          (l.note ? '<div class="cl-note">备注：' + U.esc(l.note) + '</div>' : '') +
        '</div>' +
        '<div class="cl-side">' +
          '<div class="stepper">' +
            '<button data-act="qty" data-uid="' + l.uid + '" data-d="-1">−</button>' +
            '<span>' + l.qty + '</span>' +
            '<button data-act="qty" data-uid="' + l.uid + '" data-d="1">+</button>' +
          '</div>' +
          '<div class="cl-acts">' +
            '<button data-act="edit-line" data-uid="' + l.uid + '">' + t('cust.edit') + '</button>' +
            '<button class="del" data-act="del-line" data-uid="' + l.uid + '">删除</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('') + '</div>';
  }

  function footHtml(t2) {
    const ck = S.db.checkout;
    const m = ck.memberId ? S.member(ck.memberId) : null;
    const hasCart = t2.subtotalSen > 0;
    const discLabel = t2.discountMeta
      ? (t2.discountMeta.type === 'free' ? '免单' : (t2.discountMeta.type === 'percent' ? t2.discountMeta.value + '%' : U.money(t2.discountMeta.valueSen)))
      : '';

    return '<div class="cart-foot">' +
      '<div class="cart-tools">' +
        '<button class="tool ' + (t2.discountSen ? 'on' : '') + '" data-act="open-discount">' + t('pos.discountBtn') + '</button>' +
        '<button class="tool ' + (t2.couponSen ? 'on' : '') + '" data-act="open-coupon">' + t('pos.couponBtn') + '</button>' +
        '<button class="tool ' + (t2.pointsSen ? 'on' : '') + '" data-act="toggle-points">' + t('pos.points') + '</button>' +
        '<button class="tool" data-act="open-comp" style="grid-column:span 3;color:var(--red)">' + t('pos.comp') + '</button>' +
      '</div>' +
      '<div class="sum-row"><span>' + t('pos.subtotal') + '</span><span class="v">' + U.money(t2.subtotalSen) + '</span></div>' +
      (t2.discountSen ? '<div class="sum-row disc"><span>' + t('pos.discount') + ' ' + U.esc(discLabel) + '</span><span class="v">-' + U.money(t2.discountSen) + '</span></div>' : '') +
      (t2.couponSen ? '<div class="sum-row disc"><span>' + t('pos.coupon') + ' ' + U.esc(t2.coupon ? t2.coupon.code : '') + '</span><span class="v">-' + U.money(t2.couponSen) + '</span></div>' : '') +
      (t2.pointsSen ? '<div class="sum-row disc"><span>' + t('pos.points') + ' ' + t2.pointsUsed + '</span><span class="v">-' + U.money(t2.pointsSen) + '</span></div>' : '') +
      '<div class="sum-row total"><span>' + t('pos.total') + '</span><span class="v">' + U.money(t2.totalSen) + '</span></div>' +
      '<div class="sum-note">' + t('pos.taxIncl') + ' ' + U.money(t2.taxSen) + '</div>' +
      '<button class="btn-pay" data-act="open-pay" ' + (hasCart ? '' : 'disabled') + '>' +
        t('pos.checkout') + ' <span class="amt">' + U.money(t2.totalSen) + '</span>' +
      '</button>' +
    '</div>';
  }

  /* ---------------- 客制化弹窗 ---------------- */
  function openCust(mode, opts) {
    opts = opts || {};
    cust = {
      mode,
      uid: opts.uid || null,
      pid: opts.pid,
      sel: opts.sel || { size: 'sz_m', sugar: 'sug_50', ice: 'ice_n', toppings: [] },
      qty: opts.qty || 1,
      note: opts.note || ''
    };
    cust.sel = JSON.parse(JSON.stringify(cust.sel));
    U.modal({
      title: t('cust.title') + ' · ' + T.n(S.product(cust.pid)),
      sub: T.lang === 'en' ? S.product(cust.pid).nameZh : S.product(cust.pid).nameEn,
      body: '<div id="cust-body"></div>',
      onMount: () => paintCust()
    });
  }

  function paintCust() {
    const body = document.getElementById('cust-body');
    if (!body) return;
    const calc = S.calcLine(cust.pid, cust.sel);
    const price = calc.unitPriceSen * cust.qty;

    const groups = S.db.optionGroups.map(g => {
      const isMulti = g.type === 'multi';
      const chosen = isMulti ? cust.sel.toppings : cust.sel[g.id];
      return '<div class="opt-group">' +
        '<div class="opt-title"><b>' + U.esc(T.n(g)) + '</b>' +
          (isMulti ? '<small>' + t('cust.max', { n: g.max }) + '</small>' : '') +
          (g.required ? '<span class="req">' + t('cust.required') + '</span>' : '') +
        '</div>' +
        '<div class="opt-list">' + g.options.map(o => {
          const on = isMulti ? cust.sel.toppings.indexOf(o.id) >= 0 : chosen === o.id;
          const disabled = isMulti && !on && cust.sel.toppings.length >= g.max;
          return '<button class="opt ' + (on ? 'on' : '') + '" data-act="cust-opt" data-g="' + g.id + '" data-o="' + o.id + '" ' + (disabled ? 'disabled style="opacity:.4"' : '') + '>' +
            U.esc(T.n(o)) + (o.sub ? '<small>' + o.sub + '</small>' : '') +
            (o.priceSen ? '<small class="plus">+' + U.plain(o.priceSen) + '</small>' : '') +
          '</button>';
        }).join('') + '</div>' +
      '</div>';
    }).join('');

    body.innerHTML = groups +
      '<div class="opt-group"><div class="opt-title"><b>' + t('cust.note') + '</b></div>' +
        '<input id="cust-note" class="note-input" data-input="cust-note" value="' + U.esc(cust.note) + '" placeholder="' + t('cust.note') + '" />' +
      '</div>' +
      '<div class="qty-bar">' +
        '<div class="qty-ctrl">' +
          '<button data-act="cust-qty" data-d="-1">−</button><span>' + cust.qty + '</span>' +
          '<button data-act="cust-qty" data-d="1">+</button>' +
        '</div>' +
        '<div class="price-preview"><small>' + U.esc([T.n(calc.size), T.n(calc.sugar), T.n(calc.ice)].join(' · ')) + '</small>' +
        '<b>' + U.money(price) + '</b></div>' +
      '</div>' +
      '<button class="btn btn-primary" style="width:100%;margin-top:16px" data-act="cust-save">' +
        (cust.mode === 'edit' ? t('cust.save') : t('cust.add')) + ' · ' + U.money(price) + '</button>';
  }

  /* ---------------- 会员 ---------------- */
  function setMember(id) {
    S.db.checkout.memberId = id;
    S.db.checkout.points = 0;
    S.save();
    searchQ = '';
    U.toast(t('toast.member'), 'ok');
    render();
  }

  function openRegister() {
    const digits = searchQ.replace(/\D/g, '');
    U.modal({
      title: t('pos.register'),
      sub: t('pos.memberHint'),
      narrow: true,
      body:
        '<div class="opt-group"><div class="opt-title"><b>手机号</b><span class="req">*</span></div>' +
          '<input id="reg-phone" class="note-input" data-input="reg-phone" value="' + U.esc(digits) + '" />' +
          '<div class="muted-sm" style="margin-top:6px">标准化为 ' + U.esc(S.normalizePhone(digits)) + '</div></div>' +
        '<div class="opt-group"><div class="opt-title"><b>姓名</b><small>选填</small></div>' +
          '<input id="reg-name" class="note-input" placeholder="不填则显示为「尾号 1234」" /></div>',
      foot: '<button class="btn btn-ghost" data-act="close-modal">取消</button>' +
            '<button class="btn btn-primary" data-act="reg-confirm">' + t('pos.register') + '</button>'
    });
  }

  /* ---------------- 折扣 / 券 / 积分 / 免单 ---------------- */
  function openDiscount() {
    const m = S.db.checkout.memberId ? S.member(S.db.checkout.memberId) : null;
    const tier = m ? S.tierOf(m) : null;
    const presets = [
      { type: 'percent', value: 5, label: '5%' },
      { type: 'percent', value: 10, label: '10%' },
      { type: 'percent', value: 15, label: '15%' },
      { type: 'amount', valueSen: 200, label: 'RM2' },
      { type: 'amount', valueSen: 500, label: 'RM5' }
    ];
    U.modal({
      title: t('pos.discountBtn'),
      narrow: true,
      body:
        (tier && tier.discount ? '<div class="opt-group"><div class="opt-title"><b>' + U.esc(T.n(tier)) + ' 权益</b><small>' + (tier.discount * 100) + '% 折扣</small></div>' +
          '<button class="opt" data-act="disc-apply" data-type="percent" data-v="' + (tier.discount * 100) + '" data-reason="会员权益">' +
          '应用 ' + (tier.discount * 100) + '% 会员折扣</button></div>' : '') +
        '<div class="opt-group"><div class="opt-title"><b>快捷折扣</b></div><div class="opt-list">' +
          presets.map(p => '<button class="opt" data-act="disc-apply" data-type="' + p.type + '" data-v="' + (p.type === 'percent' ? p.value : p.valueSen) + '">' + p.label + '</button>').join('') +
        '</div></div>' +
        '<div class="opt-group"><div class="opt-title"><b>原因（计入审计）</b></div>' +
          '<input id="disc-reason" class="note-input" placeholder="如：员工折扣 / 客诉补偿 / 熟客" /></div>' +
        (S.db.checkout.discount ? '<button class="btn btn-ghost" style="width:100%" data-act="disc-clear">清除折扣</button>' : ''),
      foot: '<button class="btn btn-ghost" data-act="close-modal">取消</button>'
    });
  }

  function openCoupon() {
    const m = S.db.checkout.memberId ? S.member(S.db.checkout.memberId) : null;
    const usable = S.db.coupons.filter(c => !c.used && (!c.memberId || (m && c.memberId === m.id)));
    U.modal({
      title: t('pos.couponBtn'),
      narrow: true,
      body:
        '<div class="opt-group"><div class="opt-title"><b>可用券</b><small>' + usable.length + ' 张</small></div>' +
          (usable.length ? '<div style="display:flex;flex-direction:column;gap:8px">' + usable.map(c =>
            '<button class="member-chip" style="text-align:left" data-act="coupon-apply" data-id="' + c.id + '">' +
              '<div class="member-avatar" style="background:var(--brand);color:#fff">券</div>' +
              '<div class="member-meta"><b>' + U.esc(T.n(c)) + ' <span class="tier-pill">' + U.esc(c.code) + '</span></b>' +
              '<small>满 ' + U.plain(c.minSpendSen) + (c.maxDiscountSen ? ' · 最高减 ' + U.plain(c.maxDiscountSen) : '') + ' · 至 ' + c.expiresAt + '</small></div>' +
            '</button>').join('') + '</div>' : '<div class="muted-sm">暂无可用券</div>') +
        '</div>' +
        '<div class="opt-group"><div class="opt-title"><b>输入券码</b></div>' +
          '<div class="member-row"><input id="coupon-code" class="note-input" placeholder="如 TEA3" style="flex:1" />' +
          '<button class="btn-mini" data-act="coupon-code-apply">应用</button></div></div>',
      foot: (S.db.checkout.couponId ? '<button class="btn btn-ghost" data-act="coupon-clear">清除券</button>' : '') +
            '<button class="btn btn-ghost" data-act="close-modal">关闭</button>'
    });
  }

  function applyCoupon(id) {
    const c = S.couponById(id);
    if (!c) return;
    S.db.checkout.couponId = id;
    S.save();
    U.closeModal();
    U.toast(t('toast.couponOk'), 'ok');
    render();
  }

  function openComp() {
    U.modal({
      title: t('pos.comp'),
      narrow: true,
      sub: '免单需要记录原因，会计入审计与免单率',
      body:
        '<div class="opt-group"><div class="opt-title"><b>免单原因</b><span class="req">*</span></div>' +
          '<div class="opt-list">' +
            ['客诉补偿', '员工餐', '媒体/合作', '试饮', '操作失误'].map(r =>
              '<button class="opt" data-act="comp-reason" data-v="' + r + '">' + r + '</button>').join('') +
          '</div></div>' +
        '<div class="opt-group"><div class="opt-title"><b>确认</b></div>' +
          '<div class="muted-sm">整单金额将变为 RM0.00，库存仍会照常扣减。</div></div>',
      foot: '<button class="btn btn-ghost" data-act="close-modal">取消</button>'
    });
  }

  /* ---------------- 收款 ---------------- */
  function openPay() {
    const tt = S.totals();
    if (!S.db.cart.length) return;
    if (tt.totalSen === 0) { payState = { method: 'comp', tenderedSen: 0 }; paintPay(); return; }
    payState = { method: 'cash', tenderedSen: 0 };
    paintPay();
  }

  function paintPay() {
    U.modal({
      title: t('pay.title'),
      sub: S.db.cart.length + ' ' + t('pos.items'),
      narrow: true,
      locked: true,
      body: '<div id="pay-body"></div>',
      onMount: () => paintPayBody()
    });
  }

  function paintPayBody() {
    const body = document.getElementById('pay-body');
    if (!body) return;
    const tt = S.totals();
    const m = S.db.checkout.memberId ? S.member(S.db.checkout.memberId) : null;

    if (tt.totalSen === 0) {
      body.innerHTML =
        '<div class="pay-amount"><small>' + t('pos.total') + '</small><b>RM 0.00</b></div>' +
        '<div class="muted-sm" style="text-align:center;margin-bottom:16px">' + t('pos.comp') + ' · ' + U.esc(S.db.checkout.discount ? (S.db.checkout.discount.reason || '') : '') + '</div>' +
        '<button class="btn btn-primary" style="width:100%" data-act="pay-confirm">确认出单</button>';
      return;
    }

    const canBalance = m && m.balanceSen >= tt.totalSen;
    body.innerHTML =
      '<div class="pay-amount"><small>' + t('pos.total') + '</small><b>' + U.money(tt.totalSen) + '</b>' +
        '<div class="muted-sm" style="margin-top:4px">' + t('pos.taxIncl') + ' ' + U.money(tt.taxSen) + '</div></div>' +
      '<div class="methods">' +
        methodBtn('cash', '💵', t('pay.cash'), '', false) +
        methodBtn('duitnow', '📱', t('pay.duitnow'), 'QR', false) +
        methodBtn('balance', '💳', t('pay.balance'), m ? U.money(m.balanceSen) : '—', !canBalance) +
      '</div>' +
      '<div id="pay-panel"></div>';
    paintPayPanel(tt, m);
  }

  function methodBtn(id, icon, name, sub, disabled) {
    return '<button class="method ' + (payState.method === id ? 'on' : '') + '" data-act="pay-method" data-m="' + id + '" ' + (disabled ? 'disabled' : '') + '>' +
      '<span class="m-ico">' + icon + '</span><b>' + U.esc(name) + '</b><small>' + U.esc(sub || '') + '</small></button>';
  }

  function paintPayPanel(tt, m) {
    const panel = document.getElementById('pay-panel');
    if (!panel) return;

    if (payState.method === 'cash') {
      const quick = uniq([tt.totalSen, 1000, 2000, 5000, 10000].filter(v => v >= tt.totalSen));
      const change = payState.tenderedSen - tt.totalSen;
      panel.innerHTML =
        '<div class="cash-panel">' +
          '<div class="quick">' + quick.slice(0, 4).map(v =>
            '<button data-act="cash-quick" data-v="' + v + '">' + (v === tt.totalSen ? '整付 ' : 'RM ') + U.plain(v) + '</button>').join('') + '</div>' +
          '<input id="cash-in" class="cash-input" data-input="cash" inputmode="decimal" placeholder="0.00" value="' + (payState.tenderedSen ? U.plain(payState.tenderedSen) : '') + '" />' +
          '<div class="change-row"><span>' + t('pay.change') + '</span><b id="change-val" class="' + (change < 0 && payState.tenderedSen > 0 ? 'neg' : '') + '">' + U.money(Math.max(0, change)) + '</b></div>' +
          '<button class="btn btn-primary sim-btn" data-act="pay-confirm" ' + (change < 0 ? 'disabled' : '') + '>' + t('pay.confirm') + '</button>' +
        '</div>';
    } else if (payState.method === 'duitnow') {
      const ref = 'DUITNOW|S1|' + tt.totalSen + '|' + Date.now();
      payState.ref = ref;
      panel.innerHTML =
        '<div class="qr-wrap">' +
          '<div class="qr-frame"><canvas id="qr-canvas" data-qr="' + ref + '"></canvas></div>' +
          '<div class="qr-brand"><span class="dn">DN</span> DuitNow QR · ' + U.money(tt.totalSen) + '</div>' +
          '<div class="qr-hint">' + t('pay.qrHint') + '</div>' +
          '<div class="qr-timer" id="qr-timer">02:00</div>' +
          '<button class="btn btn-primary sim-btn" data-act="pay-confirm">' + t('pay.sim') + '</button>' +
          '<div class="sim-note">' + t('pay.mock') + '</div>' +
        '</div>';
      setTimeout(() => U.paintQRs(panel), 0);
      startQrTimer();
    } else {
      const after = m ? m.balanceSen - tt.totalSen : 0;
      panel.innerHTML =
        '<div class="balance-panel">' +
          '<div class="lbl">' + t('admin.balance') + '</div>' +
          '<div class="bal">' + U.money(m ? m.balanceSen : 0) + '</div>' +
          '<div class="after">' + t('pay.after') + '：' + U.money(after) + '</div>' +
          '<button class="btn btn-primary sim-btn" data-act="pay-confirm" ' + (after < 0 ? 'disabled' : '') + '>' + t('pay.confirm') + '</button>' +
        '</div>';
    }
  }

  let qrTimer = null, qrLeft = 120;
  function startQrTimer() {
    clearInterval(qrTimer);
    qrLeft = 120;
    qrTimer = setInterval(() => {
      qrLeft--;
      const el = document.getElementById('qr-timer');
      if (!el) { clearInterval(qrTimer); return; }
      if (qrLeft <= 0) { el.textContent = t('pay.expired'); clearInterval(qrTimer); return; }
      el.textContent = String(Math.floor(qrLeft / 60)).padStart(2, '0') + ':' + String(qrLeft % 60).padStart(2, '0');
    }, 1000);
  }

  function uniq(arr) {
    const out = [];
    arr.forEach(v => { if (out.indexOf(v) < 0) out.push(v); });
    return out;
  }

  function finalize() {
    const method = payState.method;
    if (method === 'duitnow') clearInterval(qrTimer);
    const r = S.pay(method, payState.tenderedSen, { ref: payState.ref });
    if (!r.ok) {
      if (r.code === 'insufficient_cash') U.toast(t('pay.insufficient'), 'err');
      else if (r.code === 'insufficient_balance') U.toast(t('pay.noBalance'), 'err');
      else U.toast('支付失败', 'err');
      return;
    }
    U.closeModal();
    payState = null;
    render();
    const low = S.lowStock();
    if (low.length) setTimeout(() => U.toast(t('toast.lowStock', { n: low.length }), 'warn'), 900);
    setTimeout(() => showReceipt(r.order), 80);
  }

  /* ---------------- 小票 & 杯贴 ---------------- */
  function showReceipt(order) {
    U.modal({
      title: t('rc.title') + ' · ' + order.no,
      sub: t('toast.paid'),
      body: U.receiptHtml(order),
      foot:
        '<button class="btn btn-ghost" data-act="print-receipt" data-id="' + order.id + '">🖨 ' + t('rc.print') + '</button>' +
        '<button class="btn btn-ghost" data-act="show-labels" data-id="' + order.id + '">' + t('rc.labels') + '</button>' +
        '<button class="btn btn-primary" data-act="close-modal">' + t('rc.done') + '</button>'
    });
  }

  function showLabels(order) {
    U.modal({
      title: t('lbl.title') + ' · ' + order.no,
      sub: t('lbl.hint') + ' · ' + order.items.length + ' 张',
      wide: true,
      body: U.labelHtml(order),
      foot: '<button class="btn btn-ghost" data-act="close-modal">关闭</button>' +
            '<button class="btn btn-primary" data-act="print-labels">🖨 ' + t('lbl.print') + '</button>',
      onMount: (w) => U.paintQRs(w)
    });
  }

  /* ---------------- 事件 ---------------- */
  U.on('cat', el => { cat = el.dataset.v; render(); });
  U.on('pickup', el => { S.db.checkout.pickupType = el.dataset.v; S.save(); render(); });
  U.on('prod', el => openCust('add', { pid: el.dataset.id }));
  U.on('cust-opt', el => {
    const g = el.dataset.g, o = el.dataset.o;
    const grp = S.group(g);
    if (!grp) return;
    if (grp.type === 'multi') {
      const i = cust.sel.toppings.indexOf(o);
      if (i >= 0) cust.sel.toppings.splice(i, 1);
      else if (cust.sel.toppings.length < grp.max) cust.sel.toppings.push(o);
    } else cust.sel[g] = o;
    paintCust();
  });
  U.on('cust-qty', el => { cust.qty = Math.max(1, cust.qty + Number(el.dataset.d)); paintCust(); });
  U.on('cust-save', () => {
    if (cust.mode === 'edit') S.replaceLine(cust.uid, cust.pid, cust.sel, cust.qty, cust.note);
    else S.addToCart(cust.pid, cust.sel, cust.qty, cust.note);
    U.closeModal();
    U.toast(t('toast.added'), 'ok');
    render();
  });
  U.onInput('cust-note', el => { if (cust) cust.note = el.value; });
  U.on('edit-line', el => {
    const ln = S.cartLines().find(l => l.uid === el.dataset.uid);
    if (!ln) return;
    openCust('edit', { uid: ln.uid, pid: ln.pid, qty: ln.qty, note: ln.note,
      sel: { size: ln.size.id, sugar: ln.sugar.id, ice: ln.ice.id, toppings: ln.toppings.map(x => x.id) } });
  });
  U.on('qty', el => { S.updateQty(el.dataset.uid, Number(el.dataset.d)); render(); });
  U.on('del-line', el => { S.removeLine(el.dataset.uid); render(); });
  U.on('clear-cart', () => {
    U.modal({
      title: t('pos.clear'), narrow: true,
      body: '<div class="muted-sm">清空后购物车、折扣、券与积分抵扣都会重置。</div>',
      foot: '<button class="btn btn-ghost" data-act="close-modal">取消</button>' +
            '<button class="btn btn-danger" data-act="do-clear">' + t('pos.clear') + '</button>'
    });
  });
  U.on('do-clear', () => { S.clearCart(); searchQ = ''; U.closeModal(); render(); U.toast(t('toast.cleared')); });

  U.onInput('phone', el => {
    searchQ = el.value;
    const box = el.closest('.member-box');
    if (box) {
      const tmp = document.createElement('div');
      tmp.innerHTML = memberHtml();
      box.innerHTML = tmp.firstChild.innerHTML;
      const inp = document.getElementById('phone-input');
      if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
    }
  });
  U.on('phone-enter', () => {
    const rs = S.searchMembers(searchQ);
    if (rs.length === 1) setMember(rs[0].id);
  });
  U.on('set-member', el => setMember(el.dataset.id));
  U.on('unset-member', () => {
    S.db.checkout.memberId = null; S.db.checkout.points = 0; S.db.checkout.couponId = null;
    S.save(); searchQ = ''; render();
  });
  U.on('reg-member', () => openRegister());
  U.on('reg-confirm', () => {
    const phone = (document.getElementById('reg-phone') || {}).value || '';
    const name = (document.getElementById('reg-name') || {}).value || '';
    const r = S.registerMember(phone, name);
    if (!r.ok) { U.toast('手机号无效', 'err'); return; }
    S.db.checkout.memberId = r.member.id;
    S.save(); U.closeModal(); searchQ = '';
    U.toast(t('toast.registered'), 'ok');
    render();
  });

  U.on('open-discount', () => openDiscount());
  U.on('disc-apply', el => {
    const type = el.dataset.type;
    const v = Number(el.dataset.v);
    const reasonEl = document.getElementById('disc-reason');
    const reason = (reasonEl && reasonEl.value) || el.dataset.reason || '';
    S.db.checkout.discount = type === 'percent'
      ? { type: 'percent', value: v, reason }
      : { type: 'amount', valueSen: v, reason };
    S.save(); U.closeModal(); render();
    U.toast(t('toast.saved'), 'ok');
  });
  U.on('disc-clear', () => { S.db.checkout.discount = null; S.save(); U.closeModal(); render(); });
  U.on('open-coupon', () => openCoupon());
  U.on('coupon-apply', el => applyCoupon(el.dataset.id));
  U.on('coupon-code-apply', () => {
    const code = ((document.getElementById('coupon-code') || {}).value || '').trim().toUpperCase();
    const c = S.db.coupons.find(x => x.code === code && !x.used);
    if (!c) { U.toast(t('toast.couponFail'), 'err'); return; }
    const m = S.db.checkout.memberId;
    if (c.memberId && c.memberId !== m) { U.toast('该券属于其他会员', 'err'); return; }
    applyCoupon(c.id);
  });
  U.on('coupon-clear', () => { S.db.checkout.couponId = null; S.save(); U.closeModal(); render(); });
  U.on('toggle-points', () => {
    const ck = S.db.checkout;
    const m = ck.memberId ? S.member(ck.memberId) : null;
    if (!m) { U.toast(t('toast.noMember'), 'warn'); return; }
    ck.points = ck.points > 0 ? 0 : Math.min(m.points, 500) - (Math.min(m.points, 500) % 100);
    if (ck.points <= 0) ck.points = 0;
    S.save(); render();
  });
  U.on('open-comp', () => openComp());
  U.on('comp-reason', el => {
    S.db.checkout.discount = { type: 'free', value: 100, reason: el.dataset.v };
    S.save(); U.closeModal(); render();
    U.toast('已设置免单 · ' + el.dataset.v, 'warn');
  });

  U.on('open-pay', () => openPay());
  U.on('pay-method', el => {
    payState.method = el.dataset.m;
    payState.tenderedSen = 0;
    paintPay();
  });
  U.on('cash-quick', el => {
    payState.tenderedSen = Number(el.dataset.v);
    paintPay();
  });
  U.onInput('cash', el => {
    const v = parseFloat(String(el.value).replace(/[^\d.]/g, ''));
    payState.tenderedSen = isNaN(v) ? 0 : Math.round(v * 100);
    const tt = S.totals();
    const change = payState.tenderedSen - tt.totalSen;
    const cv = document.getElementById('change-val');
    if (cv) { cv.textContent = U.money(Math.max(0, change)); cv.className = change < 0 && payState.tenderedSen > 0 ? 'neg' : ''; }
    const btn = document.querySelector('[data-act="pay-confirm"]');
    if (btn) btn.disabled = change < 0;
  });
  U.on('pay-confirm', () => finalize());
  U.on('print-receipt', el => {
    const order = S.orderById(el.dataset.id);
    if (order) U.printHtml(U.receiptHtml(order));
    U.toast(t('toast.printed'));
  });
  U.on('show-labels', el => {
    const order = S.orderById(el.dataset.id);
    if (order) showLabels(order);
  });
  U.on('print-labels', () => {
    const sheet = document.querySelector('#modal-root .label-sheet');
    if (sheet) U.printHtml(sheet.outerHTML);
    U.toast(t('toast.labelPrinted'), 'ok');
  });

  return { render, showLabels, showReceipt, openCust };
})();
