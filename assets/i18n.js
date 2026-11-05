/* =========================================================
   中英双语文案（默认中文）
   ========================================================= */
window.I18N = (function () {
  'use strict';

  const zh = {
    'nav.pos':'收银', 'nav.kds':'制作', 'nav.admin':'后台', 'nav.help':'流程指引',
    'brand.store':'门店', 'brand.open':'营业中',
    'cat.全部':'全部', 'cat.招牌奶茶':'招牌奶茶', 'cat.纯茶':'纯茶', 'cat.水果茶':'水果茶', 'cat.咖啡':'咖啡',

    'pos.title':'点单', 'pos.all':'全部', 'pos.search':'搜索饮品…',
    'pos.cart':'购物车', 'pos.items':'件', 'pos.empty':'还没有选择饮品',
    'pos.emptyHint':'点击左侧饮品开始下单', 'pos.member':'会员',
    'pos.phonePlaceholder':'手机号后四位', 'pos.register':'注册', 'pos.memberHint':'输入后四位快速查找，新号直接注册',
    'pos.subtotal':'小计', 'pos.discount':'折扣', 'pos.coupon':'优惠券',
    'pos.points':'积分抵扣', 'pos.total':'合计', 'pos.checkout':'收款',
    'pos.clear':'清空', 'pos.comp':'免单', 'pos.discountBtn':'折扣',
    'pos.couponBtn':'优惠券', 'pos.pickup':'外带', 'pos.dinein':'堂食',
    'pos.taxIncl':'含 SST 6%', 'pos.memberOff':'会员价', 'pos.qty':'数量',

    'cust.title':'客制化', 'cust.add':'加入购物车', 'cust.note':'备注（如：分杯装、少冰）',
    'cust.required':'必选', 'cust.max':'最多 {n} 项', 'cust.edit':'修改', 'cust.save':'保存修改',

    'pay.title':'收款', 'pay.cash':'现金', 'pay.duitnow':'DuitNow', 'pay.balance':'储值余额',
    'pay.tendered':'实收', 'pay.change':'找零', 'pay.confirm':'确认收款',
    'pay.qrHint':'请顾客使用银行 App 扫码支付', 'pay.sim':'模拟顾客已支付',
    'pay.waiting':'等待到账中…', 'pay.expired':'二维码已过期', 'pay.refresh':'刷新二维码',
    'pay.noBalance':'储值余额不足', 'pay.after':'支付后余额', 'pay.processing':'处理中…',
    'pay.insufficient':'实收金额不足', 'pay.mock':'演示环境：DuitNow 为模拟支付',

    'rc.title':'客户小票', 'rc.no':'单号', 'rc.time':'时间', 'rc.cashier':'收银',
    'rc.item':'品项', 'rc.amount':'金额', 'rc.total':'合计', 'rc.sst':'其中 SST 6%',
    'rc.paid':'实收', 'rc.change':'找零', 'rc.points':'本单积分',
    'rc.thanks':'谢谢惠顾，欢迎再来', 'rc.print':'打印小票', 'rc.labels':'查看杯贴',
    'rc.done':'完成', 'rc.saved':'本单已省 {v}', 'rc.balance':'储值余额',
    'rc.sstNo':'SST No.', 'rc.pickup':'外带', 'rc.dinein':'堂食',

    'lbl.title':'杯贴预览', 'lbl.hint':'50×40mm 热敏标签 · 每杯一张 · 中文优先',
    'lbl.print':'打印杯贴', 'lbl.cup':'第 {i} 杯 / 共 {n} 杯',

    'kds.title':'制作看板', 'kds.waiting':'待领取', 'kds.making':'制作中', 'kds.ready':'待取餐',
    'kds.claim':'领取工单', 'kds.finish':'完成制作', 'kds.call':'叫号取餐', 'kds.picked':'已取餐',
    'kds.cups':'杯', 'kds.empty':'暂无工单', 'kds.avg':'平均出杯', 'kds.today':'今日出杯',
    'kds.pickup':'取餐中', 'kds.none':'暂无', 'kds.missing':'还有 {n} 杯未完成',
    'kds.claimed':'已领取', 'kds.waited':'已等 {n} 分', 'kds.allDone':'全部完成，请叫号',
    'kds.reprint':'重打杯贴', 'kds.readyHint':'请取餐', 'kds.order':'单',

    'admin.title':'经营看板', 'admin.overview':'概览', 'admin.orders':'订单',
    'admin.stock':'库存', 'admin.members':'会员', 'admin.settings':'设置',
    'admin.revenue':'营业额（含税）', 'admin.net':'不含税收入', 'admin.sst':'应缴 SST',
    'admin.gross':'毛利', 'admin.margin':'毛利率', 'admin.ordersN':'订单数',
    'admin.cups':'杯数', 'admin.ticket':'客单价', 'admin.disc':'折扣总额',
    'admin.trend':'近 7 日营业额', 'admin.top':'热销榜', 'admin.byQty':'按杯数', 'admin.payMix':'支付方式',
    'admin.channel':'销售渠道', 'admin.none':'暂无数据', 'admin.walkin':'门店堂食',
    'admin.low':'低库存', 'admin.waste':'登记损耗', 'admin.ingredient':'原料',
    'admin.stockQty':'库存量', 'admin.minQty':'安全线', 'admin.unitCost':'单位成本',
    'admin.value':'库存价值', 'admin.audit':'操作审计', 'admin.void':'退单',
    'admin.voided':'已退单', 'admin.memberSpend':'累计消费', 'admin.tier':'等级',
    'admin.points':'积分', 'admin.balance':'储值', 'admin.topup':'充值',
    'admin.joinAt':'加入时间', 'admin.phone':'手机号', 'admin.name':'姓名',
    'admin.noName':'未填姓名', 'admin.orderNo':'单号', 'admin.time':'时间',
    'admin.amount':'金额', 'admin.status':'状态', 'admin.action':'操作',
    'admin.reason':'原因', 'admin.today':'今日', 'admin.week':'近 7 日',

    'st.pending':'待支付', 'st.paid':'已付款', 'st.preparing':'制作中',
    'st.ready':'待取餐', 'st.completed':'已完成', 'st.void':'已退单',

    'stg.shop':'门店信息', 'stg.tax':'税率', 'stg.priceMode':'计价方式',
    'stg.inclusive':'标价含税（SST 内扣）', 'stg.sstNo':'SST 注册号',
    'stg.print':'杯贴打印时机', 'stg.onClaim':'领取工单时', 'stg.onPay':'收款完成时',
    'stg.reset':'重置演示数据', 'stg.resetHint':'清空订单、库存变动与会员变动，恢复到初始状态。',
    'stg.lang':'界面语言', 'stg.demo':'演示参数', 'stg.version':'版本',

    'waste.title':'登记损耗', 'waste.hint':'损耗单独记账，不进营业额；用于核算「理论用量 vs 实际盘点」差异。',
    'waste.qty':'数量', 'waste.reason':'原因', 'waste.reasons':'打翻/倾洒|过期报废|试饮|员工餐|设备故障|其他',
    'waste.submit':'确认登记', 'waste.done':'已登记损耗',

    'topup.title':'会员充值', 'topup.amount':'充值金额', 'topup.bonus':'赠送',
    'topup.bonusHint':'充 100 送 10（赠送金不可退现）', 'topup.submit':'确认充值',
    'topup.done':'充值成功',

    'void.title':'确认退单', 'void.hint':'退单会回滚库存扣减、冲销积分，并记入审计。',
    'void.reason':'退单原因', 'void.confirm':'确认退单', 'void.done':'已退单',

    'help.title':'模拟运营流程', 'help.sub':'按这 6 步走一遍，就是一个完整的营业闭环',
    'help.s1':'顾客点单，选择杯型 / 糖度 / 冰量 / 加料',
    'help.s2':'员工确认下单，购物车进入待收款',
    'help.s3':'收款：现金找零，或 DuitNow 扫码（演示为模拟回调）',
    'help.s4':'收款成功：出客户小票 + 每杯一张制作杯贴，同时扣料、发积分',
    'help.s5':'制作员在看板领取工单，全部做完才能点完成',
    'help.s6':'叫号通知取餐，顾客取走后点「已取餐」结单',
    'help.go':'开始',

    'toast.added':'已加入购物车', 'toast.removed':'已移除', 'toast.cleared':'购物车已清空',
    'toast.paid':'收款成功，制作单已发送', 'toast.member':'已识别会员',
    'toast.registered':'会员注册成功', 'toast.couponOk':'优惠券已应用',
    'toast.couponFail':'该券不可用', 'toast.noMember':'请先识别会员',
    'toast.claimed':'已领取，杯贴已打印', 'toast.finished':'制作完成，已叫号',
    'toast.called':'正在叫号', 'toast.picked':'已取餐，订单完成',
    'toast.labels':'杯贴已发送', 'toast.printed':'已发送到打印机',
    'toast.lowStock':'注意：{n} 项原料低于安全库存',
    'toast.reset':'演示数据已重置', 'toast.voided':'已退单并回滚库存',
    'toast.waste':'损耗已登记', 'toast.topup':'充值成功',
    'toast.labelPrinted':'杯贴已打印', 'toast.saved':'已保存',
    'toast.jsError':'页面脚本出错，请刷新重试'
  };

  const en = {
    'nav.pos':'POS', 'nav.kds':'Kitchen', 'nav.admin':'Back Office', 'nav.help':'Guide',
    'brand.store':'Store', 'brand.open':'Open',
    'cat.全部':'All', 'cat.招牌奶茶':'Signature Milk Tea', 'cat.纯茶':'Pure Tea', 'cat.水果茶':'Fruit Tea', 'cat.咖啡':'Coffee',

    'pos.title':'Order', 'pos.all':'All', 'pos.search':'Search drinks…',
    'pos.cart':'Cart', 'pos.items':'items', 'pos.empty':'No drinks yet',
    'pos.emptyHint':'Tap a drink on the left to start', 'pos.member':'Member',
    'pos.phonePlaceholder':'Last 4 digits', 'pos.register':'Register',
    'pos.memberHint':'Search by last 4 digits, or register a new number',
    'pos.subtotal':'Subtotal', 'pos.discount':'Discount', 'pos.coupon':'Coupon',
    'pos.points':'Points', 'pos.total':'Total', 'pos.checkout':'Pay',
    'pos.clear':'Clear', 'pos.comp':'Comp', 'pos.discountBtn':'Discount',
    'pos.couponBtn':'Coupon', 'pos.pickup':'Takeaway', 'pos.dinein':'Dine-in',
    'pos.taxIncl':'incl. SST 6%', 'pos.memberOff':'Member price', 'pos.qty':'Qty',

    'cust.title':'Customise', 'cust.add':'Add to cart', 'cust.note':'Note (e.g. separate cups)',
    'cust.required':'Required', 'cust.max':'Up to {n}', 'cust.edit':'Edit', 'cust.save':'Save',

    'pay.title':'Payment', 'pay.cash':'Cash', 'pay.duitnow':'DuitNow', 'pay.balance':'Store Credit',
    'pay.tendered':'Received', 'pay.change':'Change', 'pay.confirm':'Confirm',
    'pay.qrHint':'Ask the customer to scan with their banking app',
    'pay.sim':'Simulate paid', 'pay.waiting':'Waiting for payment…',
    'pay.expired':'QR expired', 'pay.refresh':'Refresh QR',
    'pay.noBalance':'Insufficient balance', 'pay.after':'Balance after', 'pay.processing':'Processing…',
    'pay.insufficient':'Amount received is not enough', 'pay.mock':'Demo mode: DuitNow is simulated',

    'rc.title':'Receipt', 'rc.no':'No.', 'rc.time':'Time', 'rc.cashier':'Cashier',
    'rc.item':'Item', 'rc.amount':'Amount', 'rc.total':'TOTAL', 'rc.sst':'incl. SST 6%',
    'rc.paid':'Paid', 'rc.change':'Change', 'rc.points':'Points earned',
    'rc.thanks':'Thank you, please come again', 'rc.print':'Print receipt',
    'rc.labels':'Cup labels', 'rc.done':'Done', 'rc.saved':'You saved {v}',
    'rc.balance':'Store credit', 'rc.sstNo':'SST No.', 'rc.pickup':'Takeaway', 'rc.dinein':'Dine-in',

    'lbl.title':'Cup Labels', 'lbl.hint':'50×40mm thermal label · one per cup · Chinese primary',
    'lbl.print':'Print labels', 'lbl.cup':'Cup {i} of {n}',

    'kds.title':'Kitchen Display', 'kds.waiting':'To claim', 'kds.making':'In progress',
    'kds.ready':'Ready', 'kds.claim':'Claim', 'kds.finish':'Done', 'kds.call':'Call',
    'kds.picked':'Picked up', 'kds.cups':'cups', 'kds.empty':'No tickets',
    'kds.avg':'Avg. time', 'kds.today':'Cups today', 'kds.pickup':'Ready for pickup',
    'kds.none':'None', 'kds.missing':'{n} cups still not done', 'kds.claimed':'Claimed',
    'kds.waited':'waiting {n} min', 'kds.allDone':'All done — call the customer',
    'kds.reprint':'Reprint labels', 'kds.readyHint':'Please collect', 'kds.order':'Order',

    'admin.title':'Dashboard', 'admin.overview':'Overview', 'admin.orders':'Orders',
    'admin.stock':'Inventory', 'admin.members':'Members', 'admin.settings':'Settings',
    'admin.revenue':'Revenue (incl. tax)', 'admin.net':'Net revenue', 'admin.sst':'SST payable',
    'admin.gross':'Gross profit', 'admin.margin':'Margin', 'admin.ordersN':'Orders',
    'admin.cups':'Cups', 'admin.ticket':'Avg. ticket', 'admin.disc':'Discounts',
    'admin.trend':'Revenue · last 7 days', 'admin.top':'Top sellers', 'admin.byQty':'by cups', 'admin.payMix':'Payment mix',
    'admin.channel':'Channels', 'admin.none':'No data', 'admin.walkin':'Walk-in',
    'admin.low':'Low stock', 'admin.waste':'Log waste', 'admin.ingredient':'Ingredient',
    'admin.stockQty':'On hand', 'admin.minQty':'Min', 'admin.unitCost':'Unit cost',
    'admin.value':'Value', 'admin.audit':'Audit log', 'admin.void':'Void',
    'admin.voided':'Voided', 'admin.memberSpend':'Lifetime spend', 'admin.tier':'Tier',
    'admin.points':'Points', 'admin.balance':'Credit', 'admin.topup':'Top up',
    'admin.joinAt':'Joined', 'admin.phone':'Phone', 'admin.name':'Name',
    'admin.noName':'No name', 'admin.orderNo':'Order', 'admin.time':'Time',
    'admin.amount':'Amount', 'admin.status':'Status', 'admin.action':'Action',
    'admin.reason':'Reason', 'admin.today':'Today', 'admin.week':'Last 7 days',

    'st.pending':'Pending', 'st.paid':'Paid', 'st.preparing':'Making',
    'st.ready':'Ready', 'st.completed':'Completed', 'st.void':'Voided',

    'stg.shop':'Store', 'stg.tax':'Tax rate', 'stg.priceMode':'Price mode',
    'stg.inclusive':'Tax inclusive (SST absorbed)', 'stg.sstNo':'SST registration no.',
    'stg.print':'Print labels on', 'stg.onClaim':'Claim', 'stg.onPay':'Payment',
    'stg.reset':'Reset demo data', 'stg.resetHint':'Clears orders, stock movements and member changes.',
    'stg.lang':'Interface language', 'stg.demo':'Demo parameters', 'stg.version':'Version',

    'waste.title':'Log waste', 'waste.hint':'Waste is tracked separately from revenue, for theoretical vs actual usage variance.',
    'waste.qty':'Quantity', 'waste.reason':'Reason',
    'waste.reasons':'Spillage|Expired|Staff tasting|Staff meal|Equipment|Other',
    'waste.submit':'Confirm', 'waste.done':'Waste logged',

    'topup.title':'Top up', 'topup.amount':'Amount', 'topup.bonus':'Bonus',
    'topup.bonusHint':'Top up 100, get 10 free (bonus is non-refundable)',
    'topup.submit':'Confirm', 'topup.done':'Top up successful',

    'void.title':'Void order', 'void.hint':'Voiding rolls back stock and points, and is written to the audit log.',
    'void.reason':'Reason', 'void.confirm':'Void order', 'void.done':'Order voided',

    'help.title':'Simulated service flow', 'help.sub':'Six steps make one complete order cycle',
    'help.s1':'Customer orders: size / sugar / ice / toppings',
    'help.s2':'Staff confirms the order, cart is ready to charge',
    'help.s3':'Take payment: cash with change, or DuitNow (simulated callback)',
    'help.s4':'On success: customer receipt + one cup label per cup, stock deducted, points earned',
    'help.s5':'Barista claims the ticket; can only finish when every cup is done',
    'help.s6':'Call the number for pickup, then mark as picked up',
    'help.go':'Start',

    'toast.added':'Added to cart', 'toast.removed':'Removed', 'toast.cleared':'Cart cleared',
    'toast.paid':'Payment received — ticket sent to kitchen', 'toast.member':'Member found',
    'toast.registered':'Member registered', 'toast.couponOk':'Coupon applied',
    'toast.couponFail':'Coupon not applicable', 'toast.noMember':'Select a member first',
    'toast.claimed':'Claimed — labels printed', 'toast.finished':'Done — customer called',
    'toast.called':'Calling', 'toast.picked':'Picked up — order completed',
    'toast.labels':'Labels sent', 'toast.printed':'Sent to printer',
    'toast.lowStock':'Warning: {n} ingredients below minimum',
    'toast.reset':'Demo data reset', 'toast.voided':'Voided and stock rolled back',
    'toast.waste':'Waste logged', 'toast.topup':'Top up successful',
    'toast.labelPrinted':'Labels printed', 'toast.saved':'Saved',
    'toast.jsError':'Script error — please refresh'
  };

  let lang = 'zh';

  const api = {
    dict: { zh, en },
    get lang(){ return lang; },
    setLang(l){ lang = (l === 'en' ? 'en' : 'zh'); },
    t(key, vars){
      let s = (api.dict[lang] && api.dict[lang][key]) || (zh[key]) || key;
      if (vars) Object.keys(vars).forEach(k => { s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]); });
      return s;
    },
    // 数据字段双语：优先当前语言
    n(obj){
      if (!obj) return '';
      return (lang === 'en' ? (obj.nameEn || obj.nameZh) : (obj.nameZh || obj.nameEn)) || '';
    },
    // 分类名（数据里只有中文，查表翻译）
    cat(name){
      const d = api.dict[lang] || {};
      return d['cat.' + name] || name;
    },
    // 小票始终双语并排
    both(obj){
      if (!obj) return { a:'', b:'' };
      return { a: obj.nameZh || obj.nameEn || '', b: obj.nameEn || '' };
    }
  };
  return api;
})();
