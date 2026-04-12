/**
 * [码头补丁] 跳过牢房复活
 * 功能：角色死亡后直接在指定位置复活，跳过牢房流程
 * 
 * 原理：
 * 1. Hook ADH_Character::Died，先调用原始函数产生尸体
 * 2. 在原始函数返回后立即执行复活逻辑
 * 3. 重置死亡状态并移动到指定位置
 */

// ============== 配置区域 ==============
var EnableMod = true;

// 复活点列表（循环使用）
var RespawnPoints = [
    { x: -8842, y: 3852, z: 533, yaw: 236 }
];

// 是否重置死亡次数（防止第二次死亡变灵魂）
var ResetDeathCount = true;

// 复活延迟（秒）
var RespawnDelay = 5.0;

// ============== 日志函数 ==============
function logInfo(Info) {
    var f = new File('output.log', 'a');
    f.write('[SkipBrig] ' + Info + '\n');
    f.close();
}

// ============== 脚本主体 ==============

if (EnableMod) {
    logInfo("跳过牢房复活脚本已加载");
    logInfo("复活点数量：" + RespawnPoints.length);

    var base = Module.findBaseAddress("DreadHunger-Win64-Shipping.exe");

    // ============== 函数地址声明 ==============
    // TODO: 请替换为客户端偏移
    
    // void ADH_Character::Died(ADH_Character* this, AController* Killer, ...)
    var ADH_Character_Died_addr = base.add(0xdca660);
    var ADH_Character_Died = new NativeFunction(ADH_Character_Died_addr, 'void', ['pointer', 'pointer', 'pointer', 'float'], 'win64');
    
    // void ADH_PlayerState::SetDeathCount(ADH_PlayerState* this, int NewDeathCount)
    var ADH_PlayerState_SetDeathCount = new NativeFunction(base.add(0xec4ba0), 'void', ['pointer', 'int32'], 'win64');
    
    // void ADH_PlayerState::SetIsDead(ADH_PlayerState* this, bool bIsDead)
    var ADH_PlayerState_SetIsDead = new NativeFunction(base.add(0xec61c0), 'void', ['pointer', 'bool'], 'win64');
    
    // APawn::SetPlayerState - 恢复 PlayerState 关联
    // void APawn::SetPlayerState(APawn* this, APlayerState* NewPlayerState)
    // 服务端偏移: 0x2752480 (IDA: 0x142752480)
    // TODO: 请替换为客户端偏移
    var APawn_SetPlayerState = new NativeFunction(base.add(0x2b1fb60), 'void', ['pointer', 'pointer'], 'win64');
    
    // AGameModeBase::RestartPlayerAtTransform
    // void AGameModeBase::RestartPlayerAtTransform(AGameModeBase* this, AController* NewPlayer, const FTransform* SpawnTransform)
    // IDA: 0x142574990
    // TODO: 请替换为客户端偏移
    var AGameModeBase_RestartPlayerAtTransform = new NativeFunction(base.add(0x2919130), 'void', ['pointer', 'pointer', 'pointer'], 'win64');

    // 全局 UWorld 指针
    var GWorld = base.add(0x4C7DB50);

    // 当前复活点索引
    var currentRespawnIndex = 0;

    // ============== 工具函数 ==============
    
    // 获取 GameMode
    function getGameMode() {
        try {
            var world = GWorld.readPointer();
            if (world.isNull()) return null;
            return world.add(0x118).readPointer();
        } catch (e) {
            return null;
        }
    }

    // 执行复活逻辑（使用 GameMode + 自定义位置）
    function doRespawn(controller, playerState) {
        logInfo("=== 开始复活流程 ===");
        
        try {
            // 1. 先设置 PlayerState->IsDead = false（必须在复活之前）
            if (!playerState.isNull()) {
                ADH_PlayerState_SetIsDead(playerState, 0);
                logInfo("已设置 IsDead = false");
                
                // 2. 重置死亡次数
                if (ResetDeathCount) {
                    ADH_PlayerState_SetDeathCount(playerState, 0);
                    logInfo("已重置死亡次数为 0");
                }
            } else {
                logInfo("PlayerState 为空，跳过状态重置");
                return;
            }
            
            // 3. 获取 GameMode
            var gameMode = getGameMode();
            if (gameMode.isNull()) {
                logInfo("GameMode 为空，无法复活");
                return;
            }
            logInfo("GameMode: " + gameMode);
            
            // 4. 确保 Controller->Pawn 为空（让 GameMode 创建新的 Pawn）
            controller.add(0x250).writePointer(ptr(0));
            logInfo("已清空 Controller->Pawn");
            
            // 5. 获取复活点
            var spawnPoint = RespawnPoints[currentRespawnIndex % RespawnPoints.length];
            currentRespawnIndex++;
            logInfo("复活点: X=" + spawnPoint.x + ", Y=" + spawnPoint.y + ", Z=" + spawnPoint.z + ", Yaw=" + spawnPoint.yaw);
            
            // 6. 构造 FTransform
            // FTransform 结构: Rotation(FQuat 16bytes) + Translation(FVector 12bytes) + Scale3D(FVector 12bytes)
            // FQuat: X, Y, Z, W (float)
            // FVector: X, Y, Z (float)
            var transform = Memory.alloc(48);  // 16 + 12 + 12 + padding
            
            // 将 Yaw 转换为 FQuat
            // FQuat from Yaw: 
            // yawRad = yaw * PI / 180
            // halfYaw = yawRad / 2
            // X = 0, Y = 0, Z = sin(halfYaw), W = cos(halfYaw)
            var yawRad = spawnPoint.yaw * 3.14159265358979323846 / 180.0;
            var halfYaw = yawRad / 2.0;
            var quatZ = Math.sin(halfYaw);
            var quatW = Math.cos(halfYaw);
            
            // Rotation (FQuat): X, Y, Z, W @ offset 0
            transform.add(0x00).writeFloat(0.0);      // X
            transform.add(0x04).writeFloat(0.0);      // Y
            transform.add(0x08).writeFloat(quatZ);    // Z
            transform.add(0x0C).writeFloat(quatW);    // W
            
            // Translation (FVector): X, Y, Z @ offset 0x10
            transform.add(0x10).writeFloat(spawnPoint.x);
            transform.add(0x14).writeFloat(spawnPoint.y);
            transform.add(0x18).writeFloat(spawnPoint.z);
            
            // Scale3D (FVector): X, Y, Z @ offset 0x20 (默认 1,1,1)
            transform.add(0x20).writeFloat(1.0);
            transform.add(0x24).writeFloat(1.0);
            transform.add(0x28).writeFloat(1.0);
            
            logInfo("FTransform 已构造");
            
            // 7. 调用 RestartPlayerAtTransform
            logInfo("调用 RestartPlayerAtTransform...");
            AGameModeBase_RestartPlayerAtTransform(gameMode, controller, transform);
            logInfo("RestartPlayerAtTransform 已完成");
            
            // 8. 检查新 Pawn 是否创建成功
            var newPawn = controller.add(0x250).readPointer();
            logInfo("新 Pawn: " + newPawn);
            
            if (!newPawn.isNull()) {
                logInfo("=== 复活成功 ===");
            } else {
                logInfo("=== 复活失败：新 Pawn 为空 ===");
            }
            
        } catch (e) {
            logInfo("复活失败: " + e);
        }
    }

    // ============== Hook Died 函数 ==============
    
    Interceptor.attach(ADH_Character_Died_addr, {
        onEnter: function(args) {
            this.character = args[0];
            this.killer = args[1];
            this.damageType = args[2];
            this.overkillDamage = args[3];
            
            logInfo("=== 检测到死亡事件 ===");
            logInfo("Character: " + this.character);
            logInfo("Killer: " + this.killer);
            
            // 获取 Controller (APawn::Controller offset 0x258)
            var controller = this.character.add(0x258).readPointer();
            logInfo("Controller: " + controller);
            
            // 获取 PlayerState（在死亡流程执行前保存，因为流程中会被清空）
            var playerState = this.character.add(0x240).readPointer();
            logInfo("PlayerState (保存): " + playerState);
            
            this.shouldRespawn = false;
            
            if (!controller.isNull()) {
                this.shouldRespawn = true;
                this.controller = controller;
                this.playerState = playerState;
            } else {
                logInfo("Controller 为空，可能是 AI 角色");
            }
        },
        onLeave: function(retval) {
            if (this.shouldRespawn) {
                logInfo("原始死亡流程已完成，" + RespawnDelay + "秒后复活...");
                // 延迟复活，让死亡流程完全稳定
                var controller = this.controller;
                var playerState = this.playerState;
                
                setTimeout(function() {
                    doRespawn(controller, playerState);
                }, RespawnDelay * 1000);
            }
        }
    });

    logInfo("Hook 安装完成，等待死亡事件...");

} else {
    logInfo("跳过牢房复活脚本已禁用");
}
