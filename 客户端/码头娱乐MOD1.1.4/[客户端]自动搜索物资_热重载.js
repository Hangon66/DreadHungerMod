'use strict';
// [客户端]自动搜索物资 —— 热重载版
// 基于 Patches\[客户端]自动搜索物资.js 改写，包装为 frida-gadget 生命周期(init/dispose)。
//
// ★重要：本脚本会 attach UDH_CraftingRecipeWidget::OnCraftableChanged。
//        请确保原 `[客户端]自动搜索物资.js` 已停用（把它的 Switch 改为 0，或把文件改名去掉 .js），
//        否则两份脚本都会 attach 同一函数，导致自动制作触发两次。
//
// 热重载：配合 payload.config 的 "on_change":"rescan"（或本脚本同目录的 .config reload），
//         修改本文件并保存 → gadget 会 dispose→init 重载 → 无需重启游戏，改参数实时生效。
//
// 说明：onEnter/onLeave 逻辑与原脚本逐行一致（含 args[1] == 1 的判断），未作行为改动。
// 日志策略：仅错误才写 output.log，正常路径静默。

var MODULE = 'DreadHunger-Win64-Shipping.exe';

// ---- 常用可调项（热重载重点，改完存盘即生效）----
var Switch = 1;        // 1 开启，0 关闭
var BUILD_TAG = 'v2';  // 仅用于在 output.log 里观察重载代数
var autoCraftList = [
    'CR_HarvestAnimalMeat',  //动物肉
    'CR_HarvestHumanMeat',   //人肉
    'CR_SearchWoodCabinet',  //船上书柜
    'CR_SearchWoodTrunk',    //物资箱
    'CR_SearchSkeleton',     //骨头
    'CR_SearchMetalTrunk',   //弹药箱
    'CR_SearchFrozenCorpse', //尸体
    'CR_Searching',          //普通搜索
    'CR_UnlockCaptainsTrunk',//船长室宝箱
    'CR_MineCoal',           //煤车
    'CR_SearchLifeBoat',     //小艇
    'CR_HullPatch'           //漏洞
];

// ---- 客户端偏移（沿用原脚本，均为客户端二进制内地址；严禁与服务端偏移混用）----
var OFF = {
    OnCraftableChanged: 0xfa9450, // UDH_CraftingRecipeWidget::OnCraftableChanged
    Craft:              0xf8f390, // UDH_CraftingRecipeWidget::Craft
    FName_GetPlain:     0x11d7830,// FName::GetPlainNameString(FString&)
    FWeakObjectPtr_Get: 0x13e6cf0,// FWeakObjectPtr::Get()
    UObject_Name:       0x18,     // UObject::NamePrivate (FName)
    Widget_Recipe:      0x310     // widget 内配方 FWeakObjectPtr 偏移
};

// ---- 运行时状态（每次 init 重建，dispose 清理）----
var rt = { reg: null, base: null, Craft: null, GetName: null, GetPtr: null };

// 仅错误写入 output.log
function logError(msg) {
    try {
        var f = new File('output.log', 'a');
        f.write('[AutoSearch|' + BUILD_TAG + '|ERROR] ' + msg + '\n');
        f.close();
    } catch (e) { /* 忽略日志异常 */ }
}

// 与原脚本一致的 FString 构造
function newFString(Length) {
    var s = Memory.alloc(16 + Length * 2);
    s.writePointer(s.add(16));
    s.add(8).writeU32(0);
    s.add(12).writeU32(Length);
    return s;
}

// 读取 UObject 的 FName 明文（与原脚本一致）
function getObjectName(uObject) {
    var namePrivate = uObject.add(OFF.UObject_Name);
    var buf = newFString(100);
    rt.GetName(namePrivate, buf);
    return buf.readPointer().readUtf16String();
}

function install() {
    if (!Switch) return; // 关闭：静默不安装
    if (rt.reg) return; // 幂等：已装则跳过
    var base = Module.findBaseAddress(MODULE);
    if (!base) { logError('模块未找到: ' + MODULE); return; }
    rt.base = base;
    rt.Craft   = new NativeFunction(base.add(OFF.Craft), 'void', ['pointer'], 'win64');
    rt.GetName = new NativeFunction(base.add(OFF.FName_GetPlain), 'void', ['pointer', 'pointer'], 'win64');
    rt.GetPtr  = new NativeFunction(base.add(OFF.FWeakObjectPtr_Get), 'pointer', ['pointer'], 'win64');

    try {
        rt.reg = Interceptor.attach(base.add(OFF.OnCraftableChanged), {
            onEnter: function (args) {
                this.Context = args[0];
                this.bInCraftable = args[1];
            },
            onLeave: function () {
                try {
                    if (this.bInCraftable == 1) {
                        var recipePtr = rt.GetPtr(this.Context.add(OFF.Widget_Recipe));
                        var name = getObjectName(recipePtr);
                        if (autoCraftList.includes(name)) {
                            rt.Craft(this.Context);
                        }
                    }
                } catch (e) { logError('onLeave: ' + e); }
            }
        });
    } catch (e) {
        logError('attach OnCraftableChanged 失败: ' + e);
    }
}

function uninstall() {
    if (rt.reg) { try { rt.reg.detach(); } catch (e) { logError('detach 失败: ' + e); } rt.reg = null; }
}

rpc.exports = {
    // gadget 装载脚本时调用；stage: "early"=进程启动首次, "late"=热重载
    init: function (stage, params) { install(); },
    // 脚本被卸载/重载前调用；显式 detach 保证重载窗口干净（frida 卸载时也会自动清理）
    dispose: function () { uninstall(); }
};
