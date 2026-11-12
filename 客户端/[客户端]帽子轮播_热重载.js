'use strict';
// [客户端]饰品部位轮播 —— 热重载版 v2
//
// 目标（方案B：经 Server RPC 上传，全员可见）：对局中每 INTERVAL_MS 把选定的饰品部位各换成清单里的下一件。
//   触发条件：当前为空手(拳头)且该物品 bEquipped==0（已收手放下）时才轮播。
//   六个部位各自独立开关；关闭的部位保留玩家原有该部位饰品不动。
//   链路：hook APlayerController::TickActor(游戏线程节拍源) → 读当前角色 EquippedCosmeticItems
//        → 对"开启且有可用项"的部位：剔除该类旧项、追加下一件 → 组 TArray<FEquippedPlayerCosmetics>
//        → ADH_PlayerController::SetEquippedCosmetics(Server RPC) 上传 → 服务器权威复制 → 全员 OnRep 重建外观。
//
// 部位→饰品清单直接取自蓝图导出 Characters/Customization（按文件夹归类，一件只归一个主部位）：
//   HEAD帽子 / FOREHEAD面具 / EYES眼镜 / EARS耳饰 / MOUTH烟具 / HANDS戒指。
//   运行时 StaticFindObject 命中已加载项，否则 StaticLoadObject 触发加载（未拥有/未加载也可切）。
//   注：OnRep 会剔除 bReleased==false 或各端解析不到的项，故只对"已发布正式内容"生效。
//
// 线程约束：StaticLoadObject/ProcessEvent 只能在游戏主线程调用，故不用 setInterval，
//   改在 TickActor 的 onEnter 内 Date.now 节流，并在首次 onEnter 懒加载解析饰品。
//
// 偏移：结构字段两端一致；函数偏移两端不同，客户端值见下（已填）。

var MODULE = 'DreadHunger-Win64-Shipping.exe';
var BUILD_TAG = 'slotcycle_v3';

var Switch = 1;         // 总开关
var INTERVAL_MS = 1000; // 轮播间隔（每秒）；负担大，可先设 2000~3000 试水

// 拳头物品类路径：用于“仅空手(拳头)才轮播”判定（与陀螺同款判据）
var FISTS_PATH = '/Game/Blueprints/Inventory/Fists/BP_Fists_Inventory.BP_Fists_Inventory_C';

// ====== 部位轮播开关（1=该部位参与轮播，0=保留原样不动）======
// 每个部位的候选清单见下方 PATHS；on 在此控制
var SLOT_ON = {
    HEAD:     0, // 帽子
    FOREHEAD: 1, // 面具
    EYES:     0, // 眼镜
    EARS:     0, // 耳饰
    MOUTH:    0, // 烟具
    HANDS:    0  // 戒指
};

// ====== 各部位饰品清单（蓝图长对象路径 /Game/...）======
var PATHS = {
    HEAD: [
        '/Game/Characters/Customization/Hats/CI_Hat_Rat.CI_Hat_Rat',
        '/Game/Characters/Customization/Hats/CI_SantaHat.CI_SantaHat',
        '/Game/Characters/Customization/Hats/Captain/CI_Hat_PlainBicorne.CI_Hat_PlainBicorne',
        '/Game/Characters/Customization/Hats/Captain/CI_Hat_AdmiralsBicorne.CI_Hat_AdmiralsBicorne',
        '/Game/Characters/Customization/Hats/Captain/CI_Wig_A.CI_Wig_A',
        '/Game/Characters/Customization/Hats/Captain/CI_Wig_B.CI_Wig_B',
        '/Game/Characters/Customization/Hats/Captain/CI_Wig_C.CI_Wig_C',
        '/Game/Characters/Customization/Hats/Chaplain/CI_Hat_CappelloRomano.CI_Hat_CappelloRomano',
        '/Game/Characters/Customization/Hats/Chef/CI_Hat_Chef_Short.CI_Hat_Chef_Short',
        '/Game/Characters/Customization/Hats/Engineer/CI_Hat_MinersHelmet.CI_Hat_MinersHelmet',
        '/Game/Characters/Customization/Hats/Engineer/CI_Hat_PaddyCap.CI_Hat_PaddyCap',
        '/Game/Characters/Customization/Hats/Engineer/CI_Hat_Tricorne.CI_Hat_Tricorne',
        '/Game/Characters/Customization/Hats/Engineer/CI_Hat_Twill.CI_Hat_Twill',
        '/Game/Characters/Customization/Hats/Hunter/CI_Hat_Fur_A.CI_Hat_Fur_A',
        '/Game/Characters/Customization/Hats/Hunter/CI_Hat_Fur_B.CI_Hat_Fur_B',
        '/Game/Characters/Customization/Hats/Marine/CI_Hat_Boater.CI_Hat_Boater',
        '/Game/Characters/Customization/Hats/Marine/CI_Hat_RoyalTricorne.CI_Hat_RoyalTricorne',
        '/Game/Characters/Customization/Hats/Marine/CI_Hat_ShakoCap.CI_Hat_ShakoCap',
        '/Game/Characters/Customization/Hats/Marine/CI_Hat_UniversalPatternHelmet.CI_Hat_UniversalPatternHelmet',
        '/Game/Characters/Customization/Hats/Navigator/CI_Hat_CordedMarinerCap.CI_Hat_CordedMarinerCap',
        '/Game/Characters/Customization/Hats/Navigator/CI_Hat_MarinerCap.CI_Hat_MarinerCap',
        '/Game/Characters/Customization/Hats/Navigator/CI_Hat_OfficersCap.CI_Hat_OfficersCap'
    ],
    FOREHEAD: [
        '/Game/Characters/Customization/Masks/CI_Mask_Bauta.CI_Mask_Bauta',
        '/Game/Characters/Customization/Masks/CI_Mask_Beak.CI_Mask_Beak',
        '/Game/Characters/Customization/Masks/CI_Mask_Bunny.CI_Mask_Bunny',
        '/Game/Characters/Customization/Masks/CI_Mask_Devil.CI_Mask_Devil',
        '/Game/Characters/Customization/Masks/CI_Mask_Janus.CI_Mask_Janus',
        '/Game/Characters/Customization/Masks/CI_Mask_Owl.CI_Mask_Owl',
        '/Game/Characters/Customization/Masks/CI_Mask_Phantom.CI_Mask_Phantom',
        '/Game/Characters/Customization/Masks/CI_Mask_Plague.CI_Mask_Plague',
        '/Game/Characters/Customization/Masks/CI_Mask_Wolf.CI_Mask_Wolf'
    ],
    EYES: [
        '/Game/Characters/Customization/Eyewear/CI_Goggles_Bone.CI_Goggles_Bone',
        '/Game/Characters/Customization/Eyewear/CI_Goggles_Snow.CI_Goggles_Snow',
        '/Game/Characters/Customization/Eyewear/CI_Spectacles_HalfRound.CI_Spectacles_HalfRound',
        '/Game/Characters/Customization/Eyewear/CI_Spectacles_Rectangular.CI_Spectacles_Rectangular',
        '/Game/Characters/Customization/Eyewear/CI_Spectacles_Round.CI_Spectacles_Round',
        '/Game/Characters/Customization/Eyewear/CI_Spectacles_Snow.CI_Spectacles_Snow'
    ],
    EARS: [
        '/Game/Characters/Customization/Earrings/CI_BoneEarrings.CI_BoneEarrings'
    ],
    MOUTH: [
        '/Game/Characters/Customization/SmokingGear/CI_Pipe_Bone_A.CI_Pipe_Bone_A',
        '/Game/Characters/Customization/SmokingGear/CI_Pipe_Bone_B.CI_Pipe_Bone_B',
        '/Game/Characters/Customization/SmokingGear/CI_Pipe_Bone_C.CI_Pipe_Bone_C',
        '/Game/Characters/Customization/SmokingGear/CI_Pipe_Corncob.CI_Pipe_Corncob',
        '/Game/Characters/Customization/SmokingGear/CI_Pipe_Horn.CI_Pipe_Horn',
        '/Game/Characters/Customization/SmokingGear/CI_Pipe_Straight.CI_Pipe_Straight'
    ],
    HANDS: [
        '/Game/Characters/Customization/Rings/CI_Ring_Bone_A.CI_Ring_Bone_A',
        '/Game/Characters/Customization/Rings/CI_Ring_Bone_B.CI_Ring_Bone_B',
        '/Game/Characters/Customization/Rings/CI_Ring_Bone_C.CI_Ring_Bone_C',
        '/Game/Characters/Customization/Rings/CI_Ring_Ruby.CI_Ring_Ruby',
        '/Game/Characters/Customization/Rings/CI_Ring_ShellCameoLady.CI_Ring_ShellCameoLady',
        '/Game/Characters/Customization/Rings/CI_Ring_Skeleton.CI_Ring_Skeleton'
    ]
};

var OFF = {
    SetEquippedCosmetics: 0xF5F930, // 客户端 RVA（发 Server RPC 的 thunk）
    TickActor:            0x2B78A50, // 客户端 RVA（APlayerController::TickActor，节拍源）
    INV_B_EQUIPPED:       0x530, // ADH_Inventory::bEquipped（1=举起，0=收手放下）
    StaticFindObject:     0x13F44D0,
    StaticLoadObject:     0x13F4CC0,
    // 本地玩家链
    LP_Global: 0x4C70908, LP_H1: 0x0, LP_H2: 0x20, CH_Controller: 0xA08,
    // 结构字段（两端一致）
    CTL_DhPlayerState:    0x658,
    PS_SelectedRole:      0x590, ROLE_Type: 0x58,
    PS_EquippedCosmetics: 0x5F0,
    EC_ITEMS_DATA: 0x0, EC_ITEMS_NUM: 0x8, EC_ROLE: 0x10, EC_SIZE: 24,
    // 空手(拳头)判定链（字段两端一致，IDA 确认）
    CTL_Pawn:             0x250,  // AController::Pawn (APawn*) -> ADH_HumanCharacter
    CH_InventoryManager:  0x808,  // ADH_HumanCharacter::InventoryComponent -> UDH_InventoryManager
    IM_SelectedInventory: 0xF8,   // UDH_InventoryManager::SelectedInventory -> ADH_Inventory
    UObject_ClassPrivate: 0x10    // UObject::ClassPrivate
};

// ====== 运行时状态 ======
var rt = {
    base: null, reg: null,
    fnSetCosmetics: null, fnFind: null, fnLoad: null,
    slots: null,       // { NAME: {on, resolved:[ptr], idx} }
    catOf: null,       // { ptrString: SLOTNAME }  用于识别某指针属于哪个部位
    lastAt: 0, _ready: false, _errOnce: {}, fistsClass: null, fistTries: 0
};

// ====== 日志 ======
function logLine(tag, m) { try { var f = new File('output.log', 'a'); f.write('[SlotCycle|' + BUILD_TAG + '|' + tag + '] ' + m + '\n'); f.close(); } catch (e) {} }
function logError(m) { logLine('ERROR', m); }
function errOnce(k, m) { if (!rt._errOnce[k]) { rt._errOnce[k] = true; logError(m); } }

// ====== 指针安全 ======
var PTR_MAX = ptr('0x7FFFFFFFFFFFF');
function good(p) { return p !== null && !p.isNull() && p.compare(PTR_MAX) <= 0; }
function readPtr(a) { try { var p = a.readPointer(); return good(p) ? p : null; } catch (e) { return null; } }
function readU8(a) { try { return a.readU8(); } catch (e) { return -1; } }
function readU32(a) { try { return a.readU32(); } catch (e) { return -1; } }

function localController() {
    if (rt.base === null) return null;
    var a = readPtr(rt.base.add(OFF.LP_Global));       if (a === null) return null;
    var b = readPtr(a.add(OFF.LP_H1));                 if (b === null) return null;
    var ch = readPtr(b.add(OFF.LP_H2));                if (ch === null) return null;
    return readPtr(ch.add(OFF.CH_Controller));
}

// 懒解析拳头类（游戏线程调用；只取返回指针，安全）。失败限次。
function resolveFistsClass() {
    if (rt.fistTries >= 3 || rt.fnFind === null) return;
    rt.fistTries++;
    try {
        var ansi = Memory.allocUtf8String(FISTS_PATH);
        var p = rt.fnFind(ptr(0), ptr(0), ansi, 0);
        if (good(p)) { rt.fistsClass = p; return; }
        var w = Memory.allocUtf16String(FISTS_PATH);
        p = rt.fnLoad(ptr(0), ptr(0), w, ptr(0), 0, ptr(0), 0, ptr(0));
        if (good(p)) rt.fistsClass = p;
    } catch (e) { errOnce('fists', 'resolveFistsClass 失败: ' + e); }
}

// 当前本地玩家是否空手(拳头)：SelectedInventory 的类 == 拳头类
function isHoldingFists(controller) {
    if (rt.fistsClass === null) { resolveFistsClass(); if (rt.fistsClass === null) return false; }
    var pawn = readPtr(controller.add(OFF.CTL_Pawn));            if (pawn === null) return false;
    var invMgr = readPtr(pawn.add(OFF.CH_InventoryManager));     if (invMgr === null) return false;
    var inv = readPtr(invMgr.add(OFF.IM_SelectedInventory));     if (inv === null) return false;
    var invClass = readPtr(inv.add(OFF.UObject_ClassPrivate));   if (invClass === null) return false;
    if (!invClass.equals(rt.fistsClass)) return false;
    // 收手放下状态：bEquipped == 0；举起(1)时不轮播
    return readU8(inv.add(OFF.INV_B_EQUIPPED)) === 0;
}

function resolveObject(longPath) {
    try {
        var ansi = Memory.allocUtf8String(longPath);
        var p = rt.fnFind(ptr(0), ptr(0), ansi, 0);
        if (good(p)) return p;
        var w = Memory.allocUtf16String(longPath);
        p = rt.fnLoad(ptr(0), ptr(0), w, ptr(0), 0, ptr(0), 0, ptr(0));
        return good(p) ? p : null;
    } catch (e) { errOnce('resolve', 'resolveObject 失败: ' + e); return null; }
}

function buildSlots() {
    rt.slots = {}; rt.catOf = {};
    var totalOk = 0;
    for (var name in PATHS) {
        var resolved = [];
        for (var i = 0; i < PATHS[name].length; i++) {
            var o = resolveObject(PATHS[name][i]);
            if (o !== null) { resolved.push(o); rt.catOf[o.toString()] = name; }
        }
        rt.slots[name] = { on: SLOT_ON[name] ? 1 : 0, resolved: resolved, idx: 0 };
        totalOk += resolved.length;
    }
    return totalOk > 0;
}

// 组装并上传：保留关闭部位原样，对开启部位各换下一件
function doUpload(controller) {
    var PS = readPtr(controller.add(OFF.CTL_DhPlayerState));   if (PS === null) return;
    var sel = readPtr(PS.add(OFF.PS_SelectedRole));            if (sel === null) return;
    var roleNum = readU8(sel.add(OFF.ROLE_Type));              if (roleNum === -1) return;

    // 读当前角色已装备 items
    var oarr = PS.add(OFF.PS_EquippedCosmetics);
    var odata = readPtr(oarr), onum = readU32(oarr.add(8));
    var itemsData = null, itemsNum = 0;
    if (odata !== null && onum > 0) {
        for (var i = 0; i < onum; i++) {
            var e = odata.add(OFF.EC_SIZE * i);
            if (readU8(e.add(OFF.EC_ROLE)) === roleNum) {
                itemsData = readPtr(e.add(OFF.EC_ITEMS_DATA));
                itemsNum = readU32(e.add(OFF.EC_ITEMS_NUM));
                break;
            }
        }
    }

    // 1) 保留：当前项里，属于"关闭部位"或"我们无法识别"的，原样保留；开启部位的旧项丢弃
    var out = [];
    if (itemsData !== null && itemsNum > 0) {
        for (var j = 0; j < itemsNum; j++) {
            var ip = readPtr(itemsData.add(8 * j));
            if (ip === null) continue;
            var slotName = rt.catOf[ip.toString()];
            if (slotName !== undefined && rt.slots[slotName].on) continue; // 开启部位 → 丢弃(下面重加)
            out.push(ip);
        }
    }

    // 2) 对每个开启且有可用项的部位：前进一格并追加
    var changed = 0;
    for (var name in rt.slots) {
        var c = rt.slots[name];
        if (!c.on || c.resolved.length === 0) continue;
        c.idx = (c.idx + 1) % c.resolved.length;
        out.push(c.resolved[c.idx]);
        changed++;
    }
    if (changed === 0) return; // 没有开启部位需要更新

    // 3) 组 RPC 参数：单条 FEquippedPlayerCosmetics(role=roleNum, items=out)
    var n = out.length;
    var innerData = Memory.alloc(8 * n);
    for (var k = 0; k < n; k++) innerData.add(8 * k).writePointer(out[k]);

    var elem = Memory.alloc(OFF.EC_SIZE);
    elem.add(OFF.EC_ITEMS_DATA).writePointer(innerData);
    elem.add(OFF.EC_ITEMS_NUM).writeU32(n);
    elem.add(0xC).writeU32(n);
    elem.add(OFF.EC_ROLE).writeU8(roleNum);

    var outer = Memory.alloc(16);
    outer.add(0).writePointer(elem);
    outer.add(8).writeU32(1);
    outer.add(12).writeU32(1);

    rt.fnSetCosmetics(controller, outer); // 同步调用，返回后上述分配可回收
}

function onTick(args) {
    try {
        var controller = args[0];
        if (controller === null || controller.isNull()) return;
        var lc = localController();
        if (lc === null) return;
        if (!controller.equals(lc)) return;              // 非本地控制器
        var now = Date.now();
        if (now - rt.lastAt < INTERVAL_MS) return;        // 未到间隔
        if (!isHoldingFists(controller)) return;          // 非空手(拳头) → 本次不执行也不计时(切回拳头即恢复)
        rt.lastAt = now;
        doUpload(controller);
    } catch (e) { errOnce('tick', 'onTick 异常: ' + e); }
}

function install() {
    if (!Switch) return;
    if (rt.reg !== null) return;
    rt.base = Module.findBaseAddress(MODULE);
    if (rt.base === null) { logError('模块未找到: ' + MODULE); return; }
    try {
        rt.fnSetCosmetics = new NativeFunction(rt.base.add(OFF.SetEquippedCosmetics), 'void', ['pointer', 'pointer'], 'win64');
        rt.fnFind = new NativeFunction(rt.base.add(OFF.StaticFindObject), 'pointer', ['pointer', 'pointer', 'pointer', 'int32'], 'win64');
        rt.fnLoad = new NativeFunction(rt.base.add(OFF.StaticLoadObject), 'pointer',
            ['pointer', 'pointer', 'pointer', 'pointer', 'uint32', 'pointer', 'uint8', 'pointer'], 'win64');
    } catch (e) { logError('NativeFunction 声明失败: ' + e); return; }
    rt._ready = false; rt.lastAt = 0; rt.fistsClass = null; rt.fistTries = 0;
    try {
        rt.reg = Interceptor.attach(rt.base.add(OFF.TickActor), {
            onEnter: function (args) {
                if (!rt._ready) { rt._ready = true; if (!buildSlots()) { logError('未解析到任何饰品，停用'); Switch = 0; return; } }
                if (Switch) onTick(args);
            }
        });
    } catch (e) { logError('attach TickActor 失败: ' + e); rt.reg = null; }
}

function uninstall() {
    if (rt.reg !== null) { try { rt.reg.detach(); } catch (e) { logError('detach 失败: ' + e); } rt.reg = null; }
    rt.slots = null; rt.catOf = null; rt._ready = false; rt.fistsClass = null; rt.fistTries = 0;
}

rpc.exports = {
    init: function (stage, params) { install(); },
    dispose: function () { uninstall(); }
};
