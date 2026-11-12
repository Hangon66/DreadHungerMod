'use strict';
// [大厅补丁]大厅直连 —— 热重载版 v5（房主侧：BSD 监听 + 会话 URI 发布）
//
// 合并自：
//   [大厅补丁]大厅强制直连_热重载.js（字节补丁）
//   [大厅补丁]大厅直连URI_热重载.js（会话 URI 发布）
//
// 原理（IDA 确认）：
//   1) UNetDriverEOS::InitListen：
//        if (!bIsUsingP2PSockets || !IsAvailable()
//            || HasOption("bIsLanMatch") || HasOption("bUseIPSockets"))
//            { bIsPassthrough = 1; return UIpNetDriver::InitListen(...); }  // BSD 真实 UDP 端口
//        else → EOS P2P
//      => 大厅 URL 带 bUseIPSockets 就退回 BSD，LocalAddr 有真实端口（默认 7777）。
//   2) UNetDriverEOS::InitConnect：
//        Host 不以 "EOS" 开头 → 自动走 BSD（客户端无需任何脚本）。
//   3) PostUpdate 开头：if (bDestroyingSession || bTravellingToSession) return;
//      大厅里保持 bTravellingToSession=1，URI 仍会发布，但房主不会去连自己。
//      检测到外部加入地址（connect_client / 游戏内 IP 入口）时清 0 放行。
//
// 结构偏移（客户端/服务端一致，IDA 确认）：
//   GWorld[base+0x4C7DB50] -> UWorld*
//   UWorld+0x180 -> GameInstance*；GameInstance+0x538 -> UDH_Online*
//   Online+0x28 -> UDH_OnlineSession*；Session+0x40 -> FDH_OnlineSessionData
//   Session.bUpdatingSession=0x38，bTravellingToSession=0x3B
//   Data.URI=+0x48，Data.OnlineStarted=+0x78
//   UWorld.URL=+0x478（Port@0x20，Map@0x28，Op@0x48）

var MODULE = 'DreadHunger-Win64-Shipping.exe';
var BUILD_TAG = 'v5';

var ENABLE = true;            // 总开关：false = 不装字节补丁/ hook，并还原内存
var ENABLE_TRANSPORT = true;  // 子开关：?bUseIPSockets 字节补丁（BSD 真实端口）
var ENABLE_URI = true;        // 子开关：会话 URI 发布 + 旅行开关维护
var LOG_VERBOSE = false;      // 运行日志：false = 只写 output.log 错误

// 角色开关：'auto' 自动判断（URL.Op 含 listen 才算房主）| 'client' 客户端完全空转
// 装了 connect_client_win64.js 的客户端建议设为 'client'（两者都 hook Update，可能互相干扰）
var ROLE = 'auto';

// ===== 可调项 =====
var AUTO_PARSE_IP = true;       // TARGET_IP 为空时：从游戏"命名服务器地址"解析（仅支持 IPv4）
var TARGET_NAME = '';           // 可选：只取该名称的命名服务器；空=第一个有效项
var TARGET_IP = '43.226.61.35'; // 手动发布地址（支持域名；非空优先，留空 '' 才走自动解析）
var TARGET_PORT = 12226;        // 手动端口（0=用命名地址端口/大厅端口）

var OFF = {
	// 指针链
	GWorld:                    0x4C7DB50,
	UWorld_OwningGameInstance: 0x180,
	GameInstance_Online:       0x538,
	GameInstance_PlayerSettings: 0x500, // UDH_PlayerSettingsJsonSaveData*
	Online_Session:            0x28,

	// UDH_OnlineSession
	Session_bUpdating:         0x38,
	Session_bTravelling:       0x3B,   // bTravellingToSession（PostUpdate 早退开关）
	Session_CurrentData:       0x40,

	// FDH_OnlineSessionData
	D_URI:                     0x48,
	D_OnlineStarted:           0x78,

	// TArray/FString
	TA_Num:                    0x08,

	// UDH_PlayerSettingsJsonSaveData / FDH_ServerAddress（IDA 确认）
	Save_NamedServerAddresses: 0x90,
	SA_Size:                   0x28,
	SA_Name:                   0x00,
	SA_IP:                     0x10, // TArray<uint8>（4 字节）
	SA_Port:                   0x20,

	// UWorld::URL
	URL:                       0x478,
	URL_Port:                  0x20,
	URL_Map:                   0x28,
	URL_Op:                    0x48,   // TArray<FString>，房主含 listen，加入方不含

	// UNetDriver（判断是否 listen 房主）
	W_NetDriver:               0x38,
	ND_ServerConnection:       0x88,

	// 客户端函数偏移（RVA）
	Fn_Update:                 0xE95760,   // UDH_OnlineSession::Update
	Fn_LobbyInitGame:          0xE7B140,   // ADH_LobbyGameMode::InitGame
	Fn_PCTickActor:            0x2B78A50,  // APlayerController::TickActor
	Fn_ConnectToIPStartGame:   0x102F270   // UDH_ConnectToIPWidget::StartGame
};

// ===== transport 字节补丁（UDH_GameplayStatics::OpenLobbyMap）=====
var TP = {
	JE:         0xF0CE59,   // 74 20 (je) / 曾被打成 EB 20 (jmp)
	BYTE_JE:    0x74,
	BYTE_JMP:   0xEB,
	LEN:        0xF0CE66,   // 41 B8 11 00 00 00 的 imm32 起点
	LEN_OLD:    0x11,       // "?netmode=forcep2p" = 17
	LEN_NEW:    0x0E,       // "?bUseIPSockets"   = 14
	STR:        0x389A400,  // 宽串 "?netmode=forcep2p"
	STR_OLD:    '?netmode=forcep2p',
	STR_NEW:    '?bUseIPSockets',
	STR_BYTES:  36          // 17 字符 + NUL
};

var LOG_FILE = 'lobby_direct.log';

var rt = {
	base: null, installed: false,
	hostSeen: false,      // 本次大厅是房主
	kicked: false,        // 已主动触发过一次 Update
	stopping: false,      // 检测到真正开局/外部加入，停止注入
	lastTry: 0,
	hooks: [],
	uriBuf: null,
	target: null,
	lastOS: 0,            // 上一帧 OnlineStarted，用于识别新建房（0→1）
	lastLoggedTarget: null, // 日志去重
	// transport 补丁状态
	tpJE: null, tpLen: null, tpStr: null,
	appliedJE: false, appliedLen: false, appliedStr: false
};
var fnUpdate = null;

function logInfo(msg) {
	if (!LOG_VERBOSE) return;
	try { var f = new File(LOG_FILE, 'a'); f.write('[LobbyDirect|' + BUILD_TAG + '] ' + msg + '\n'); f.close(); } catch (e) {}
}
function logError(msg) {
	try { var f = new File('output.log', 'a'); f.write('[LobbyDirect|' + BUILD_TAG + '|ERROR] ' + msg + '\n'); f.close(); } catch (e) {}
}
function readFString(addr) {
	try {
		var data = addr.readPointer();
		var num = addr.add(OFF.TA_Num).readS32();
		if (!data || data.isNull() || num <= 1) return '';
		return data.readUtf16String(num - 1);
	} catch (e) { return ''; }
}
function readPtr(addr) {
	try { var p = addr.readPointer(); return (p && !p.isNull()) ? p : null; } catch (e) { return null; }
}
function getWorld() { return rt.base ? readPtr(rt.base.add(OFF.GWorld)) : null; }
function isLobbyWorld(world) {
	if (!world) return false;
	return readFString(world.add(OFF.URL + OFF.URL_Map)).indexOf('MenuLobby') >= 0;
}
function getSession() {
	var world = getWorld(); if (!world) return null;
	var gi = readPtr(world.add(OFF.UWorld_OwningGameInstance)); if (!gi) return null;
	var online = readPtr(gi.add(OFF.GameInstance_Online)); if (!online) return null;
	return readPtr(online.add(OFF.Online_Session));
}

// ===================== 1. transport 字节补丁 =====================

function installTransport(base) {
	// 1) 恢复 je（让 OpenLobbyMap 照常追加 URL 选项）
	try {
		var jeAddr = base.add(TP.JE);
		rt.tpJE = jeAddr;
		Memory.protect(jeAddr, 1, 'rwx');
		var cur = jeAddr.readU8();
		if (cur === TP.BYTE_JMP) {
			jeAddr.writeU8(TP.BYTE_JE);
			rt.appliedJE = true;
		} else if (cur === TP.BYTE_JE) {
			rt.appliedJE = false;
		} else {
			logError('F0CE59 字节意外: 0x' + cur.toString(16) + '（客户端版本可能变了）');
		}
		Memory.protect(jeAddr, 1, 'rx');
	} catch (e) {
		logError('处理 F0CE59 失败: ' + e);
		try { Memory.protect(base.add(TP.JE), 1, 'rx'); } catch (e2) {}
	}

	// 2) 追加串长度 0x11 → 0x0E
	try {
		var lenAddr = base.add(TP.LEN);
		rt.tpLen = lenAddr;
		Memory.protect(lenAddr, 1, 'rwx');
		var curLen = lenAddr.readU8();
		if (curLen === TP.LEN_OLD) {
			lenAddr.writeU8(TP.LEN_NEW);
			rt.appliedLen = true;
		} else if (curLen === TP.LEN_NEW) {
			rt.appliedLen = false;
		} else {
			logError('F0CE66 立即数意外: 0x' + curLen.toString(16));
		}
		Memory.protect(lenAddr, 1, 'rx');
	} catch (e) {
		logError('处理 F0CE66 失败: ' + e);
		try { Memory.protect(base.add(TP.LEN), 1, 'rx'); } catch (e2) {}
	}

	// 3) URL 追加串 "?netmode=forcep2p" → "?bUseIPSockets"
	try {
		var strAddr = base.add(TP.STR);
		rt.tpStr = strAddr;
		var curStr = strAddr.readUtf16String();
		if (curStr === TP.STR_NEW) {
			rt.appliedStr = false;
		} else if (curStr === TP.STR_OLD) {
			Memory.protect(strAddr, TP.STR_BYTES, 'rwx');
			strAddr.writeUtf16String(TP.STR_NEW);
			for (var i = (TP.STR_NEW.length + 1) * 2; i < TP.STR_BYTES; i++) strAddr.add(i).writeU8(0);
			Memory.protect(strAddr, TP.STR_BYTES, 'rx');
			rt.appliedStr = true;
		} else {
			logError('URL 串内容意外: "' + curStr + '"');
		}
	} catch (e) {
		logError('处理 URL 串失败: ' + e);
		try { Memory.protect(base.add(TP.STR), TP.STR_BYTES, 'rx'); } catch (e2) {}
	}
}

function uninstallTransport() {
	if (rt.tpJE && rt.appliedJE) {
		try { Memory.protect(rt.tpJE, 1, 'rwx'); rt.tpJE.writeU8(TP.BYTE_JE); Memory.protect(rt.tpJE, 1, 'rx'); } catch (e) { logError('还原 F0CE59 失败: ' + e); }
	}
	if (rt.tpLen && rt.appliedLen) {
		try { Memory.protect(rt.tpLen, 1, 'rwx'); rt.tpLen.writeU8(TP.LEN_OLD); Memory.protect(rt.tpLen, 1, 'rx'); } catch (e) { logError('还原 F0CE66 失败: ' + e); }
	}
	if (rt.tpStr && rt.appliedStr) {
		try {
			Memory.protect(rt.tpStr, TP.STR_BYTES, 'rwx');
			rt.tpStr.writeUtf16String(TP.STR_OLD);
			Memory.protect(rt.tpStr, TP.STR_BYTES, 'rx');
		} catch (e) { logError('还原 URL 串失败: ' + e); }
	}
	rt.appliedJE = false;
	rt.appliedLen = false;
	rt.appliedStr = false;
	rt.tpJE = null;
	rt.tpLen = null;
	rt.tpStr = null;
}

// ===================== 2. 会话 URI 发布 =====================

// 从 UDH_PlayerSettingsJsonSaveData::NamedServerAddresses 解析 IP/端口（仅 IPv4）
function resolveTarget(world) {
	if (rt.target) return rt.target;
	if (!AUTO_PARSE_IP) return null;
	try {
		var gi = readPtr(world.add(OFF.UWorld_OwningGameInstance));
		if (!gi) return null;
		var save = readPtr(gi.add(OFF.GameInstance_PlayerSettings));
		if (!save) return null;
		var arr = save.add(OFF.Save_NamedServerAddresses);
		var data = readPtr(arr);
		var num = arr.add(OFF.TA_Num).readS32();
		if (!data || num <= 0 || num > 64) return null;
		var best = null, bestScore = -1;
		for (var i = 0; i < num; i++) {
			var e = data.add(i * OFF.SA_Size);
			var name = readFString(e.add(OFF.SA_Name));
			if (TARGET_NAME && name !== TARGET_NAME) continue;
			var ipArr = e.add(OFF.SA_IP);
			var ipData = readPtr(ipArr);
			var ipNum = ipArr.add(OFF.TA_Num).readS32();
			if (!ipData || ipNum !== 4) continue;
			var a = ipData.readU8(), b = ipData.add(1).readU8(), c = ipData.add(2).readU8(), d = ipData.add(3).readU8();
			if (a === 0 || a === 127 || (a === 169 && b === 254)) continue;
			var isPrivate = (a === 10) || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31);
			var score = isPrivate ? 1 : 2;
			var port = e.add(OFF.SA_Port).readS32();
			if (!port || port <= 0) continue;
			if (TARGET_PORT > 0) port = TARGET_PORT;
			if (score > bestScore) {
				bestScore = score;
				best = { ip: a + '.' + b + '.' + c + '.' + d, port: port, name: name };
			}
		}
		if (best) {
			rt.target = best;
			logInfo('解析命名服务器地址: ' + (best.name || '(unnamed)') + ' -> ' + best.ip + ':' + best.port);
			return best;
		}
	} catch (e) { logError('resolveTarget: ' + e); }
	return null;
}

function buildTarget(world) {
	// 手动指定优先（支持域名）；留空才自动解析
	if (TARGET_IP) {
		var p = TARGET_PORT > 0 ? TARGET_PORT : 0;
		if (!p) { try { p = world.add(OFF.URL + OFF.URL_Port).readS32(); } catch (e) { p = 0; } }
		if (p <= 0) p = 7777;
		return TARGET_IP + ':' + p;
	}
	var t = resolveTarget(world);
	var ip = (t && t.ip) ? t.ip : '';
	var port = (t && t.port) ? t.port : TARGET_PORT;
	if (!port) {
		try { port = world.add(OFF.URL + OFF.URL_Port).readS32(); } catch (e) { port = 0; }
	}
	if (port <= 0) port = 7777;
	if (!ip) return '';
	return ip + ':' + port;
}

// Update 执行期间临时注入 URI；同时顶住 bTravellingToSession
function injectUri(session) {
	if (!ENABLE || !ENABLE_URI || rt.stopping) return null;
	var world = getWorld();
	if (!isLobbyWorld(world)) return null;
	if (!isListenHost(world)) return null; // 只有 listen 房主才注入（加入方绝不写 bTravelling）
	rt.hostSeen = true;

	var data = session.add(OFF.Session_CurrentData);
	if (data.add(OFF.D_OnlineStarted).readU8() === 0) return null;

	var target = buildTarget(world);
	if (!target) return null;

	// 外部已写入加入地址（connect_client 的 ConnectForIP / 游戏内 IP 入口）→ 放行 Travel
	var curUri = readFString(data.add(OFF.D_URI));
	if (curUri && curUri !== target) {
		try { session.add(OFF.Session_bTravelling).writeU8(0); } catch (e) {}
		rt.stopping = true;
		logInfo('检测到外部加入地址，放行 Travel: ' + curUri);
		return null;
	}

	session.add(OFF.Session_bTravelling).writeU8(1); // 阻止 PostUpdate 的 Travel
	var uri = data.add(OFF.D_URI);
	var old = { d: uri.readPointer(), n: uri.add(OFF.TA_Num).readS32(), m: uri.add(0x0C).readS32() };

	var len = target.length + 1;
	if (!rt.uriBuf) rt.uriBuf = Memory.alloc(512);
	rt.uriBuf.writeUtf16String(target);
	rt.uriBuf.add(target.length * 2).writeU16(0);
	uri.writePointer(rt.uriBuf);
	uri.add(OFF.TA_Num).writeS32(len);
	uri.add(0x0C).writeS32(len);

	if (rt.lastLoggedTarget !== target) {
		rt.lastLoggedTarget = target;
		logInfo('已注入房间直连地址: ' + target + '（游戏自身 Update）');
	}
	return { uri: uri, old: old, target: target };
}

function restoreUri(ctx) {
	if (!ctx) return;
	try {
		ctx.uri.writePointer(ctx.old.d);
		ctx.uri.add(OFF.TA_Num).writeS32(ctx.old.n);
		ctx.uri.add(0x0C).writeS32(ctx.old.m);
	} catch (e) {}
}

// 读取 UWorld.URL.Op（TArray<FString>）
function readUrlOps(world) {
	var out = [];
	try {
		var arr = world.add(OFF.URL + OFF.URL_Op);
		var data = arr.readPointer();
		var num = arr.add(OFF.TA_Num).readS32();
		if (!data || data.isNull() || num <= 0 || num > 32) return out;
		for (var i = 0; i < num; i++) out.push(readFString(data.add(i * 16)));
	} catch (e) {}
	return out;
}

function hasUrlOption(world, opt) {
	var ops = readUrlOps(world);
	for (var i = 0; i < ops.length; i++) {
		if (ops[i] === opt || ops[i].indexOf(opt + '=') === 0) return true;
	}
	return false;
}

// 房主判据：listen 房 URL 必带 listen 选项；加入方走 open IP，不带
function isListenHost(world) {
	try {
		if (!hasUrlOption(world, 'listen')) return false;
		var nd = world.add(OFF.W_NetDriver).readPointer();
		if (nd && !nd.isNull() && !nd.add(OFF.ND_ServerConnection).readPointer().isNull()) return false;
		return true;
	} catch (e) { return false; }
}

function tick() {
	if (!ENABLE || !ENABLE_URI || !rt.installed) return;
	var world = getWorld();
	var session = getSession();

	if (!isLobbyWorld(world)) {
		// 离开大厅：放行旅行，等下次建房重新开始
		if (session) { try { session.add(OFF.Session_bTravelling).writeU8(0); } catch (e) {} }
		rt.hostSeen = false;
		rt.kicked = false;
		rt.stopping = false;
		return;
	}

	if (rt.stopping || !session) return;

	// 每帧用 URL.Op 强制校验：只有 listen 房主才维护 bTravellingToSession
	if (!isListenHost(world)) {
		rt.hostSeen = false;
		return;
	}
	rt.hostSeen = true;

	// 外部加入请求：CurrentData.URI 被写成非本脚本地址 → 放行 Travel
	try {
		var tgt0 = buildTarget(world);
		var cur0 = readFString(session.add(OFF.Session_CurrentData).add(OFF.D_URI));
		if (cur0 && cur0 !== tgt0) {
			session.add(OFF.Session_bTravelling).writeU8(0);
			rt.stopping = true;
			logInfo('检测到外部加入地址，放行 Travel: ' + cur0);
			return;
		}
	} catch (e) {}

	// 顶住旅行开关（PostUpdate 早退，不发 Travel）
	try { session.add(OFF.Session_bTravelling).writeU8(1); } catch (e) {}

	// 新会话检测：OnlineStarted 0→1 视为重新建房，允许再次发布
	try {
		var os = session.add(OFF.Session_CurrentData).add(OFF.D_OnlineStarted).readU8();
		if (os === 1 && rt.lastOS === 0) { rt.kicked = false; rt.target = null; rt.lastTry = 0; }
		rt.lastOS = os;
	} catch (e) {}

	// 注意：不主动调用 Update（会让 set_lobby_name.js 的 returnAddress 校验失败）
}

// ===================== 3. 安装 / 卸载 =====================

function install() {
	if (rt.installed) return;
	if (!ENABLE) return;
	if (ROLE === 'client') return;   // 客户端空转，避免干扰 ConnectForIP
	rt.base = Module.findBaseAddress(MODULE);
	if (!rt.base) { logError('模块未找到: ' + MODULE); return; }

	// 1) transport 字节补丁（建房时生效）
	if (ENABLE_TRANSPORT) installTransport(rt.base);

	// 2) 会话 URI 相关 hook
	if (ENABLE_URI) {
		fnUpdate = new NativeFunction(rt.base.add(OFF.Fn_Update), 'void', ['pointer'], 'win64');

		try {
			rt.hooks.push(Interceptor.attach(rt.base.add(OFF.Fn_Update), {
				onEnter: function () {
					try {
						var session = getSession();
						if (session) this.ctx = injectUri(session);
					} catch (e) { logError('Update onEnter: ' + e); }
				},
				onLeave: function () { try { restoreUri(this.ctx); } catch (e) {} }
			}));
		} catch (e) { logError('attach Update 失败: ' + e); }

		try {
			rt.hooks.push(Interceptor.attach(rt.base.add(OFF.Fn_LobbyInitGame), {
				onEnter: function () { rt.hostSeen = true; rt.stopping = false; rt.kicked = false; rt.target = null; }
			}));
		} catch (e) { logError('attach InitGame 失败: ' + e); }

		try {
			rt.hooks.push(Interceptor.attach(rt.base.add(OFF.Fn_PCTickActor), {
				onEnter: function () { tick(); }
			}));
		} catch (e) { logError('attach TickActor 失败: ' + e); }

		try {
			rt.hooks.push(Interceptor.attach(rt.base.add(OFF.Fn_ConnectToIPStartGame), {
				onEnter: function () {
					rt.stopping = true;
					rt.hostSeen = false;
					rt.kicked = false;
					var session = getSession();
					if (session) { try { session.add(OFF.Session_bTravelling).writeU8(0); } catch (e) {} }
					logInfo('检测到正常开局，已放行 Travel');
				}
			}));
		} catch (e) { logError('attach ConnectToIPWidget::StartGame 失败: ' + e); }
	}

	rt.installed = true;
}

function uninstall() {
	for (var i = 0; i < rt.hooks.length; i++) { try { rt.hooks[i].detach(); } catch (e) {} }
	rt.hooks = [];

	if (ENABLE_TRANSPORT) uninstallTransport();

	// 离开时放行旅行，避免把会话卡在"旅行中"
	var session = getSession();
	if (session) { try { session.add(OFF.Session_bTravelling).writeU8(0); } catch (e) {} }

	rt.installed = false;
	rt.hostSeen = false;
	rt.kicked = false;
	rt.stopping = false;
	rt.lastTry = 0;
	rt.uriBuf = null;
	rt.target = null;
	fnUpdate = null;
	rt.base = null;
}

rpc.exports = {
	init: function (stage, params) { install(); },
	dispose: function () { uninstall(); }
};
