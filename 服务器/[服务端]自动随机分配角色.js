var base = Module.findBaseAddress('DreadHungerServer-Win64-Shipping.exe');

// 日志函数
function logInfo(Info) {
    var f = new File('output.log', 'a');
    f.write('[AutoRole] ' + Info + '\n');
    f.close();
}

// =====================================================================
// 配置项（按需修改）
// =====================================================================

// 是否允许同一角色被多名玩家重复选择
// true  = 角色可重复（多人可选同一角色）
// false = 角色不可重复（走游戏原始 IsRoleTaken 逻辑）
var ALLOW_DUPLICATE_ROLES = false;

// ---------------------------------------------------------------
// NativeFunction 声明
// SetPlayerRole(ADH_PlayerState*, UDH_PlayerRoleData*, bool)
// ---------------------------------------------------------------
var SetPlayerRole_addr = base.add(0xe4f390);
var SetPlayerRole = new NativeFunction(
    SetPlayerRole_addr,
    'void',
    ['pointer', 'pointer', 'int32'],
    'win64'
);

// ---------------------------------------------------------------
// Hook 1：IsRoleTaken → ALLOW_DUPLICATE_ROLES=true 时始终返回 false
// 允许同一角色被多名玩家选择
// ---------------------------------------------------------------
var IsRoleTaken_addr = base.add(0xe93a70);
Interceptor.attach(IsRoleTaken_addr, {
    onLeave: function(retval) {
        if (ALLOW_DUPLICATE_ROLES) {
            retval.replace(0);
        }
    }
});

// ---------------------------------------------------------------
// GWorld / GameInstance 获取工具函数
// ---------------------------------------------------------------
var GWorld_offset = 0x46ED420;
var UWorld_OwningGameInstance_offset = 0x180;

function getGameInstance() {
    var world = base.add(GWorld_offset).readPointer();
    if (world.isNull()) return null;
    var gi = world.add(UWorld_OwningGameInstance_offset).readPointer();
    return gi.isNull() ? null : gi;
}

function getRandomRoleData() {
    var gi = getGameInstance();
    if (!gi) {
        // logInfo("警告：无法获取 GameInstance");
        return null;
    }
    // UDH_GameInstance.PlayerRoleList 偏移 0x3B8
    // TArray：[Data指针(8字节)][ArrayNum(4字节)][ArrayMax(4字节)]
    var listPtr = gi.add(0x3B8);
    var dataPtr = listPtr.readPointer();
    var count   = listPtr.add(8).readInt();
    if (count <= 0 || dataPtr.isNull()) {
        // logInfo("警告：PlayerRoleList 为空，count=" + count);
        return null;
    }
    var idx      = Math.floor(Math.random() * count);
    var roleData = dataPtr.add(idx * 8).readPointer();
    // logInfo("随机选择角色 index=" + idx + "/" + count + " ptr=" + roleData);
    return roleData;
}

// ---------------------------------------------------------------
// Hook 2：ADH_GameMode::HandleStartingNewPlayer_Implementation
// 0x140d995a0 → offset 0xd995a0
//
// 对局内原始逻辑：
//   UniqueId 非空（重连玩家） → Possess 已有 Pawn，return
//   UniqueId 为空（新玩家）   → ChooseRoleSelection → 弹出角色选择
//
// MOD 策略：Interceptor.replace 完全替换
//   重连玩家：直接调原始函数，保持原逻辑
//   新玩家：随机分配角色后跳过 ChooseRoleSelection，
//           最后调父类 AGameModeBase::HandleStartingNewPlayer_Implementation
// ---------------------------------------------------------------
var GameModeBase_HandleStarting = new NativeFunction(
    base.add(0x2567f00), 'void', ['pointer', 'pointer'], 'win64'
);
var original_ADHGameMode_HandleStarting = new NativeFunction(
    base.add(0xd995a0), 'void', ['pointer', 'pointer'], 'win64'
);

Interceptor.replace(base.add(0xd995a0), new NativeCallback(function(gameMode, newPlayer) {
    // logInfo("拦截 HandleStartingNewPlayer (对局)");

    if (!newPlayer || newPlayer.isNull()) {
        GameModeBase_HandleStarting(gameMode, newPlayer);
        return;
    }

    // AController::PlayerState 偏移 0x228
    // APlayerState.UniqueId 偏移 0x250，FUniqueNetIdRepl.ReplicationBytes 偏移 +0x18，TArray.ArrayNum 偏移 +0x8
    // 完整：PlayerState + 0x250 + 0x18 + 0x8 = PlayerState + 0x270
    var playerStateRaw = newPlayer.add(0x228).readPointer();
    var hasUniqueId = false;
    if (!playerStateRaw.isNull()) {
        try {
            var val = playerStateRaw.add(0x270).readU32();
            hasUniqueId = val !== 0;
        } catch(e) {
            // logInfo("读取 UniqueId 异常: " + e);
        }
    }

    if (hasUniqueId) {
        // logInfo("重连玩家，走原始逻辑");
        original_ADHGameMode_HandleStarting(gameMode, newPlayer);
        return;
    }

    // 新玩家：随机分配角色
    var dhPlayerState = newPlayer.add(0x658).readPointer();
    if (dhPlayerState.isNull()) {
        // logInfo("警告：DHPlayerState 为空，回退原始逻辑");
        original_ADHGameMode_HandleStarting(gameMode, newPlayer);
        return;
    }

    try {
        var roleData = getRandomRoleData();
        if (!roleData) {
            // logInfo("警告：无角色数据，回退原始逻辑");
            original_ADHGameMode_HandleStarting(gameMode, newPlayer);
            return;
        }
        SetPlayerRole(dhPlayerState, roleData, 1);
        // logInfo("已自动随机分配角色，跳过弹窗");
    } catch(e) {
        // logInfo("分配角色异常: " + e + "，回退原始逻辑");
        original_ADHGameMode_HandleStarting(gameMode, newPlayer);
        return;
    }

    // 跳过 ChooseRoleSelection，直接走父类逻辑
    GameModeBase_HandleStarting(gameMode, newPlayer);
}, 'void', ['pointer', 'pointer'], 'win64'));
