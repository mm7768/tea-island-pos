/* =========================================================
   茶屿 TEA ISLAND — 种子数据
   金额一律用「分」存储（整数），仅原料单位成本保留小数。
   ========================================================= */
window.SEED = (function () {
  'use strict';

  /* ---------------- 库存原料 ---------------- */
  const ingredients = [
    { id:'tea_black',  nameZh:'锡兰红茶',   nameEn:'Ceylon Black Tea',  unit:'g',  cost:0.120, stock:5200, min:1200, cat:'茶叶' },
    { id:'tea_green',  nameZh:'茉莉绿茶',   nameEn:'Jasmine Green Tea', unit:'g',  cost:0.150, stock:3100, min:900,  cat:'茶叶' },
    { id:'tea_oolong', nameZh:'四季春乌龙', nameEn:'Four Seasons Oolong',unit:'g', cost:0.180, stock:2450, min:600,  cat:'茶叶' },
    { id:'coffee',     nameZh:'意式咖啡豆', nameEn:'Espresso Beans',    unit:'g',  cost:0.080, stock:1750, min:400,  cat:'茶叶' },
    { id:'milk',       nameZh:'鲜牛奶',     nameEn:'Fresh Milk',        unit:'ml', cost:0.008, stock:22400,min:6000, cat:'乳品' },
    { id:'creamer',    nameZh:'植脂末',     nameEn:'Non-dairy Creamer', unit:'g',  cost:0.020, stock:4600, min:1500, cat:'乳品' },
    { id:'coconut',    nameZh:'生椰乳',     nameEn:'Coconut Milk',      unit:'ml', cost:0.020, stock:5400, min:1500, cat:'乳品' },
    { id:'fructose',   nameZh:'果糖',       nameEn:'Fructose Syrup',    unit:'ml', cost:0.010, stock:8800, min:2000, cat:'风味' },
    { id:'brownsugar', nameZh:'黑糖浆',     nameEn:'Brown Sugar Syrup', unit:'ml', cost:0.030, stock:2600, min:800,  cat:'风味' },
    { id:'passion',    nameZh:'百香果酱',   nameEn:'Passion Fruit Jam', unit:'ml', cost:0.050, stock:1900, min:500,  cat:'风味' },
    { id:'grapefruit', nameZh:'葡萄柚汁',   nameEn:'Grapefruit Juice',  unit:'ml', cost:0.060, stock:1400, min:500,  cat:'风味' },
    { id:'mango',      nameZh:'芒果果泥',   nameEn:'Mango Puree',       unit:'g',  cost:0.050, stock:2200, min:600,  cat:'风味' },
    { id:'lemon',      nameZh:'鲜柠檬',     nameEn:'Fresh Lemon',       unit:'个', cost:1.500, stock:9,    min:15,   cat:'风味' },
    { id:'taro',       nameZh:'芋泥',       nameEn:'Taro Paste',        unit:'g',  cost:0.040, stock:2600, min:800,  cat:'风味' },
    { id:'boba',       nameZh:'珍珠',       nameEn:'Tapioca Pearls',    unit:'g',  cost:0.020, stock:7200, min:2000, cat:'小料' },
    { id:'jelly',      nameZh:'椰果',       nameEn:'Nata de Coco',      unit:'g',  cost:0.030, stock:2600, min:800,  cat:'小料' },
    { id:'taroball',   nameZh:'芋圆',       nameEn:'Taro Balls',        unit:'g',  cost:0.040, stock:1750, min:600,  cat:'小料' },
    { id:'pudding',    nameZh:'布丁',       nameEn:'Pudding',           unit:'份', cost:1.200, stock:22,   min:30,   cat:'小料' },
    { id:'grass',      nameZh:'仙草',       nameEn:'Grass Jelly',       unit:'g',  cost:0.020, stock:2100, min:600,  cat:'小料' },
    { id:'foam',       nameZh:'芝士奶盖',   nameEn:'Cheese Foam',       unit:'份', cost:1.500, stock:18,   min:25,   cat:'小料' },
    { id:'oat',        nameZh:'燕麦',       nameEn:'Oat',               unit:'g',  cost:0.030, stock:1800, min:500,  cat:'小料' },
    { id:'cup_m',      nameZh:'中杯 16oz',  nameEn:'Cup 16oz',          unit:'个', cost:0.320, stock:1480, min:400,  cat:'包材' },
    { id:'cup_l',      nameZh:'大杯 22oz',  nameEn:'Cup 22oz',          unit:'个', cost:0.380, stock:960,  min:300,  cat:'包材' },
    { id:'lid',        nameZh:'杯盖',       nameEn:'Lid',               unit:'个', cost:0.090, stock:2300, min:600,  cat:'包材' },
    { id:'straw',      nameZh:'吸管',       nameEn:'Straw',             unit:'支', cost:0.050, stock:2400, min:600,  cat:'包材' },
    { id:'bag',        nameZh:'打包袋',     nameEn:'Carrier Bag',       unit:'个', cost:0.180, stock:640,  min:200,  cat:'包材' },
    { id:'label',      nameZh:'杯贴标签 50×40', nameEn:'Cup Label 50×40', unit:'张', cost:0.095, stock:1200, min:300, cat:'包材' }
  ];

  /* ---------------- 客制化选项 ---------------- */
  const optionGroups = [
    {
      id:'size', nameZh:'杯型', nameEn:'Size', required:true, type:'single',
      options:[
        { id:'sz_m', nameZh:'中杯', nameEn:'Medium', sub:'16oz', priceSen:0 },
        { id:'sz_l', nameZh:'大杯', nameEn:'Large',  sub:'22oz', priceSen:200 }
      ]
    },
    {
      id:'sugar', nameZh:'糖度', nameEn:'Sugar', required:true, type:'single',
      options:[
        { id:'sug_0',   nameZh:'无糖',   nameEn:'No Sugar',  sub:'0%' },
        { id:'sug_30',  nameZh:'三分糖', nameEn:'30% Sugar', sub:'30%' },
        { id:'sug_50',  nameZh:'半糖',   nameEn:'Half Sugar',sub:'50%' },
        { id:'sug_70',  nameZh:'七分糖', nameEn:'70% Sugar', sub:'70%' },
        { id:'sug_100', nameZh:'全糖',   nameEn:'Full Sugar',sub:'100%' }
      ]
    },
    {
      id:'ice', nameZh:'冰量', nameEn:'Ice', required:true, type:'single',
      options:[
        { id:'ice_n', nameZh:'正常冰', nameEn:'Regular Ice' },
        { id:'ice_l', nameZh:'少冰',   nameEn:'Less Ice' },
        { id:'ice_m', nameZh:'微冰',   nameEn:'Light Ice' },
        { id:'ice_0', nameZh:'去冰',   nameEn:'No Ice' },
        { id:'ice_h', nameZh:'热饮',   nameEn:'Hot' }
      ]
    },
    {
      id:'topping', nameZh:'加料', nameEn:'Toppings', type:'multi', max:3,
      options:[
        { id:'tp_boba',    nameZh:'珍珠',   nameEn:'Pearl',       priceSen:150, use:{ boba:60 } },
        { id:'tp_jelly',   nameZh:'椰果',   nameEn:'Nata',        priceSen:150, use:{ jelly:50 } },
        { id:'tp_taro',    nameZh:'芋圆',   nameEn:'Taro Ball',   priceSen:200, use:{ taroball:50 } },
        { id:'tp_pudding', nameZh:'布丁',   nameEn:'Pudding',     priceSen:200, use:{ pudding:1 } },
        { id:'tp_grass',   nameZh:'仙草',   nameEn:'Grass Jelly', priceSen:150, use:{ grass:50 } },
        { id:'tp_foam',    nameZh:'奶盖',   nameEn:'Cheese Foam', priceSen:250, use:{ foam:1 } },
        { id:'tp_oat',     nameZh:'燕麦',   nameEn:'Oat',         priceSen:200, use:{ oat:40 } }
      ]
    }
  ];

  /* ---------------- 商品（配方为「中杯」标准用量） ---------------- */
  const products = [
    { id:'p_signature', cat:'招牌奶茶', nameZh:'招牌珍珠奶茶', nameEn:'Signature Pearl Milk Tea', priceSen:990,  emoji:'🧋', tag:'销冠', color:'#C9A227',
      recipe:[ {id:'tea_black',qty:8}, {id:'creamer',qty:25}, {id:'fructose',qty:20}, {id:'boba',qty:60,scale:false} ] },
    { id:'p_brownsugar', cat:'招牌奶茶', nameZh:'黑糖波霸鲜奶', nameEn:'Brown Sugar Boba Fresh Milk', priceSen:1190, emoji:'🥛', tag:'推荐', color:'#8C5A3B',
      recipe:[ {id:'milk',qty:200}, {id:'brownsugar',qty:25}, {id:'boba',qty:80,scale:false} ] },
    { id:'p_taro', cat:'招牌奶茶', nameZh:'芋泥啵啵奶茶', nameEn:'Taro Bobo Milk Tea', priceSen:1290, emoji:'🍠', tag:'', color:'#9B7BB5',
      recipe:[ {id:'tea_black',qty:6}, {id:'milk',qty:100}, {id:'taro',qty:40}, {id:'taroball',qty:50,scale:false}, {id:'fructose',qty:15} ] },
    { id:'p_pudding', cat:'招牌奶茶', nameZh:'布丁奶茶', nameEn:'Pudding Milk Tea', priceSen:1090, emoji:'🍮', tag:'', color:'#D9A441',
      recipe:[ {id:'tea_black',qty:8}, {id:'creamer',qty:25}, {id:'pudding',qty:1,scale:false}, {id:'fructose',qty:15} ] },
    { id:'p_jasmine', cat:'纯茶', nameZh:'茉莉绿茶', nameEn:'Jasmine Green Tea', priceSen:690, emoji:'🍃', tag:'', color:'#7C9A6D',
      recipe:[ {id:'tea_green',qty:6}, {id:'fructose',qty:15} ] },
    { id:'p_oolong', cat:'纯茶', nameZh:'四季春乌龙', nameEn:'Four Seasons Oolong', priceSen:790, emoji:'🍵', tag:'', color:'#6E8B5B',
      recipe:[ {id:'tea_oolong',qty:7}, {id:'fructose',qty:10} ] },
    { id:'p_passion', cat:'水果茶', nameZh:'满杯百香果', nameEn:'Passion Fruit Tea', priceSen:1090, emoji:'🥭', tag:'人气', color:'#E8A33D',
      recipe:[ {id:'tea_green',qty:6}, {id:'passion',qty:60}, {id:'fructose',qty:10} ] },
    { id:'p_grapefruit', cat:'水果茶', nameZh:'葡萄柚绿茶', nameEn:'Grapefruit Green Tea', priceSen:1190, emoji:'🍊', tag:'', color:'#D96C5F',
      recipe:[ {id:'tea_green',qty:6}, {id:'grapefruit',qty:80}, {id:'fructose',qty:10} ] },
    { id:'p_mango', cat:'水果茶', nameZh:'芒果椰椰冰沙', nameEn:'Mango Coconut Smoothie', priceSen:1390, emoji:'🍧', tag:'新品', color:'#E4B03A',
      recipe:[ {id:'mango',qty:120}, {id:'coconut',qty:60}, {id:'fructose',qty:10} ] },
    { id:'p_lemon', cat:'水果茶', nameZh:'柠檬红茶', nameEn:'Lemon Black Tea', priceSen:890, emoji:'🍋', tag:'', color:'#C7B23A',
      recipe:[ {id:'tea_black',qty:8}, {id:'lemon',qty:0.5,scale:false}, {id:'fructose',qty:20} ] },
    { id:'p_coconut', cat:'咖啡', nameZh:'生椰拿铁', nameEn:'Coconut Latte', priceSen:1290, emoji:'☕', tag:'', color:'#A0765A',
      recipe:[ {id:'coffee',qty:18,scale:false}, {id:'coconut',qty:150} ] },
    { id:'p_americano', cat:'咖啡', nameZh:'冰美式', nameEn:'Iced Americano', priceSen:890, emoji:'🧊', tag:'', color:'#6B4F3A',
      recipe:[ {id:'coffee',qty:18,scale:false} ] }
  ];

  /* ---------------- 会员等级 ---------------- */
  const tiers = [
    { id:'t0', nameZh:'普通会员', nameEn:'Member',  minSpentSen:0,      pointsRate:1,   discount:0,    color:'#8A7C6F' },
    { id:'t1', nameZh:'银卡',     nameEn:'Silver',  minSpentSen:50000,  pointsRate:1.2, discount:0.02, color:'#8E9BA8' },
    { id:'t2', nameZh:'金卡',     nameEn:'Gold',    minSpentSen:150000, pointsRate:1.5, discount:0.05, color:'#C9A227' },
    { id:'t3', nameZh:'黑卡',     nameEn:'Black',   minSpentSen:300000, pointsRate:2,   discount:0.08, color:'#3B2E28' }
  ];

  /* ---------------- 会员（手机号已归一化 +60） ---------------- */
  const members = [
    { id:'M001', name:'陈美玲', phone:'+60123456789', tierId:'t2', points:1280, balanceSen:8800,  totalSpentSen:186040, joinedAt:'2025-03-14' },
    { id:'M002', name:'林志豪', phone:'+60112233445', tierId:'t1', points:540,  balanceSen:0,     totalSpentSen:72020,  joinedAt:'2025-06-02' },
    { id:'M003', name:'Siti Nurhaliza', phone:'+60198877665', tierId:'t3', points:3210, balanceSen:20000, totalSpentSen:421090, joinedAt:'2024-11-20' },
    { id:'M004', name:'王小明', phone:'+60169988776', tierId:'t0', points:120,  balanceSen:0,     totalSpentSen:26850,  joinedAt:'2025-09-08' },
    { id:'M005', name:'黄丽婷', phone:'+60175566332', tierId:'t1', points:660,  balanceSen:5000,  totalSpentSen:90500,  joinedAt:'2025-05-22' }
  ];

  /* ---------------- 优惠券 ---------------- */
  const coupons = [
    { id:'cp_new5',   code:'WELCOME5', nameZh:'新客立减 RM5', nameEn:'New Member RM5 Off', type:'amount',  value:5,  minSpendSen:2000, memberId:'M004', used:false, expiresAt:'2026-12-31' },
    { id:'cp_milk10', code:'MILK10',   nameZh:'会员 9 折',    nameEn:'Member 10% Off',     type:'percent', value:10, maxDiscountSen:800, minSpendSen:2500, memberId:'M001', used:false, expiresAt:'2026-12-31' },
    { id:'cp_bday8',  code:'BDAY8',    nameZh:'生日礼 RM8',   nameEn:'Birthday RM8 Off',   type:'amount',  value:8,  minSpendSen:3000, memberId:'M003', used:false, expiresAt:'2026-12-31' },
    { id:'cp_pub3',   code:'TEA3',     nameZh:'无门槛 RM3',   nameEn:'RM3 Off Any Order',  type:'amount',  value:3,  minSpendSen:0,    memberId:null,   used:false, expiresAt:'2026-12-31' }
  ];

  /* ---------------- 门店与参数 ---------------- */
  const store = {
    id:'S1',
    nameZh:'茶屿 TEA ISLAND',
    nameEn:'TEA ISLAND',
    addrZh:'No. 12, Jalan SS15/4, 47500 Subang Jaya, Selangor',
    addrEn:'No. 12, Jalan SS15/4, 47500 Subang Jaya, Selangor',
    phone:'03-5621 8890',
    sstNo:'W10-1808-32000123',
    priceMode:'inclusive',   // 标价含税
    taxRate:0.06,
    serviceRate:0,
    defaultLang:'zh'
  };

  const settings = {
    pointsPerRinggit:1,      // 每 RM1 得 1 分
    pointValueSen:5,         // 1 分 = RM0.05（100 分抵 RM5）
    maxRedeemRatio:0.5,      // 积分最多抵一半
    largeScale:1.3,          // 大杯原料系数
    labelPrintOn:'claim'     // 'pay' | 'claim'
  };

  return { ingredients, optionGroups, products, tiers, members, coupons, store, settings };
})();
