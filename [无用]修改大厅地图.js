
var base = Module.findBaseAddress('DreadHunger-Win64-Shipping.exe');

// 日志函数
function logInfo(Info) {
    var f = new File('output.log', 'a');
    f.write('[Patches] ' + Info + '\n');
    f.close();
}

// UDH_GameplayStatics::LobbyMapName 静态 FString
// 结构: { wchar_t* Data (+0x00), int32 ArrayNum (+0x08), int32 ArrayMax (+0x0C) }
var LobbyMapName = base.add(0x4a89190);

// 新地图名：附带 ?game= 参数，强制使用 BP_LobbyGameMode 加载 Departure_Persistent
// 避免 Departure 默认使用 BP_DreadGameMode（对战模式）导致黑屏+无法操作
var NEW_MAP_NAME = 'Departure_Persistent?game=BP_LobbyGameMode_C';
var NEW_MAP_LEN  = NEW_MAP_NAME.length + 1;

// 替换 LobbyMapName FString 内容的核心函数
function replaceLobbyMapName() {
    try {
        var dataPtr  = LobbyMapName.readPointer();   // wchar_t*
        var arrayMax = LobbyMapName.add(0x0C).readInt(); // 当前分配容量

        if (NEW_MAP_LEN > arrayMax) {
            // 原缓冲区不够用，重新分配一块足够大的内存
            var newBuf = Memory.alloc(NEW_MAP_LEN * 2);
            newBuf.writeUtf16String(NEW_MAP_NAME);

            // 替换 Data 指针及容量字段
            LobbyMapName.writePointer(newBuf);
            LobbyMapName.add(0x08).writeInt(NEW_MAP_LEN); // ArrayNum
            LobbyMapName.add(0x0C).writeInt(NEW_MAP_LEN); // ArrayMax
        } else {
            // 缓冲区够用，直接覆盖字符串内容
            dataPtr.writeUtf16String(NEW_MAP_NAME);
            LobbyMapName.add(0x08).writeInt(NEW_MAP_LEN); // ArrayNum
        }

        logInfo('LobbyMapName 已替换为: ' + NEW_MAP_NAME);
    } catch (e) {
        logInfo('replaceLobbyMapName 失败: ' + e.message);
    }
}

// Hook OpenLobbyMap，在每次执行前确保 LobbyMapName 已被替换（双保险）
// UDH_GameplayStatics::OpenLobbyMap
var openLobbyMap = base.add(0xf0cd40);

Interceptor.attach(openLobbyMap, {
    onEnter: function(args) {
        try {
            replaceLobbyMapName();
        } catch (e) {
            logInfo('Hook OpenLobbyMap 替换失败: ' + e.message);
        }
    }
});

// ============================================================
// 大厅状态判断工具函数
// ============================================================

// GWorld 全局变量地址（UWorldProxy，解引用两次得到 UWorld*）
// 服务端偏移 0x46ed420，客户端需替换
var GWorldPtr = base.add(0x46ed420);

// UDH_GameplayStatics::GetDHLobbyGameState（客户端/服务端通用）
// 服务端偏移 0xe8ef80，客户端需替换
var getDHLobbyGameState = new NativeFunction(
    base.add(0xe8ef80),
    'pointer', ['pointer']  // ADH_LobbyGameState* (const UObject* Context)
);

// UDH_GameplayStatics::GetDHLobbyGameMode（仅服务端 Authority 有效）
// 服务端偏移 0xe8ef10，客户端需替换
var getDHLobbyGameMode = new NativeFunction(
    base.add(0xe8ef10),
    'pointer', ['pointer']  // ADH_LobbyGameMode* (const UObject* Context)
);

/**
 * 获取当前 UWorld 指针
 * GWorld 是 UWorldProxy，其第一个字段即 UWorld*
 */
function getWorld() {
    try {
        var proxy = GWorldPtr.readPointer(); // UWorldProxy*
        if (proxy.isNull()) return null;
        return proxy.readPointer();          // UWorld*
    } catch (e) {
        return null;
    }
}

/**
 * 判断当前是否处于大厅状态（客户端/服务端通用）
 * 原理：调用 GetDHLobbyGameState，非空即为大厅
 * @returns {boolean}
 */
function isInLobby() {
    try {
        var world = getWorld();
        if (!world || world.isNull()) return false;
        var lobbyState = getDHLobbyGameState(world);
        return !lobbyState.isNull();
    } catch (e) {
        logInfo('isInLobby 异常: ' + e.message);
        return false;
    }
}

// UWorld::GetMapName（sret 约定：返回值通过第一参数 FString* 传出）
// 服务端偏移 0x1967680，客户端需替换
var _getMapName = new NativeFunction(
    base.add(0x1967680),
    'pointer', ['pointer', 'pointer']  // FString* (FString* result, UWorld* this)
);

/**
 * 读取当前地图名（UWorld::GetMapName）
 * 返回类似 "MenuLobby"、"Departure_Persistent" 的字符串
 * @returns {string|null}
 */
function getCurrentMapName() {
    try {
        var world = getWorld();
        if (!world || world.isNull()) return null;

        // FString 结构: { wchar_t* Data(+0), int32 ArrayNum(+8), int32 ArrayMax(+12) }
        var fstrBuf = Memory.alloc(16);
        fstrBuf.writePointer(ptr(0));      // Data = null
        fstrBuf.add(8).writeInt(0);        // ArrayNum = 0
        fstrBuf.add(12).writeInt(0);       // ArrayMax = 0

        _getMapName(fstrBuf, world);

        var dataPtr = fstrBuf.readPointer();
        var arrayNum = fstrBuf.add(8).readInt();
        if (dataPtr.isNull() || arrayNum <= 0) return null;

        var name = dataPtr.readUtf16String(arrayNum - 1); // 去掉末尾 null

        // 释放 UE4 分配的字符串内存（FMemory::Free）
        // 服务端偏移 0x??，暂不释放（少量内存可接受）
        return name;
    } catch (e) {
        logInfo('getCurrentMapName 异常: ' + e.message);
        return null;
    }
}

/**
 * 判断当前地图是否为 MenuLobby
 * @returns {boolean}
 */
function isMenuLobby() {
    var name = getCurrentMapName();
    return name !== null && name === 'MenuLobby';
}
