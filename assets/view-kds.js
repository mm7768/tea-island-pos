/* =========================================================
   制作看板（整单工单）
   ========================================================= */
window.ViewKDS = (function () {
  'use strict';

  const T = window.I18N, S = window.Store, U = window.UI;
  const t = (k, v) => T.t(k, v);

  function render() {
    const el = document.getElementById('view-kds');
    const waiting = S.waitingOrders();
    const making = S.makingOrders();
    const ready = S.readyOrders();
    const st = S.todayStats();
    const avg = S.avgMakeSeconds(S.startOfDay(Date.now()), Date.now());

    el.innerHTML =
      '<div class="kds">' +
        '<div class="kds-head">' +
          '<h1>' + t('kds.title') + '</h1>' +
          '<span class="muted-sm">' + S.db.store.nameZh + ' · S1</span>' +
          '<div class="kpi-inline">' +
            '<div><b>' + waiting.length + '</b><small>' + t('kds.waiting') + '</small></div>' +
            '<div><b>' + making.length + '</b><small>' + t('kds.making') + '</small></div>' +
            '<div><b>' + (avg ? Math.floor(avg / 60) + '′' + String(avg % 60).padStart(2, '0') + '″' : '—') + '</b><small>' + t('kds.avg') + '</small></div>' +
            '<div><b>' + st.cups + '</b><small>' + t('kds.today') + '</small></div>' +
          '</div>' +
        '</div>' +
        '<div class="board">' +
          column('waiting', t('kds.waiting'), waiting, ticketWaiting) +
          column('making', t('kds.making'), making, ticketMaking) +
          column('ready', t('kds.ready'), ready, ticketReady) +
        '</div>' +
        pickupStrip(ready) +
      '</div>';
    refreshTimes();
  }

  function column(kind, label, list, fn) {
    const cups = list.reduce((s, o) => s + o.items.reduce((a, i) => a + i.qty, 0), 0);
    return '<div class="col ' + kind + '">' +
      '<div class="col-head"><b>' + label + '</b><span class="n">' + list.length + '</span>' +
        '<span class="muted-sm" style="margin-left:auto">' + cups + ' ' + t('kds.cups') + '</span></div>' +
      '<div class="col-body">' + (list.length ? list.map(fn).join('') : '<div class="empty-col">' + t('kds.empty') + '</div>') + '</div>' +
    '</div>';
  }

  function itemsHtml(o, interactive) {
    return o.items.map(it => {
      const spec = [it.sizeZh, it.sugarZh, it.iceZh].join(' · ');
      const tps = (it.toppings || []).map(x => '+' + x.nameZh).join(' ');
      const done = it.status === 'done';
      return '<div class="t-item ' + (done ? 'done' : '') + '" ' + (interactive ? 'data-act="cup-toggle" data-id="' + o.id + '" data-seq="' + it.seq + '"' : '') + '>' +
        '<span class="q">' + it.seq + '</span>' +
        '<div class="d">' +
          '<span class="nm">' + U.esc(it.nameZh) + (it.qty > 1 ? ' ×' + it.qty : '') + '</span>' +
          '<span class="sp">' + U.esc(spec) + (tps ? ' ' + U.esc(tps) : '') + '</span>' +
          (it.note ? '<span class="nt">* ' + U.esc(it.note) + '</span>' : '') +
        '</div>' +
        (interactive ? '<span class="chk">' + (done ? '✓' : '') + '</span>' : '') +
      '</div>';
    }).join('');
  }

  function head(o) {
    return '<div class="t-top">' +
      '<div class="t-no">' + U.esc(o.no) + '</div>' +
      '<div class="t-badges">' +
        '<span class="t-badge ' + (o.pickupType === 'dinein' ? '' : 'delivery') + '">' + (o.pickupType === 'dinein' ? t('pos.dinein') : t('pos.pickup')) + '</span>' +
        '<span class="t-badge">' + o.items.reduce((a, i) => a + i.qty, 0) + ' ' + t('kds.cups') + '</span>' +
      '</div></div>' +
      '<div class="t-time" data-elapsed="' + o.paidAt + '">' + U.elapsed(o.paidAt) + '</div>';
  }

  function ticketWaiting(o) {
    return '<div class="ticket">' + head(o) +
      '<div class="t-items" style="margin-top:8px">' + itemsHtml(o, false) + '</div>' +
      '<div class="t-acts"><button class="primary" data-act="claim" data-id="' + o.id + '">' + t('kds.claim') + '</button></div>' +
    '</div>';
  }

  function ticketMaking(o) {
    const total = o.items.reduce((a, i) => a + i.qty, 0);
    const doneN = o.items.filter(i => i.status === 'done').reduce((a, i) => a + i.qty, 0);
    const allDone = doneN >= total;
    return '<div class="ticket making">' + head(o) +
      '<div class="t-items" style="margin-top:8px">' + itemsHtml(o, true) + '</div>' +
      '<div class="muted-sm" style="margin:-2px 0 8px">' +
        (allDone ? '✅ ' + t('kds.allDone') : t('kds.missing', { n: total - doneN })) +
      '</div>' +
      '<div class="t-acts">' +
        '<button class="line" data-act="reprint" data-id="' + o.id + '">' + t('kds.reprint') + '</button>' +
        '<button class="go" data-act="finish" data-id="' + o.id + '" ' + (allDone ? '' : 'disabled style="opacity:.45"') + '>' + t('kds.finish') + '</button>' +
      '</div>' +
    '</div>';
  }

  function ticketReady(o) {
    return '<div class="ticket ready">' + head(o) +
      '<div class="t-items" style="margin-top:8px">' + itemsHtml(o, false) + '</div>' +
      '<div class="t-acts">' +
        '<button class="line" data-act="call" data-id="' + o.id + '">' + t('kds.call') + '</button>' +
        '<button class="go" data-act="picked" data-id="' + o.id + '">' + t('kds.picked') + '</button>' +
      '</div>' +
    '</div>';
  }

  function pickupStrip(ready) {
    const done = S.db.orders.filter(o => o.status === 'completed' && o.completedAt && Date.now() - o.completedAt < 1800000).slice(0, 8);
    return '<div class="pickup-strip">' +
      '<b>' + t('kds.pickup') + '</b>' +
      '<div class="pickup-list">' +
        (ready.length ? ready.map(o => '<span class="pickup-no">' + U.esc(o.no) + '</span>').join('') : '<span class="muted-sm">' + t('kds.none') + '</span>') +
      '</div>' +
      (done.length ? '<span class="muted-sm" style="margin-left:auto">最近完成：' +
        done.map(o => '<span class="pickup-no done" style="font-size:11px;padding:2px 8px">' + U.esc(o.no) + '</span>').join(' ') + '</span>' : '') +
    '</div>';
  }

  /* ---------------- 计时 ---------------- */
  function refreshTimes() {
    document.querySelectorAll('#view-kds [data-elapsed]').forEach(el => {
      const ts = Number(el.dataset.elapsed);
      el.textContent = U.elapsed(ts);
      const mins = (Date.now() - ts) / 60000;
      el.classList.toggle('warn', mins > 8);
    });
  }
  setInterval(() => {
    if (U.currentView() === 'kds') refreshTimes();
  }, 1000);

  /* ---------------- 事件 ---------------- */
  U.on('claim', el => {
    const r = S.claim(el.dataset.id);
    if (!r.ok) return;
    render();
    U.updateBadge();
    U.toast(t('toast.claimed'), 'ok');
  });

  U.on('cup-toggle', el => {
    const r = S.toggleCup(el.dataset.id, Number(el.dataset.seq));
    if (r.ok) { render(); U.updateBadge(); }
  });

  U.on('finish', el => {
    const r = S.finish(el.dataset.id);
    if (!r.ok) {
      if (r.code === 'missing') U.toast(t('kds.missing', { n: r.count }), 'err');
      return;
    }
    render();
    U.updateBadge();
    U.toast(t('toast.finished'), 'ok');
    U.callout(r.order.no, t('kds.readyHint'));
  });

  U.on('call', el => {
    const o = S.callAgain(el.dataset.id);
    if (!o) return;
    render();
    U.callout(o.no, t('kds.readyHint'));
  });

  U.on('picked', el => {
    const o = S.pickup(el.dataset.id);
    if (!o) return;
    render();
    U.updateBadge();
    U.toast(t('toast.picked'), 'ok');
  });

  U.on('reprint', el => {
    const o = S.reprintLabels(el.dataset.id);
    if (!o) return;
    U.toast(t('toast.labels'), 'ok');
    setTimeout(() => ViewPOS.showLabels(o), 120);
  });

  return { render };
})();
