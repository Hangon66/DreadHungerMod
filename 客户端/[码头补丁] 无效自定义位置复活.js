// 角色死亡自定义位置复活脚本
// 功能：拦截角色死亡处理，使角色无论第几次死亡都在指定位置复活
// 注意：仅服务端可用

var Switch = 1; // 开关，1 为开启，0 为关闭

// ========== 配置区域 ==========

// 复活点配置（可设置多个，循环使用）
var RespawnPoints = [
    { x: 100.0, y: 200.0, z: 300.0, yaw: 90.0 },   // 复活点 1
    { x: 500.0, y: 600.0, z: 100.0, yaw: 180.0 },  // 复活点 2
    { x: -200.0, y: 300.0, z: 50.0, yaw: 0.0 }     // 复活点 3
];

// 是否重置死亡次数（防止第二次死亡变灵魂）
var ResetDeathCount = true;

// 复活延迟（毫秒，等待死亡动画播放完毕）
var RespawnDelay = 1000;

// ========== 日志函数 ==========

function logInfo(Info) {
    var f = new File('output.log', 'a');
    f.write('[RespawnMod] ' + Info + '\n');
    f.close();
}

// ========== 代码区域 ==========

if (Switch) {
    logInfo("自定义复活位置脚本已加载");
    logInfo("复活点数量：" + RespawnPoints.length);
    logInfo("是否重置死亡次数：" + ResetDeathCount);

    var base = Module.findBaseAddress("DreadHunger-Win64-Shipping.exe");

    // 关键函数地址
    // void ADH_Character::Died(ADH_Character* this, AController* Killer, TSubclassOf<UDamageType>* DamageType, float OverkillDamage)
    // 只有真正死亡才会调用此函数，倒地不会调用
    // TODO: 请替换为客户端 ADH_Character::Died 的偏移
    var ADH_Character_Died = base.add(0xdca660);
    // void ADH_PlayerState::SetDeathCount(ADH_PlayerState* this, int NewDeathCount)
    var ADH_PlayerState_SetDeathCount = new NativeFunction(base.add(0xec4ba9), 'void', ['pointer', 'int32'], 'win64');
    // void ADH_PlayerState::SetIsDead(ADH_PlayerState* this, bool bIsDead)
    // 服务端偏移: 0xE4E700 (IDA: 0x140E4E700)
    // TODO: 请替换为客户端偏移
    var ADH_PlayerState_SetIsDead = new NativeFunction(base.add(0xec61c0), 'void', ['pointer', 'bool'], 'win64');
    // void AGameModeBase::RestartPlayerAtTransform(AGameModeBase* this, AController* NewPlayer, const FTransform* SpawnTransform)
    var AGameModeBase_RestartPlayerAtTransform = new NativeFunction(base.add(0x2919130), 'void', ['pointer', 'pointer', 'pointer'], 'win64');
    // 全局 UWorld 指针
    var GWorld = base.add(0x4C7DB50);

    // 当前使用的复活点索引
    var currentRespawnIndex = 0;

    // 使用 Interceptor.replace 完全替换 Died 函数
    // 阻止原始死亡逻辑执行，保持角色状态完好
    Interceptor.replace(ADH_Character_Died, new NativeCallback(function(character, killer, damageType, overkillDamage) {
        logInfo("检测到 Died 函数调用（已拦截）");
        
        try {
            // ADH_HumanCharacter -> DHPlayerController (offset 0xA08)
            var controllerPtr = character.add(0xA08).readPointer();
            logInfo("ADH_HumanCharacter 地址：" + character);
            logInfo("Controller 地址：" + controllerPtr);
            
            if (controllerPtr.isNull()) {
                logInfo("未找到 Controller，跳过复活");
                return;
            }

            // 重置死亡次数（防止第二次死亡变灵魂）
            if (ResetDeathCount) {
                var playerState = character.add(0x240).readPointer();
                if (!playerState.isNull()) {
                    logInfo("重置死亡次数为 0");
                    ADH_PlayerState_SetDeathCount(playerState, 0);
                }
            }

            // 重置角色死亡状态（防止被判定为已死亡）
            // DeathState = 0 (CDS_ALIVE)
            character.add(0x818).writeU8(0);
            // bHasDied = 0
            character.add(0x850).writeU8(0);
            logInfo("已重置死亡状态");

            // 直接调用复活
            respawnPlayer(controllerPtr, character);

        } catch (e) {
            logInfo("错误：" + e);
        }
    }, 'void', ['pointer', 'pointer', 'pointer', 'float'], 'win64'));

    // 复活玩家函数
    function respawnPlayer(controller, character) {
        logInfo("respawnPlayer");
        if (controller.isNull()) {
            logInfo("Controller 无效，无法复活");
            return;
        }

        try {
            // 通过动态获取的 GWorld 读取 AuthorityGameMode (offset 0x118)
            if (!GWorld || GWorld.isNull()) {
                logInfo("尚未获取 World，等待 SpawnActor 被调用");
                return;
            }

            // GWorld 是全局变量地址，需要先 readPointer() 得到 UWorld*
            var world = GWorld.readPointer();
            if (world.isNull()) {
                logInfo("获取 UWorld 失败");
                return;
            }
            logInfo("UWorld 地址：" + world);
            var gameMode = world.add(0x118).readPointer();
            if (gameMode.isNull()) {
                logInfo("获取 GameMode 失败");
                return;
            }

            logInfo("GameMode 地址：" + gameMode);

            // 检查 Controller 关键字段
            try {
                var controllerPawn = controller.add(0x250).readPointer();
                logInfo("Controller->Pawn (0x250): " + controllerPawn);
                var controllerPlayerState = controller.add(0x228).readPointer();
                logInfo("Controller->PlayerState (0x228): " + controllerPlayerState);
                var controllerFlags = controller.add(0x5C).readU8();
                logInfo("Controller+0x5C flags: 0x" + controllerFlags.toString(16));
                
                // 检查 Pawn 的关键字段
                if (!controllerPawn.isNull()) {
                    var pawnRootComponent = controllerPawn.add(0x130).readPointer();
                    logInfo("Pawn->RootComponent (0x130): " + pawnRootComponent);
                    if (!pawnRootComponent.isNull()) {
                        var rootComponentToWorld = pawnRootComponent.add(0x1C0).readPointer();
                        logInfo("RootComponent->ComponentToWorld (0x1C0): " + rootComponentToWorld);
                    }
                    // 检查 Pawn 是否被标记为销毁
                    try {
                        var pawnPendingKill = controllerPawn.add(0x58).readU8();
                        logInfo("Pawn+0x58 (PendingKill flags): 0x" + pawnPendingKill.toString(16));
                        var pawnLifespan = controllerPawn.add(0x98).readFloat();
                        logInfo("Pawn->Lifespan (0x98): " + pawnLifespan);
                    } catch (e2) {
                        logInfo("读取 Pawn 状态失败: " + e2);
                    }
                }
            } catch (e) {
                logInfo("读取 Controller 字段失败: " + e);
            }

            // 选择复活点（循环使用）
            var spawnPoint = RespawnPoints[currentRespawnIndex % RespawnPoints.length];
            currentRespawnIndex++;

            logInfo("执行复活操作");
            logInfo("位置：X=" + spawnPoint.x + ", Y=" + spawnPoint.y + ", Z=" + spawnPoint.z);
            logInfo("旋转：Yaw=" + spawnPoint.yaw);

            // 构造 FTransform 结构体 (48 bytes, 0x30)
            // FTransform 布局: Rotation(FQuat@0x00) + Translation(FVector@0x10) + Scale3D(FVector@0x20)
            var transformPtr = Memory.alloc(0x30);

            // 将 Yaw 角度转换为四元数 (FQuat: X, Y, Z, W)
            // 对于纯 Yaw 旋转: Q = (0, 0, sin(yaw/2), cos(yaw/2))
            var yawRad = spawnPoint.yaw * Math.PI / 180.0;
            var halfYaw = yawRad / 2.0;
            var sinHalf = Math.sin(halfYaw);
            var cosHalf = Math.cos(halfYaw);

            // Rotation (FQuat @ 0x00): X=0, Y=0, Z=sin(yaw/2), W=cos(yaw/2)
            transformPtr.writeFloat(0.0);           // X
            transformPtr.add(0x4).writeFloat(0.0);   // Y
            transformPtr.add(0x8).writeFloat(sinHalf);  // Z
            transformPtr.add(0xC).writeFloat(cosHalf);  // W

            // Translation (FVector @ 0x10)
            transformPtr.add(0x10).writeFloat(spawnPoint.x);
            transformPtr.add(0x14).writeFloat(spawnPoint.y);
            transformPtr.add(0x18).writeFloat(spawnPoint.z);

            // Scale3D (FVector @ 0x20, SIMD 对齐)
            transformPtr.add(0x20).writeFloat(1.0);
            transformPtr.add(0x24).writeFloat(1.0);
            transformPtr.add(0x28).writeFloat(1.0);

            // 调用重生函数
            // void AGameModeBase::RestartPlayerAtTransform(this, AController* NewPlayer, const FTransform* SpawnTransform)
            logInfo("准备调用 RestartPlayerAtTransform...");
            logInfo("参数1 GameMode: " + gameMode);
            logInfo("参数2 Controller: " + controller);
            logInfo("参数3 Transform: " + transformPtr);
            
            // 关键：在调用 RestartPlayerAtTransform 之前必须设置 IsDead = false
            // 否则内部检查会失败导致崩溃
            var playerState = controller.add(0x228).readPointer();
            if (!playerState.isNull()) {
                logInfo("设置 PlayerState->IsDead = false");
                ADH_PlayerState_SetIsDead(playerState, 0);
            }
            
            try {
                AGameModeBase_RestartPlayerAtTransform(gameMode, controller, transformPtr);
                logInfo("RestartPlayerAtTransform 调用完成");
                
                // 复活后恢复生命值
                if (!character.isNull()) {
                    var maxHealth = character.add(0x7E0).readFloat();
                    character.add(0x94C).writeFloat(maxHealth);
                    logInfo("生命值已恢复为: " + maxHealth);
                }
            } catch (e) {
                logInfo("RestartPlayerAtTransform 调用异常: " + e);
            }

            logInfo("复活成功！下次将使用复活点 " + (currentRespawnIndex % RespawnPoints.length));

        } catch (e) {
            logInfo("复活失败：" + e);
        }
    }

    logInfo("Hook 安装完成，等待死亡事件...");
} else {
    logInfo("自定义复活位置脚本已禁用");
}
