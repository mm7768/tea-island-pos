/* =========================================================
   后台：经营看板 / 订单 / 库存 / 会员 / 设置
   ========================================================= */
window.ViewAdmin = (function () {
  'use strict';

  const T = window.I18N, S = window.Store, U = window.UI;
  const t = (k, v) => T.t(k, v);
  let tab = 'overview';
  let range = 'today';

  function rangeTs() {
    const end = Date.now() + 86400000;
    if (range === 'today') return [S.startOfDay(Date.now()), end];
    return [S.startOfDay(Date.now()) - 6 * 86400000, end];
  }

  function render() {
    const el = document.getElementById('view-admin');
    el.innerHTML =
      '<div class="admin">' +
        '<div class="admin-head">' +
          '<h1>' + t('admin.title') + '</h1>' +
          '<div class="admin-tabs">' +
            ['overview', 'orders', 'stock', 'members', 'settings'].map(k =>
              '<button data-act="admin-tab" data-v="' + k + '" class="' + (tab === k ? 'active' : '') + '">' + t('admin.' + k) + '</button>').join('') +
          '</div>' +
          '<div class="range-sel">' +
            '<select data-change="range">' +
              '<option value="today" ' + (range === 'today' ? 'selected' : '') + '>' + t('admin.today') + '</option>' +
              '<option value="week" ' + (range === 'week' ? 'selected' : '') + '>' + t('admin.week') + '</option>' +
            '</select>' +
          '</div>' +
        '</div>' +
        (tab === 'overview' ? overviewHtml() : '') +
        (tab === 'orders' ? ordersHtml() : '') +
        (tab === 'stock' ? stockHtml() : '') +
        (tab === 'members' ? membersHtml() : '') +
        (tab === 'settings' ? settingsHtml() : '') +
      '</div>';
  }

  /* ---------------- 概览 ---------------- */
  function overviewHtml() {
    const rt = rangeTs();
    const st = S.stats(rt[0], rt[1]);
    const series = S.series(7);
    const top = S.topProducts(rt[0], rt[1], 6);
    const maxRev = Math.max.apply(null, series.map(s => s.revenueSen).concat([1]));
    const maxQty = Math.max.apply(null, top.map(p => p.qty).concat([1]));

    return '' +
      '<div class="kpis">' +
        kpi(t('admin.revenue'), U.money(st.revenueSen), st.orders + ' 单', true) +
        kpi(t('admin.net'), U.money(st.netSen), t('admin.sst') + ' ' + U.money(st.taxSen)) +
        kpi(t('admin.gross'), U.money(st.grossSen), (st.margin * 100).toFixed(1) + '% ' + t('admin.margin')) +
        kpi(t('admin.cups'), String(st.cups), t('admin.ticket') + ' ' + U.money(st.avgTicketSen)) +
        kpi(t('admin.disc'), U.money(st.discountSen), '免单 ' + st.compCount + ' · 退单 ' + st.voidCount) +
        kpi(t('admin.members'), st.orders ? Math.round(st.memberOrders / st.orders * 100) + '%' : '0%', U.money(st.memberSen)) +
      '</div>' +

      '<div class="panels">' +
        '<div class="card"><div class="card-head"><b>' + t('admin.trend') + '</b><span class="hint">' + U.money(series.reduce((s, x) => s + x.revenueSen, 0)) + ' / 7d</span></div>' +
          '<div class="card-body"><div class="bars">' +
            series.map((d, i) => {
              const h = Math.max(3, Math.round(d.revenueSen / maxRev * 100));
              return '<div class="bar-col"><span class="val">' + (d.revenueSen ? U.plain(d.revenueSen) : '') + '</span>' +
                '<div class="bar ' + (i === series.length - 1 ? 'today' : '') + '" style="height:' + h + '%"></div>' +
                '<span class="lbl">' + (d.date.getMonth() + 1) + '/' + d.date.getDate() + '</span></div>';
            }).join('') +
          '</div></div></div>' +
        '<div class="card"><div class="card-head"><b>' + t('admin.top') + '</b><span class="hint">' + t('admin.byQty') + '</span></div>' +
          '<div class="card-body"><div class="rank">' +
            (top.length ? top.map((p, i) => {
              const prod = S.product(p.pid) || { color: '#B0763C' };
              return '<div class="rank-row"><span class="rank-i">' + (i + 1) + '</span>' +
                '<span class="rank-thumb" style="background:' + prod.color + '1f;color:' + prod.color + '">' + U.esc(p.nameZh.slice(0, 1)) + '</span>' +
                '<span class="rank-name">' + U.esc(T.n(p)) + '</span>' +
                '<span class="rank-bar"><i style="width:' + Math.round(p.qty / maxQty * 100) + '%"></i></span>' +
                '<span class="rank-val">' + p.qty + ' 杯 · ' + U.plain(p.revenueSen) + '</span></div>';
            }).join('')
              : '<div class="muted-sm">' + t('admin.none') + '</div>') +
          '</div></div></div>' +
      '</div>' +

      '<div class="panels">' +
        '<div class="card"><div class="card-head"><b>' + t('admin.payMix') + '</b></div><div class="card-body">' +
          payMixHtml(st) +
        '</div></div>' +
        '<div class="card"><div class="card-head"><b>' + t('admin.audit') + '</b><span class="hint">' + S.db.audit.length + '</span></div>' +
          '<div class="card-body" style="max-height:220px;overflow:auto"><div style="display:flex;flex-direction:column;gap:7px">' +
            (S.db.audit.length ? S.db.audit.slice(0, 10).map(a =>
              '<div style="display:flex;gap:8px;font-size:12px;align-items:baseline">' +
                '<span class="muted-sm" style="font-variant-numeric:tabular-nums;flex:none">' + U.hhmm(a.at) + '</span>' +
                '<span class="tag ' + (a.type === 'void' ? 'r' : a.type === 'comp' ? 'y' : a.type === 'waste' ? 'r' : 'b') + '">' + U.esc(a.type) + '</span>' +
                '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + U.esc(a.text) + '</span>' +
                (a.amountSen ? '<span style="font-variant-numeric:tabular-nums">' + U.money(a.amountSen) + '</span>' : '') +
              '</div>').join('') : '<div class="muted-sm">' + t('admin.none') + '</div>') +
          '</div></div></div>' +
      '</div>' +

      '<div class="card"><div class="card-head"><b>' + t('admin.channel') + '</b></div><div class="card-body">' +
        '<div style="display:flex;gap:22px;align-items:center;flex-wrap:wrap">' +
          '<div><div class="muted-sm">' + t('admin.walkin') + '</div><b style="font-size:17px">' + U.money(st.revenueSen) + '</b>' +
            '<div class="muted-sm">' + (st.revenueSen ? 100 : 0) + '%</div></div>' +
          '<div style="opacity:.45"><div class="muted-sm">Grab / Foodpanda</div><b style="font-size:17px">RM 0.00</b>' +
            '<div class="muted-sm">已预留渠道字段</div></div>' +
        '</div>' +
      '</div></div>';
  }

  function kpi(label, value, sub, accent) {
    return '<div class="kpi ' + (accent ? 'accent' : '') + '"><small>' + label + '</small><b>' + value + '</b>' +
      (sub ? '<div class="sub">' + sub + '</div>' : '') + '</div>';
  }

  function payMixHtml(st) {
    const items = [
      { k: '现金 CASH', v: st.cashSen, c: '#B0763C' },
      { k: 'DuitNow', v: st.duitnowSen, c: '#3F6FA8' },
      { k: '储值 CREDIT', v: st.balanceSen, c: '#5C8A5F' }
    ];
    const total = items.reduce((s, x) => s + x.v, 0) || 1;
    return items.map(x =>
      '<div style="margin-bottom:11px">' +
        '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">' +
          '<span>' + x.k + '</span><span style="font-variant-numeric:tabular-nums">' + U.money(x.v) + ' · ' + Math.round(x.v / total * 100) + '%</span></div>' +
        '<div style="height:7px;border-radius:4px;background:var(--bg-2);overflow:hidden">' +
          '<i style="display:block;height:100%;width:' + (x.v / total * 100) + '%;background:' + x.c + '"></i></div>' +
      '</div>').join('');
  }

  /* ---------------- 订单 ---------------- */
  function ordersHtml() {
    const list = S.db.orders.slice(0, 40);
    return '<div class="card"><div class="card-head"><b>' + t('admin.orders') + '</b><span class="hint">' + list.length + ' / ' + S.db.orders.length + '</span></div>' +
      '<div class="card-body" style="padding:0">' +
      '<table class="tbl"><thead><tr>' +
        '<th>' + t('admin.orderNo') + '</th><th>' + t('admin.time') + '</th><th>' + t('admin.channel') + '</th>' +
        '<th>' + t('admin.cups') + '</th><th class="num">' + t('admin.amount') + '</th><th>' + t('admin.status') + '</th><th></th>' +
      '</tr></thead><tbody>' +
      (list.length ? list.map(o =>
        '<tr>' +
          '<td><b>' + U.esc(o.no) + '</b>' + (o.memberLabel ? ' <span class="tag">' + U.esc(o.memberLabel) + '</span>' : '') + '</td>' +
          '<td class="mono">' + (S.dayKey(o.paidAt) === S.todayKey()
            ? U.hhmm(o.paidAt)
            : (new Date(o.paidAt).getMonth() + 1) + '/' + new Date(o.paidAt).getDate() + ' ' + U.hhmm(o.paidAt)) + '</td>' +
          '<td>' + (o.pickupType === 'dinein' ? t('pos.dinein') : t('pos.pickup')) + '</td>' +
          '<td>' + o.items.reduce((a, i) => a + i.qty, 0) + '</td>' +
          '<td class="num">' + U.money(o.totalSen) + '</td>' +
          '<td>' + statusTag(o.status) + '</td>' +
          '<td>' + (['paid', 'preparing', 'ready'].indexOf(o.status) >= 0
            ? '<button class="link danger" data-act="void" data-id="' + o.id + '">' + t('admin.void') + '</button>'
            : '') + '</td>' +
        '</tr>').join('') : '<tr><td colspan="7" class="muted-sm" style="text-align:center;padding:24px">' + t('admin.none') + '</td></tr>') +
      '</tbody></table></div></div>';
  }

  function statusTag(s) {
    const map = { paid: 'b', preparing: 'y', ready: 'g', completed: '', void: 'r', pending: '' };
    return '<span class="tag ' + (map[s] || '') + '">' + t('st.' + s) + '</span>';
  }

  /* ---------------- 库存 ---------------- */
  function stockHtml() {
    const list = S.db.ingredients.slice().sort((a, b) => (a.stock / a.min) - (b.stock / b.min));
    const value = list.reduce((s, i) => s + i.stock * i.cost * 100, 0);
    const low = list.filter(i => i.stock <= i.min);
    return '<div class="kpis" style="grid-template-columns:repeat(4,1fr)">' +
        kpi(t('admin.value'), U.money(value), S.db.ingredients.length + ' 项原料', true) +
        kpi(t('admin.low'), String(low.length), low.map(i => i.nameZh).slice(0, 3).join('、')) +
        kpi(t('admin.waste'), U.money(S.db.waste.reduce((s, w) => s + w.qty * (S.ingredient(w.ingId) || { cost: 0 }).cost * 100, 0)), S.db.waste.length + ' 笔') +
        kpi('理论 vs 实际', '—', '差异分析待接入盘点') +
      '</div>' +
      '<div class="card"><div class="card-head"><b>' + t('admin.stock') + '</b><span class="hint">' + t('admin.low') + ' 优先</span></div>' +
      '<div class="card-body" style="padding:0;max-height:calc(100vh - 330px);overflow:auto">' +
      '<table class="tbl"><thead><tr>' +
        '<th>' + t('admin.ingredient') + '</th><th>' + t('admin.stockQty') + '</th><th>' + t('admin.minQty') + '</th>' +
        '<th>' + t('admin.unitCost') + '</th><th class="num">' + t('admin.value') + '</th><th></th><th></th>' +
      '</tr></thead><tbody>' +
      list.map(i => {
        const ratio = Math.min(1, i.stock / (i.min * 2));
        const cls = i.stock <= i.min ? 'bad' : i.stock <= i.min * 1.4 ? 'warn' : '';
        return '<tr>' +
          '<td><b>' + U.esc(i.nameZh) + '</b> <span class="muted-sm">' + U.esc(i.nameEn) + '</span></td>' +
          '<td class="' + (i.stock <= i.min ? 'low' : '') + '">' + num(i.stock) + ' ' + i.unit + '</td>' +
          '<td class="muted-sm">' + num(i.min) + '</td>' +
          '<td class="mono">' + i.cost.toFixed(3) + '</td>' +
          '<td class="num">' + U.money(i.stock * i.cost * 100) + '</td>' +
          '<td><div class="stock-bar"><i class="' + cls + '" style="width:' + Math.round(ratio * 100) + '%"></i></div></td>' +
          '<td><button class="link" data-act="waste" data-id="' + i.id + '">' + t('admin.waste') + '</button></td>' +
        '</tr>';
      }).join('') +
      '</tbody></table></div></div>';
  }

  function num(n) {
    return (Math.round(n * 10) / 10).toString();
  }

  /* ---------------- 会员 ---------------- */
  function membersHtml() {
    const ms = S.db.members.slice().sort((a, b) => b.totalSpentSen - a.totalSpentSen);
    const totalBalance = ms.reduce((s, m) => s + m.balanceSen, 0);
    const totalPoints = ms.reduce((s, m) => s + m.points, 0);
    return '<div class="kpis" style="grid-template-columns:repeat(4,1fr)">' +
        kpi(t('admin.members'), String(ms.length), '储值负债 ' + U.money(totalBalance), true) +
        kpi(t('admin.points'), String(totalPoints), '≈ ' + U.money(totalPoints * S.db.settings.pointValueSen)) +
        kpi(t('admin.balance'), U.money(totalBalance), '预收款（负债）') +
        kpi('券', String(S.db.coupons.filter(c => !c.used).length), '未核销') +
      '</div>' +
      '<div class="card"><div class="card-head"><b>' + t('admin.members') + '</b><span class="hint">按累计消费排序</span></div>' +
      '<div class="card-body" style="padding:0"><table class="tbl"><thead><tr>' +
        '<th>' + t('admin.name') + '</th><th>' + t('admin.tier') + '</th><th>' + t('admin.phone') + '</th>' +
        '<th>' + t('admin.points') + '</th><th class="num">' + t('admin.balance') + '</th>' +
        '<th class="num">' + t('admin.memberSpend') + '</th><th>' + t('admin.joinAt') + '</th><th></th>' +
      '</tr></thead><tbody>' +
      ms.map(m => {
        const tr = S.tierOf(m);
        return '<tr>' +
          '<td><b>' + U.esc(S.memberLabel(m)) + '</b>' + (m.name ? '' : ' <span class="tag">选填</span>') + '</td>' +
          '<td><span class="tag" style="color:' + tr.color + ';background:rgba(0,0,0,.04)">' + U.esc(T.n(tr)) + '</span></td>' +
          '<td class="mono">' + S.maskPhone(m.phone) + '</td>' +
          '<td>' + m.points + '</td>' +
          '<td class="num">' + U.money(m.balanceSen) + '</td>' +
          '<td class="num">' + U.money(m.totalSpentSen) + '</td>' +
          '<td class="mono">' + m.joinedAt + '</td>' +
          '<td><button class="link" data-act="topup" data-id="' + m.id + '">' + t('admin.topup') + '</button></td>' +
        '</tr>';
      }).join('') +
      '</tbody></table></div></div>';
  }

  /* ---------------- 设置 ---------------- */
  function settingsHtml() {
    const st = S.db.store, cfg = S.db.settings;
    return '<div class="panels">' +
      '<div class="card"><div class="card-head"><b>' + t('stg.shop') + '</b></div><div class="card-body">' +
        row2('门店', st.nameZh + ' / ' + st.nameEn) +
        row2('地址', st.addrZh) +
        row2('电话', st.phone) +
        row2(t('stg.sstNo'), st.sstNo) +
      '</div></div>' +
      '<div class="card"><div class="card-head"><b>' + t('stg.demo') + '</b></div><div class="card-body">' +
        row2(t('stg.tax'), (st.taxRate * 100).toFixed(1) + '%') +
        row2(t('stg.priceMode'), t('stg.inclusive')) +
        row2(t('stg.print'), cfg.labelPrintOn === 'claim' ? t('stg.onClaim') : t('stg.onPay')) +
        row2('积分规则', '每 RM1 得 ' + cfg.pointsPerRinggit + ' 分 · 100 分抵 RM5') +
        row2('大杯系数', '×' + cfg.largeScale) +
        row2(t('stg.lang'), T.lang === 'zh' ? '中文' : 'English') +
        row2(t('stg.version'), 'v0.1 · MVP1 原型') +
      '</div></div>' +
    '</div>' +
    '<div class="card"><div class="card-head"><b>' + t('stg.reset') + '</b></div><div class="card-body" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">' +
      '<div class="muted-sm" style="flex:1;min-width:220px">' + t('stg.resetHint') + '</div>' +
      '<button class="btn btn-danger" data-act="reset">' + t('stg.reset') + '</button>' +
    '</div></div>';
  }

  function row2(k, v) {
    return '<div style="display:flex;gap:12px;padding:7px 0;border-bottom:1px solid #F4EEE6;font-size:12.5px">' +
      '<span style="color:var(--muted);width:110px;flex:none">' + U.esc(k) + '</span>' +
      '<span style="flex:1;min-width:0">' + U.esc(v) + '</span></div>';
  }

  /* ---------------- 事件 ---------------- */
  U.on('admin-tab', el => { tab = el.dataset.v; render(); });
  U.onInput('range', el => { range = el.value; render(); });

  U.on('void', el => {
    const id = el.dataset.id;
    U.modal({
      title: t('void.title'), narrow: true, sub: t('void.hint'),
      body: '<div class="opt-group"><div class="opt-title"><b>' + t('void.reason') + '</b></div>' +
        '<div class="opt-list">' + ['顾客取消', '做错了', '付款失败', '重复下单', '其他'].map(r =>
          '<button class="opt" data-act="void-reason" data-v="' + r + '" data-id="' + id + '">' + r + '</button>').join('') + '</div></div>',
      foot: '<button class="btn btn-ghost" data-act="close-modal">取消</button>'
    });
  });
  U.on('void-reason', el => {
    const r = S.voidOrder(el.dataset.id, el.dataset.v);
    U.closeModal();
    if (r.ok) { U.toast(t('toast.voided'), 'ok'); render(); U.updateBadge(); }
  });

  let wasteReason = '打翻/倾洒';
  U.on('waste', el => {
    const ing = S.ingredient(el.dataset.id);
    U.modal({
      title: t('waste.title') + ' · ' + ing.nameZh, narrow: true, sub: t('waste.hint'),
      body:
        '<div class="opt-group"><div class="opt-title"><b>' + t('waste.qty') + '（' + ing.unit + '）</b><small>现有 ' + num(ing.stock) + '</small></div>' +
          '<input id="waste-qty" class="note-input" inputmode="decimal" placeholder="0" /></div>' +
        '<div class="opt-group"><div class="opt-title"><b>' + t('waste.reason') + '</b></div><div class="opt-list">' +
          t('waste.reasons').split('|').map((r, i) =>
            '<button class="opt ' + (i === 0 ? 'on' : '') + '" data-act="waste-reason" data-v="' + r + '">' + r + '</button>').join('') +
        '</div></div>',
      foot: '<button class="btn btn-ghost" data-act="close-modal">取消</button>' +
            '<button class="btn btn-danger" data-act="waste-submit" data-id="' + ing.id + '">' + t('waste.submit') + '</button>'
    });
  });
  U.on('waste-reason', el => {
    wasteReason = el.dataset.v;
    el.parentNode.querySelectorAll('.opt').forEach(b => b.classList.remove('on'));
    el.classList.add('on');
  });
  U.on('waste-submit', el => {
    const qty = parseFloat((document.getElementById('waste-qty') || {}).value || '0');
    const r = S.logWaste(el.dataset.id, qty, wasteReason);
    if (!r.ok) { U.toast('数量无效', 'err'); return; }
    U.closeModal(); U.toast(t('toast.waste'), 'ok'); render();
  });

  U.on('topup', el => {
    const m = S.member(el.dataset.id);
    U.modal({
      title: t('topup.title') + ' · ' + S.memberLabel(m), narrow: true,
      body:
        '<div class="opt-group"><div class="opt-title"><b>' + t('topup.amount') + '</b></div><div class="opt-list">' +
          [50, 100, 200, 500].map(v => '<button class="opt" data-act="topup-amt" data-v="' + v * 100 + '">RM ' + v + '</button>').join('') +
        '</div></div>' +
        '<div class="opt-group"><div class="opt-title"><b>' + t('topup.bonus') + '</b><small>' + t('topup.bonusHint') + '</small></div>' +
          '<input id="topup-amt" class="note-input" inputmode="decimal" placeholder="0.00" /></div>' +
        '<div class="muted-sm">当前储值 ' + U.money(m.balanceSen) + ' · 赠送金按 10% 计，不可退现</div>',
      foot: '<button class="btn btn-ghost" data-act="close-modal">取消</button>' +
            '<button class="btn btn-primary" data-act="topup-submit" data-id="' + m.id + '">' + t('topup.submit') + '</button>'
    });
  });
  U.on('topup-amt', el => {
    const inp = document.getElementById('topup-amt');
    if (inp) inp.value = U.plain(Number(el.dataset.v));
    el.parentNode.querySelectorAll('.opt').forEach(b => b.classList.remove('on'));
    el.classList.add('on');
  });
  U.on('topup-submit', el => {
    const v = parseFloat((document.getElementById('topup-amt') || {}).value || '0');
    const sen = Math.round(v * 100);
    if (!(sen > 0)) { U.toast('金额无效', 'err'); return; }
    const bonus = Math.round(sen * 0.1);
    S.topup(el.dataset.id, sen, bonus);
    U.closeModal(); U.toast(t('toast.topup'), 'ok'); render();
  });

  U.on('reset', () => {
    U.modal({
      title: t('stg.reset'), narrow: true,
      body: '<div class="muted-sm">' + t('stg.resetHint') + '</div>',
      foot: '<button class="btn btn-ghost" data-act="close-modal">取消</button>' +
            '<button class="btn btn-danger" data-act="reset-confirm">' + t('stg.reset') + '</button>'
    });
  });
  U.on('reset-confirm', () => {
    S.reset();
    U.closeModal(); U.toast(t('toast.reset'), 'ok');
    U.render();
  });

  return { render, setTab: k => { tab = k; } };
})();
