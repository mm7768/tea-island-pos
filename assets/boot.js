/* =========================================================
   启动
   ========================================================= */
(function () {
  'use strict';

  const T = window.I18N, S = window.Store, U = window.UI;
  const t = (k, v) => T.t(k, v);

  /* 全局错误兜底：出错时页面不会白屏，也便于自测 */
  window.addEventListener('error', function (e) {
    try {
      document.body.setAttribute('data-js-error', (e.message || 'error') + ' @ ' + String(e.filename || '').split('/').pop() + ':' + e.lineno);
      U.toast(t('toast.jsError') + ' — ' + (e.message || ''), 'err');
    } catch (x) {}
  });
  window.addEventListener('unhandledrejection', function (e) {
    try { document.body.setAttribute('data-js-error', 'promise: ' + ((e.reason && e.reason.message) || e.reason)); } catch (x) {}
  });

  function init() {
    S.load();
    const urlLang = new URLSearchParams(location.search).get('lang');
    T.setLang(urlLang === 'en' ? 'en' : (S.lang || 'zh'));
    if (urlLang === 'en') S.setLang('en');
    U.applyI18n();
    U.tickClock();
    setInterval(U.tickClock, 15000);

    document.querySelectorAll('#nav .nav-btn').forEach(btn => {
      btn.addEventListener('click', () => U.go(btn.dataset.nav));
    });

    const langBtn = document.getElementById('lang-btn');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        const next = T.lang === 'zh' ? 'en' : 'zh';
        T.setLang(next);
        S.setLang(next);
        U.applyI18n();
        U.tickClock();
        U.render();
      });
    }

    U.on('help', () => {
      const steps = [
        ['1', t('help.s1')],
        ['2', t('help.s2')],
        ['3', t('help.s3')],
        ['4', t('help.s4')],
        ['5', t('help.s5')],
        ['6', t('help.s6')]
      ];
      U.modal({
        title: t('help.title'),
        sub: t('help.sub'),
        body: '<div style="display:flex;flex-direction:column;gap:14px">' + steps.map(s =>
          '<div style="display:flex;gap:13px;align-items:flex-start">' +
            '<span style="width:26px;height:26px;border-radius:8px;background:var(--brand-soft);color:var(--brand-2);font-weight:800;display:grid;place-items:center;flex:none">' + s[0] + '</span>' +
            '<span style="font-size:13.5px;line-height:1.6;padding-top:3px">' + U.esc(s[1]) + '</span>' +
          '</div>').join('') + '</div>',
        foot: '<button class="btn btn-primary" data-act="close-modal">' + t('help.go') + '</button>'
      });
    });

    U.go('pos');
    document.body.setAttribute('data-ready', '1');
    document.body.setAttribute('data-storage', S.storageOK ? 'local' : 'memory');
    U.updateBadge();
    if (!S.storageOK) U.toast('当前以本地文件打开，数据无法持久化；建议用本地服务器打开', 'warn');
    applyScene();
  }

  /* 演示场景：?scene=kds|admin|cust|pay|receipt|labels（用于培训与截图） */
  function applyScene() {
    const scene = new URLSearchParams(location.search).get('scene');
    if (!scene) return;

    const std = (pid, sel, qty, note) => S.addToCart(pid, sel, qty, note || '');

    setTimeout(() => {
      if (scene === 'kds') {
        // 造一单待领取、一单制作中、一单待取餐
        std('p_jasmine', { size: 'sz_m', sugar: 'sug_0', ice: 'ice_0', toppings: [] }, 1, '');
        S.pay('cash', 2000);
        std('p_signature', { size: 'sz_l', sugar: 'sug_50', ice: 'ice_l', toppings: ['tp_boba'] }, 1, '');
        std('p_passion', { size: 'sz_m', sugar: 'sug_30', ice: 'ice_n', toppings: [] }, 2, '少冰');
        const b = S.pay('duitnow', 0).order;
        S.claim(b.id);
        S.toggleCup(b.id, 1);
        std('p_taro', { size: 'sz_m', sugar: 'sug_70', ice: 'ice_m', toppings: [] }, 1, '');
        const c = S.pay('duitnow', 0).order;
        S.claim(c.id);
        c.items.forEach(i => S.toggleCup(c.id, i.seq));
        S.finish(c.id);
        U.go('kds');
        return;
      }
      if (scene === 'admin') {
        const tab = new URLSearchParams(location.search).get('tab');
        if (tab) ViewAdmin.setTab(tab);
        U.go('admin');
        return;
      }
      if (scene === 'cust') { ViewPOS.openCust('add', { pid: 'p_signature' }); return; }

      std('p_signature', { size: 'sz_l', sugar: 'sug_50', ice: 'ice_l', toppings: ['tp_boba'] }, 1, '');
      std('p_passion', { size: 'sz_m', sugar: 'sug_30', ice: 'ice_n', toppings: [] }, 2, '少冰');
      U.render();

      if (scene === 'pay') {
        S.db.checkout.memberId = 'M001';
        S.db.checkout.discount = { type: 'percent', value: 10, reason: '员工折扣' };
        S.save(); U.render();
        setTimeout(() => document.querySelector('[data-act="open-pay"]').click(), 60);
        return;
      }
      if (scene === 'receipt' || scene === 'labels') {
        S.db.checkout.memberId = 'M001';
        S.db.checkout.points = 100;
        S.save();
        const r = S.pay('cash', 5000);
        U.render();
        if (r.ok) {
          if (scene === 'labels') ViewPOS.showLabels(r.order);
          else ViewPOS.showReceipt(r.order);
        }
      }
    }, 30);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
