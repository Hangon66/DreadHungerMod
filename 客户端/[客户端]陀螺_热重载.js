'use strict';
// [客户端]陀螺 —— 热重载版 v11（仅拳头旋转，安全判据）
//
// 需求：按下“收手键”启用陀螺后，仅当角色处于“空手(拳头)”状态才旋转；手持任何物品(即使收手放下)不转。
//
// 空手/拳头判据（关键修正）：选中空物品栏时 SelectedInventory 并非 null，而是拳头物品 BP_Fists_Inventory_C
//   的实例。故用纯指针比较：SelectedInventory->ClassPrivate(obj+0x10) == 拳头UClass 即为空手。
//   拳头类通过 StaticFindObject/StaticLoadObject 解析(返回指针，安全)，不做任何返回 FString 的引擎调用(v9 崩溃教训)。
//
// 触发：ADH_PlayerController::HolsterInventory_Simulated 仅本地玩家按收手键时调用，作按键事件源翻转 armed(开/关)。
//   CallServerMovePacked 里：armed 且 空手(拳头) 且 非冲刺(或游泳/坠落模式) → 改写 NewMove 偏航角。
//
// 用 Interceptor.attach（非 replace）：gadget 热重载 dispose 自动 detach。结构字段两端一致；函数偏移客户端值。

var MODULE = 'DreadHunger-Win64-Shipping.exe';
var BUILD_TAG = 'v11';

// ====== 功能开关 ======
var Switch = 1;        // 1 开启，0 关闭
var SPIN_STEP = 100.0; // 每 tick 递进角度（度）

// 拳头物品类（蓝图）；空手判定用
var FISTS_PATH = '/Game/Blueprints/Inventory/Fists/BP_Fists_Inventory.BP_Fists_Inventory_C';

// ====== 偏移 ======
var OFF = {
    // 函数（客户端 RVA）
    CallServerMovePacked:       0x27A3480, // UCharacterMovementComponent::CallServerMovePacked
    HolsterInventory_Simulated: 0xEB2F50,  // ADH_PlayerController::HolsterInventory_Simulated（收手键事件）
    StaticFindObject:           0x13F44D0, // StaticFindObject(UClass*, UObject*, const char* Name, bool bExactClass)->UObject*
    StaticLoadObject:           0x13F4CC0, // StaticLoadObject(Class, Surrogate, wchar* Path, wchar* Sub, uint, UPackageMap*, bool, ctx)->UObject*
    // 本地玩家对象链
    LP_Global:             0x4C70908,
    LP_H1:                 0x0,    // a -> +0x0
    LP_H2:                 0x20,   // -> 本地角色 ADH_HumanCharacter
    CH_DHPlayerController: 0xA08,  // 角色 -> 本地控制器（确认本地玩家）
    // 结构字段（两端一致，IDA 确认）
    CharacterOwner:        0x148,  // UCharacterMovementComponent::CharacterOwner -> ADH_HumanCharacter
    CH_InventoryManager:   0x808,  // ADH_HumanCharacter::InventoryComponent -> UDH_InventoryManager
    IM_CurrentInventory:   0xF8,   // UDH_InventoryManager::SelectedInventory -> ADH_Inventory
    UObject_ClassPrivate:  0x10,   // UObject::ClassPrivate（UObjectBase, IDA 确认）
    CH_BIsSprinting:       0xA54,  // ADH_HumanCharacter::bIsSprinting
    NEWMOVE_MovementMode:  0x168,  // FSavedMove 内移动模式
    NEWMOVE_SavedYaw:      0x1A0   // FSavedMove::SavedControlRotation.Yaw
};

// 这些移动模式下即使没在冲刺也允许转（游泳/坠落等）
var SWIM_LIKE_MODES = [3, 4, 6];

// ====== 运行时状态 ======
var rt = { base: null, regMove: null, regHolster: null, fnFind: null, fnLoad: null,
           fistsClass: null, fistTries: 0, yaw: 0.0, armed: false };

// ====== 日志（仅错误写入 output.log）======
function logError(msg) {
    try {
        var f = new File('output.log', 'a');
        f.write('[Gyro|' + BUILD_TAG + '|ERROR] ' + msg + '\n');
        f.close();
    } catch (e) { /* 忽略日志自身异常 */ }
}

// ====== 指针校验与容错读取 ======
var PTR_MAX = ptr('0x7FFFFFFFFFFFF');
function isGoodPtr(p) { return p !== null && !p.isNull() && p.compare(PTR_MAX) <= 0; }
function readPtrAt(addr) {
    try { var p = addr.readPointer(); return isGoodPtr(p) ? p : null; }
    catch (e) { return null; }
}
function readU8At(base, off) {
    try { return base.add(off).readU8(); }
    catch (e) { return -1; }
}

// 本地控制器（确认 HolsterInventory 事件来自本地玩家）
function localControllerPtr() {
    if (rt.base === null) return null;
    var a = readPtrAt(rt.base.add(OFF.LP_Global));       if (a === null) return null;
    var b = readPtrAt(a.add(OFF.LP_H1));                 if (b === null) return null;
    var ch = readPtrAt(b.add(OFF.LP_H2));                if (ch === null) return null;
    return readPtrAt(ch.add(OFF.CH_DHPlayerController));
}

// 懒解析拳头类（游戏线程调用；只取返回指针，安全）。失败限次，避免反复。
function resolveFistsClass() {
    if (rt.fistTries >= 3 || rt.fnFind === null) return;
    rt.fistTries++;
    try {
        var ansi = Memory.allocUtf8String(FISTS_PATH);
        var p = rt.fnFind(ptr(0), ptr(0), ansi, 0);
        if (isGoodPtr(p)) { rt.fistsClass = p; return; }
        var w = Memory.allocUtf16String(FISTS_PATH);
        p = rt.fnLoad(ptr(0), ptr(0), w, ptr(0), 0, ptr(0), 0, ptr(0));
        if (isGoodPtr(p)) rt.fistsClass = p;
    } catch (e) { logError('resolveFistsClass: ' + e); }
}

// ====== 收手键事件：仅本地玩家，翻转 armed（启用/停用陀螺）======
function onHolster(args) {
    try {
        var localCtl = localControllerPtr();
        if (localCtl === null) return;
        if (!args[0].equals(localCtl)) return;
        rt.armed = !rt.armed;
    } catch (e) {
        logError('onHolster: ' + e);
    }
}

// ====== 移动上报：armed 且当前为拳头(SelectedInventory 类==拳头类) 才改写偏航角 ======
function onMove(args) {
    try {
        if (!rt.armed) return;
        var NewMove = args[1];                                    // FSavedMove
        var character = readPtrAt(args[0].add(OFF.CharacterOwner));
        if (character === null) return;
        var invMgr = readPtrAt(character.add(OFF.CH_InventoryManager));
        if (invMgr === null) return;
        var inv = readPtrAt(invMgr.add(OFF.IM_CurrentInventory));
        if (inv === null) return;                                 // 无选中(理论上不会, 拳头也是对象)

        if (rt.fistsClass === null) { resolveFistsClass(); if (rt.fistsClass === null) return; }
        var invClass = readPtrAt(inv.add(OFF.UObject_ClassPrivate));
        if (invClass === null) return;
        if (!invClass.equals(rt.fistsClass)) return;              // 非拳头 → 不转

        var sprinting = readU8At(character, OFF.CH_BIsSprinting);
        var mode = readU8At(NewMove, OFF.NEWMOVE_MovementMode);
        if (sprinting !== 1 || SWIM_LIKE_MODES.indexOf(mode) !== -1) {
            rt.yaw = (rt.yaw + SPIN_STEP) % 360.0;
            NewMove.add(OFF.NEWMOVE_SavedYaw).writeFloat(rt.yaw);
        }
    } catch (e) {
        logError('onMove: ' + e);
    }
}

// ====== 安装 ======
function install() {
    if (!Switch) return;
    if (rt.regMove !== null || rt.regHolster !== null) return; // 幂等
    rt.base = Module.findBaseAddress(MODULE);
    if (rt.base === null) { logError('模块未找到: ' + MODULE); return; }

    try {
        rt.fnFind = new NativeFunction(rt.base.add(OFF.StaticFindObject), 'pointer', ['pointer', 'pointer', 'pointer', 'int32'], 'win64');
        rt.fnLoad = new NativeFunction(rt.base.add(OFF.StaticLoadObject), 'pointer',
            ['pointer', 'pointer', 'pointer', 'pointer', 'uint32', 'pointer', 'uint8', 'pointer'], 'win64');
    } catch (e) { logError('NativeFunction 声明失败: ' + e); return; }
    rt.fistsClass = null; rt.fistTries = 0; rt.yaw = 0.0; rt.armed = false;

    try {
        rt.regMove = Interceptor.attach(rt.base.add(OFF.CallServerMovePacked), {
            onEnter: function (args) { onMove(args); }
        });
    } catch (e) { logError('attach CallServerMovePacked 失败: ' + e); }
    try {
        rt.regHolster = Interceptor.attach(rt.base.add(OFF.HolsterInventory_Simulated), {
            onEnter: function (args) { onHolster(args); }
        });
    } catch (e) { logError('attach HolsterInventory_Simulated 失败: ' + e); }
}

// ====== 卸载 ======
function uninstall() {
    if (rt.regMove !== null) { try { rt.regMove.detach(); } catch (e) { logError('detach move 失败: ' + e); } rt.regMove = null; }
    if (rt.regHolster !== null) { try { rt.regHolster.detach(); } catch (e) { logError('detach holster 失败: ' + e); } rt.regHolster = null; }
    rt.base = null; rt.fistsClass = null; rt.fistTries = 0; rt.yaw = 0.0; rt.armed = false;
}

// ====== gadget 生命周期入口 ======
rpc.exports = {
    init: function (stage, params) { install(); },
    dispose: function () { uninstall(); }
};
