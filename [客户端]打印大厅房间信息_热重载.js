'use strict';
// [客户端]打印大厅房间信息 —— 热重载版（Step 1：基础会话字段）
//
// 只读内存诊断脚本：不调用任何 UE 引擎函数、不改游戏状态。
// 数据链（结构体/属性偏移客户端与服务端一致，均经服务端 IDA 确认）：
//   GWorld[base+0x4C7DB50] -> UWorld*
//   UWorld +0x180        -> UGameInstance*（实际类型 UDH_GameInstance）
//   GameInstance +0x538  -> UDH_Online*
//   Online +0x28         -> UDH_OnlineSession*
//   Session +0x40        -> FDH_OnlineSessionData（内联结构，非指针）
//
// 输出：游戏目录 lobby_info.log（信息变更时才写一行，避免刷屏）
// 热重载：配合本脚本同名 .config(on_change:reload)；目录级 rescan 若未开，重启一次游戏即可。

var MODULE = 'DreadHunger-Win64-Shipping.exe';
var BUILD_TAG = 'v10';
var ENABLE = false;          // 总开关：false = 不启动采样（热重载后会停写 lobby_info.log）
var INTERVAL_MS = 500;
var LOG_FILE = 'lobby_info.log';
var ROOMS_FILE = 'lobby_rooms.json';

var OFF = {
	// ---- 取 UDH_OnlineSession->CurrentData 的指针链（属性偏移，IDA 确认）----
	GWorld:                      0x4C7DB50, // 客户端 UWorld 全局（base.add(..).readPointer() = UWorld*）
	UWorld_OwningGameInstance:   0x180,
	GameInstance_Online:         0x538,
	Online_Session:              0x28,
	Session_CurrentSearchSettings: 0x28, // TSharedPtr<FOnlineSessionSearch>（EOS 搜索结果）
	Session_CurrentData:         0x40,

	// ---- UDH_OnlineSession 其它字段 ----
	Session_CurrentLobbyHost:    0x148, // TTuple<FString,FString>：Key@0x148 / Value@0x158
	Session_bHasGameStarted:     0x16E,
	Session_GameURI:             0x178,

	// ---- FDH_OnlineSessionData（相对 Session+0x40 的偏移）----
	D_bPublic:                   0x00,
	D_DesiredPlayerCount:        0x10,
	D_Language:                  0x18,
	D_Destination:               0x28,
	D_ServerRegion:              0x38,
	D_URI:                       0x48,
	D_SessionIdToJoin:           0x58,
	D_DesiredLeaderId:           0x68,
	D_OnlineStarted:             0x78,
	D_Members:                   0xE0, // TArray<FDH_OnlineSessionMemberData>
	D_Age:                       0xF0,

	// ---- TArray 布局 ----
	TA_Data:                     0x00,
	TA_Num:                      0x08,

	// ---- UWorld::URL（FURL，IDA 确认布局）----
	URL:                         0x478,
	URL_Protocol:                0x00,
	URL_Host:                    0x10,
	URL_Port:                    0x20,
	URL_Map:                     0x28,
	URL_Op:                      0x48,
	URL_Portal:                  0x58,

	// ---- FOnlineSessionSearch / FOnlineSessionSearchResult（IDA 确认）----
	Search_SearchResults:        0x08,  // TArray<FOnlineSessionSearchResult>
	Search_State:                0x18,  // EOnlineAsyncTaskState
	Search_MaxResults:           0x1C,
	Search_bIsLanQuery:          0x78,
	SR_Size:                     0x110, // sizeof(FOnlineSessionSearchResult)
	SR_Ping:                     0x108,
	SR_OwnerName:                0x18,  // FOnlineSession.OwningUserName
	SR_NumOpenPublic:            0x104, // FOnlineSession.NumOpenPublicConnections
	SR_SessionSettings:          0x28,  // FOnlineSession.SessionSettings
	SS_NumPublic:                0x08,
	SS_NumPrivate:               0x0C,
	SS_bShouldAdvertise:         0x10,
	SS_bAllowJoinInProgress:     0x11,
	SS_bIsLANMatch:              0x12,
	SS_bUsesPresence:            0x16,
	SS_bAllowJoinViaPresence:    0x17,
	SS_bHasGameStarted:          0x20,
	SS_BuildUniqueId:            0x1C,
	// SessionSettings.Settings = TMap<FName,FOnlineSessionSetting>（TSparseArray 元素 0x30）
	SS_Settings:                 0x28,
	SS_ElemSize:                 0x30,
	SS_Set_Type:                 0x08, // TSetElement.Value(FOnlineSessionSetting).Data(FVariantData).Type
	SS_Set_Value:                0x10, // FVariantData.Value 联合体（字符串时为 wchar_t*）

	// ---- UNetDriver / UNetConnection（IDA 确认）----
	UWorld_NetDriver:            0x38,
	ND_ServerConnection:         0x88,
	ND_ClientConnections:        0x90,
	ND_LocalAddr:                0x6B8, // UNetDriver::LocalAddr（TSharedPtr<FInternetAddr>）
	NC_URL:                      0xA8, // 每条连接的 FURL（与上方 FURL 布局相同）

	// ---- FDH_OnlineSessionMemberData ----
	MEM_SIZE:                    0x30,
	M_Id:                        0x00,
	M_NativeId:                  0x10,
	M_Nickname:                  0x20
};

var rt = { base: null, timer: null, lastSig: null, miss: 0, warned: false, lastRoomsJson: null };

function logInfo(msg) {
	try {
		var f = new File(LOG_FILE, 'a');
		f.write('[LobbyInfo|' + BUILD_TAG + '] ' + msg + '\n');
		f.close();
	} catch (e) {}
}

function logError(msg) {
	try {
		var f = new File('output.log', 'a');
		f.write('[LobbyInfo|' + BUILD_TAG + '|ERROR] ' + msg + '\n');
		f.close();
	} catch (e) {}
}

// 安全读取 FString（UE4：Data@0, ArrayNum@8, ArrayMax@0xC；ArrayNum 含结尾 \0）
function readFString(addr) {
	try {
		var data = addr.readPointer();
		var num = addr.add(OFF.TA_Num).readS32();
		if (!data || data.isNull() || num <= 1) return '';
		return data.readUtf16String(num - 1);
	} catch (e) {
		return '<read-error>';
	}
}

// 安全读取指针；空指针返回 null
function readPtr(addr) {
	try {
		var p = addr.readPointer();
		return (p && !p.isNull()) ? p : null;
	} catch (e) {
		return null;
	}
}

// 解析链路；返回各段指针，便于诊断哪一段为空
function resolveChain() {
	var r = { world: null, gi: null, online: null, session: null };
	if (!rt.base) return r;
	r.world = readPtr(rt.base.add(OFF.GWorld));
	if (!r.world) return r;
	r.gi = readPtr(r.world.add(OFF.UWorld_OwningGameInstance));
	if (!r.gi) return r;
	r.online = readPtr(r.gi.add(OFF.GameInstance_Online));
	if (!r.online) return r;
	r.session = readPtr(r.online.add(OFF.Online_Session));
	return r;
}

function readMembers(dataAddr) {
	var out = [];
	try {
		var arr = dataAddr.add(OFF.D_Members);
		var data = readPtr(arr.add(OFF.TA_Data));
		var num = arr.add(OFF.TA_Num).readS32();
		if (!data || num <= 0 || num > 64) return out;
		for (var i = 0; i < num; i++) {
			var e = data.add(i * OFF.MEM_SIZE);
			out.push({
				nick: readFString(e.add(OFF.M_Nickname)),
				id: readFString(e.add(OFF.M_Id)),
				nativeId: readFString(e.add(OFF.M_NativeId))
			});
		}
	} catch (e) {}
	return out;
}

function readFStringArray(addr) {
	var out = [];
	try {
		var data = readPtr(addr.add(OFF.TA_Data));
		var num = addr.add(OFF.TA_Num).readS32();
		if (!data || num <= 0 || num > 32) return out;
		for (var i = 0; i < num; i++) out.push(readFString(data.add(i * 16)));
	} catch (e) {}
	return out;
}

function readConnUrl(conn) {
	var u = conn.add(OFF.NC_URL);
	return {
		host: readFString(u.add(OFF.URL_Host)),
		port: u.add(OFF.URL_Port).readS32(),
		map: readFString(u.add(OFF.URL_Map)),
		op: readFStringArray(u.add(OFF.URL_Op)),
		protocol: readFString(u.add(OFF.URL_Protocol))
	};
}

// 读取房间 SessionSettings.Settings 里的所有字符串值（URI/HOSTIP/P2PADDR/CONMETHOD/版本等）
// FVariantData: Type@0；type=6/10 时 Value@0x8 是 wchar_t*（宽字符串）
function readSettingStrings(result) {
	var out = [];
	try {
		var map = result.add(OFF.SR_SessionSettings + OFF.SS_Settings);
		var data = readPtr(map);
		var num = map.add(OFF.TA_Num).readS32();
		if (!data || num <= 0 || num > 128) return out;
		for (var i = 0; i < num && out.length < 48; i++) {
			var elem = data.add(i * OFF.SS_ElemSize);
			var type = elem.add(OFF.SS_Set_Type).readS32();
			if (type !== 6 && type !== 10) continue; // 6/10 = 宽字符串变体
			var p = readPtr(elem.add(OFF.SS_Set_Value));
			if (!p) continue;
			var s = p.readUtf16String();
			if (!s || s.length === 0 || s.length > 256) continue;
			if (out.indexOf(s) < 0) out.push(s);
		}
	} catch (e) {}
	return out;
}

// 从 settings 字符串里解析已开局房间的服务器地址（会话设置 URI = "IP:Port"）
function parseServerUri(settings) {
	var re = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3}):(\d{1,5})$/;
	for (var i = 0; i < settings.length; i++) {
		var s = settings[i];
		var m = re.exec(s);
		if (!m) continue;
		var a = +m[1], b = +m[2], c = +m[3], d = +m[4], p = +m[5];
		if (a > 255 || b > 255 || c > 255 || d > 255 || p <= 0 || p > 65535) continue;
		return { ip: m[1] + '.' + m[2] + '.' + m[3] + '.' + m[4], port: p, uri: s };
	}
	return null;
}

// 读取 EOS 搜索结果（大厅浏览器发现的房间）
function readSearchRooms(session) {
	try {
		var search = readPtr(session.add(OFF.Session_CurrentSearchSettings));
		if (!search) return null;
		var out = {
			state: search.add(OFF.Search_State).readS32(),
			maxResults: search.add(OFF.Search_MaxResults).readS32(),
			bIsLanQuery: search.add(OFF.Search_bIsLanQuery).readU8() ? 1 : 0,
			rooms: []
		};
		var data = readPtr(search.add(OFF.Search_SearchResults));
		var num = search.add(OFF.Search_SearchResults + 8).readS32();
		if (data && num > 0 && num <= 64) {
			for (var i = 0; i < num; i++) {
				var r = data.add(i * OFF.SR_Size);
				var ss = r.add(OFF.SR_SessionSettings);
				var settings = readSettingStrings(r);
				var srv = parseServerUri(settings);
				out.rooms.push({
					ping: r.add(OFF.SR_Ping).readS32(),
					owner: readFString(r.add(OFF.SR_OwnerName)),
					openPublic: r.add(OFF.SR_NumOpenPublic).readS32(),
					numPublic: ss.add(OFF.SS_NumPublic).readS32(),
					numPrivate: ss.add(OFF.SS_NumPrivate).readS32(),
					bAdvertise: ss.add(OFF.SS_bShouldAdvertise).readU8() ? 1 : 0,
					bJoinInProgress: ss.add(OFF.SS_bAllowJoinInProgress).readU8() ? 1 : 0,
					bLAN: ss.add(OFF.SS_bIsLANMatch).readU8() ? 1 : 0,
					bPresence: ss.add(OFF.SS_bUsesPresence).readU8() ? 1 : 0,
					bJoinViaPresence: ss.add(OFF.SS_bAllowJoinViaPresence).readU8() ? 1 : 0,
					bHasGameStarted: ss.add(OFF.SS_bHasGameStarted).readU8() ? 1 : 0,
					buildId: ss.add(OFF.SS_BuildUniqueId).readS32(),
					settings: settings,
					serverUri: srv ? srv.uri : '',
					serverIp: srv ? srv.ip : '',
					serverPort: srv ? srv.port : 0,
					started: srv ? 1 : 0
				});
			}
		}
		return out;
	} catch (e) { return null; }
}

// 搜索结果写入 lobby_rooms.json：内容变化时覆写（'w' = truncate），2 空格缩进
function writeRoomsJson(eosRooms) {
	try {
		var core = {
			state: eosRooms.state,
			maxResults: eosRooms.maxResults,
			bIsLanQuery: eosRooms.bIsLanQuery,
			rooms: eosRooms.rooms
		};
		var coreJson = JSON.stringify(core);
		if (coreJson === rt.lastRoomsJson) return; // 内容未变不重复写
		rt.lastRoomsJson = coreJson;
		core.updatedAt = new Date().toISOString();
		var f = new File(ROOMS_FILE, 'w');
		f.write(JSON.stringify(core, null, 2));
		f.close();
	} catch (e) {
		logError('writeRoomsJson: ' + e);
	}
}

function dumpOnce() {
	var chain = resolveChain();
	if (!chain.session) {
		// world=null 属启动/主菜单阶段（正常），静默；
		// 只有 world 已就绪但后续链路断裂，才说明客户端偏移需要更新。
		rt.miss++;
		if (rt.miss === 10 && !rt.warned) {
			rt.warned = true;
			if (chain.world) {
				logError('session 链路异常: world=ok, gi=' + (chain.gi ? 'ok' : 'null') +
					', online=' + (chain.online ? 'ok' : 'null') + '（客户端偏移可能已更新）');
			}
		}
		return;
	}
	rt.miss = 0;
	rt.warned = false;
	var session = chain.session;

	var data = session.add(OFF.Session_CurrentData);
	var url = chain.world.add(OFF.URL);

	// 网络连接层：房主看 ClientConnections（各加入者），客户端看 ServerConnection（房主）
	var net = null;
	var nd = readPtr(chain.world.add(OFF.UWorld_NetDriver));
	if (nd) {
		net = { driver: true, clients: [] };
		// 验证 transport：BSD 的 FInternetAddrBSD 在 +0x8 是 sockaddr_storage（family/port）
		var la = readPtr(nd.add(OFF.ND_LocalAddr));
		if (la) {
			var family = 0, lport = 0;
			try {
				family = la.add(0x8).readU16();
				if (family === 2) { // AF_INET
					var p = la.add(0xA).readU16(); // sin_port（网络字节序）
					lport = ((p & 0xFF) << 8) | ((p >> 8) & 0xFF);
				}
			} catch (e) {}
			net.localAddr = { family: family, port: lport };
		}
		var sc = readPtr(nd.add(OFF.ND_ServerConnection));
		if (sc) net.server = readConnUrl(sc);
		var cc = nd.add(OFF.ND_ClientConnections);
		var ccData = readPtr(cc);
		var ccNum = cc.add(OFF.TA_Num).readS32();
		if (ccData && ccNum > 0 && ccNum < 64) {
			for (var ci = 0; ci < ccNum; ci++) {
				var c = readPtr(ccData.add(ci * 8));
				if (c) net.clients.push(readConnUrl(c));
			}
		}
	}

	var eosRooms = readSearchRooms(session);
	if (eosRooms) writeRoomsJson(eosRooms);

	var info = {
		bPublic: data.add(OFF.D_bPublic).readU8() ? 1 : 0,
		desiredPlayers: data.add(OFF.D_DesiredPlayerCount).readS32(),
		language: readFString(data.add(OFF.D_Language)),
		destination: readFString(data.add(OFF.D_Destination)),
		serverRegion: readFString(data.add(OFF.D_ServerRegion)),
		uri: readFString(data.add(OFF.D_URI)),
		sessionIdToJoin: readFString(data.add(OFF.D_SessionIdToJoin)),
		desiredLeaderId: readFString(data.add(OFF.D_DesiredLeaderId)),
		onlineStarted: data.add(OFF.D_OnlineStarted).readU8() ? 1 : 0,
		age: data.add(OFF.D_Age).readS64().toString(),
		members: readMembers(data),
		lobbyHost: readFString(session.add(OFF.Session_CurrentLobbyHost)),
		lobbyHostValue: readFString(session.add(OFF.Session_CurrentLobbyHost + 0x10)),
		gameUri: readFString(session.add(OFF.Session_GameURI)),
		urlProtocol: readFString(url.add(OFF.URL_Protocol)),
		urlHost: readFString(url.add(OFF.URL_Host)),
		urlPort: url.add(OFF.URL_Port).readS32(),
		urlMap: readFString(url.add(OFF.URL_Map)),
		urlOp: readFStringArray(url.add(OFF.URL_Op)),
		urlPortal: readFString(url.add(OFF.URL_Portal)),
		net: net,
		eosRooms: eosRooms,
		bHasGameStarted: session.add(OFF.Session_bHasGameStarted).readU8() ? 1 : 0
	};

	var sig = JSON.stringify(info);
	if (sig === rt.lastSig) return; // 无变化不重复打印（签名不含 utc）
	rt.lastSig = sig;
	info.utc = new Date().toISOString();
	logInfo(JSON.stringify(info));
}

function install() {
	if (!ENABLE) return;     // 已失能：不建定时器
	if (rt.timer) return; // 幂等（热重载重复 init 安全）
	rt.base = Module.findBaseAddress(MODULE);
	if (!rt.base) { logError('模块未找到: ' + MODULE); return; }
	rt.timer = setInterval(function () {
		try { dumpOnce(); } catch (e) { logError('dumpOnce: ' + e); }
	}, INTERVAL_MS);
}

function uninstall() {
	if (rt.timer) { clearInterval(rt.timer); rt.timer = null; }
	rt.lastSig = null;
	rt.lastRoomsJson = null;
	rt.base = null;
}

rpc.exports = {
	init: function (stage, params) { install(); },
	dispose: function () { uninstall(); }
};
