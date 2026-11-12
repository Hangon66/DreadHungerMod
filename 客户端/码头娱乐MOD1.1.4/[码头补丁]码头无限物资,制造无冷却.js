'use strict';
// frida-gadget 热重载版：编辑保存本文件 -> dispose() -> init() 自动生效，无需重启游戏
// 目录 ./Patches 已配置 on_change:rescan，且本脚本有同名 .config(on_change:reload)
// 日志策略：仅错误才写 output.log，正常路径静默

var MODULE = 'DreadHunger-Win64-Shipping.exe';
var BUILD_TAG = 'v11'; // 观察重载代数

// ====== 功能开关（1 开启，0 关闭）======
var enableFeature_diuqi = 0;      // 无限物品（跳过物品丢弃）
var enableFeature_zidan = 1;      // 子弹无消耗
var enableFeature_zhizao = 1;     // 制造无消耗 + 无需物资制造
var enableFeature_NoMakeTime = 1; // 制造无冷却

// ====== 偏移集中表 ======
var OFF = {
	diuqi:          0xE3B675, // 4 字节 NOP
	zidan:          0xE3A3C3, // 3 字节 NOP
	zhizaoConsume:  0xE5855C, // 3 字节 NOP（跳过制造消耗）
	craftFunc:      0xE44490, // 制造判定函数（无需物资制造 -> ret 改写）
	NoMakeTime:     0xE221D6, // 2 字节 NOP（跳过制造等待）
	// 本地玩家角色 -> Controller -> DHPlayerState -> bIsLobbyPlayer 链（结构偏移均经 IDA 核实；0x4C70908/0x0/0x20 为脚本维护的全局链，与踏空步脚本一致）：
	LP_Global:          0x4C70908, // 链起点全局地址
	LP_H1:              0x0,       // 第一跳：.readPointer()（+0x0）
	LP_H2:              0x20,      // 第二跳：.add(0x20).readPointer() 得到本地玩家角色对象
	CH_Controller:      0xA08,     // ADH_HumanCharacter::DHPlayerController（客户端属性.js + 投掷者.js 已验证；非 APawn::Controller@0x258）
	PC_PlayerState:     0x658,     // ADH_PlayerController::DHPlayerState -> ADH_PlayerState*（IDA确认）
	PS_bIsLobbyPlayer:  0x645,     // ADH_PlayerState::bIsLobbyPlayer（bool，IDA确认）
};
var NOP_SIZE = { diuqi: 4, zidan: 3, zhizaoConsume: 3, NoMakeTime: 2 };
var LOBBY_PLAYER = 1; // bIsLobbyPlayer == 1 表示当前玩家处于大厅

// ====== 运行时状态 ======
var rt = { base: null, regCraft: null, patches: [], hopDiagDone: false };

// ====== 日志（仅错误写入 output.log）======
function logError(msg) {
	try {
		var f = new File('output.log', 'a');
		f.write('[DockPatch|' + BUILD_TAG + '|ERROR] ' + msg + '\n');
		f.close();
	} catch (e) {}
}

// ====== 合法指针校验 ======
// 只用 isNull()/compare()/between() 等 NativePointer 方法，避开已弃用的指针真值判断与 Int64 比较
var PTR_MIN = ptr('0x10000');            // 低于此为无效地址
var PTR_MAX = ptr('0x7FFFFFFFFFFFF');    // 非规范/内核地址（含 sentinel 0xffffffffffffffff）一律排除
function isGoodPtr(p) {
	return p !== null && !p.isNull() && p.compare(PTR_MIN) >= 0 && p.compare(PTR_MAX) <= 0;
}

// ====== 安全指针读取 ======
// 读不可读地址会抛 access violation，归入“静默失败”；仅非内存类异常（用法错误等）才记录
function readPtrSafe(addr, label) {
	var p;
	try {
		p = addr.readPointer();
	} catch (e) {
		return null; // 该跳不可读：视为链断，静默返回
	}
	if (!isGoodPtr(p)) {
		if (!rt.hopDiagDone) {
			rt.hopDiagDone = true; // 仅首次上报，避免高频刷日志
			logError('checkInLobby 断于 ' + label + '，读得值=' + p);
		}
		return null;
	}
	return p;
}

// ====== 大厅判定：角色 -> Controller -> DHPlayerState -> bIsLobbyPlayer == 1 ======
// 任一跳取不到即视为非大厅，静默返回 false（本函数在制造函数 onLeave 高频调用，禁止刷日志）
function checkInLobby() {
	try {
		var a = readPtrSafe(rt.base.add(OFF.LP_Global), 'LP_Global');           if (a === null) return false;
		var b = readPtrSafe(a.add(OFF.LP_H1), 'LP_H1');                         if (b === null) return false;
		var ch = readPtrSafe(b.add(OFF.LP_H2), 'LP_H2');                        if (ch === null) return false; // ADH_HumanCharacter
		var ctl = readPtrSafe(ch.add(OFF.CH_Controller), 'CH_Controller');      if (ctl === null) return false; // ADH_PlayerController
		var ps = readPtrSafe(ctl.add(OFF.PC_PlayerState), 'PC_PlayerState');    if (ps === null) return false; // ADH_PlayerState
		return ps.add(OFF.PS_bIsLobbyPlayer).readU8() === LOBBY_PLAYER;
	} catch (e) {
		logError('checkInLobby: ' + e);
		return false;
	}
}

// ====== NOP 补丁：应用并保存原始字节（供热重载还原）======
function applyNop(key) {
	var addr = rt.base.add(OFF[key]);
	var size = NOP_SIZE[key];
	try {
		Memory.protect(addr, size, 'rwx');
		var orig = addr.readByteArray(size); // 先存原始字节
		Memory.patchCode(addr, size, function (code) {
			var w = new X86Writer(code, { pc: addr });
			for (var i = 0; i < size; i++) w.putNop();
			w.flush();
		});
		Memory.protect(addr, size, 'rx');
		rt.patches.push({ addr: addr, size: size, orig: orig });
	} catch (e) {
		logError('NOP 应用失败 ' + key + ': ' + e);
	}
}

// ====== 安装 ======
function install() {
	if (rt.base !== null) return; // 已安装（rt.base 为 NativePointer，不可用真值判断）
	rt.hopDiagDone = false;
	rt.base = Module.findBaseAddress(MODULE);
	if (rt.base === null) { logError('模块未找到: ' + MODULE); return; }

	if (enableFeature_diuqi)      applyNop('diuqi');
	if (enableFeature_zidan)      applyNop('zidan');
	if (enableFeature_NoMakeTime) applyNop('NoMakeTime');

	if (enableFeature_zhizao) {
		// 跳过制造消耗
		applyNop('zhizaoConsume');
		// 无需物资制造（仅当处于大厅 bIsLobbyPlayer==1 才改写返回值）
		try {
			rt.regCraft = Interceptor.attach(rt.base.add(OFF.craftFunc), {
				onLeave: function (ret) {
					if (checkInLobby()) ret.replace(0x20);
				}
			});
		} catch (e) {
			logError('attach craftFunc 失败: ' + e);
		}
	}
}

// ====== 卸载（供热重载：还原所有补丁 + detach 钩子）======
function uninstall() {
	if (rt.regCraft) { try { rt.regCraft.detach(); } catch (e) { logError('detach 失败: ' + e); } rt.regCraft = null; }
	for (var i = 0; i < rt.patches.length; i++) {
		var p = rt.patches[i];
		try {
			Memory.protect(p.addr, p.size, 'rwx');
			Memory.writeByteArray(p.addr, p.orig); // 还原原始指令
			Memory.protect(p.addr, p.size, 'rx');
		} catch (e) { logError('还原补丁失败 @' + p.addr + ': ' + e); }
	}
	rt.patches = [];
	rt.base = null;
	rt.hopDiagDone = false;
}

// ====== gadget 生命周期入口 ======
rpc.exports = {
	init: function (stage, params) { install(); },
	dispose: function () { uninstall(); }
};
