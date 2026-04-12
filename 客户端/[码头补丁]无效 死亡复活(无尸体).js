/**
 * [码头补丁] 跳过牢房复活
 * 功能：角色死亡后直接在指定位置复活，跳过牢房流程
 * 
 * 原理：
 * 1. Hook ADH_Character::Died 阻止死亡流程
 * 2. 重置所有死亡相关状态
 * 3. 恢复生命值
 * 4. 移动到指定位置
 */

// ============== 配置区域 ==============
var EnableMod = true;

// 复活点列表（循环使用）
var RespawnPoints = [
    { x: -9067, y: 5231, z: 300, yaw: 236 }
];

// 是否重置死亡次数（防止第二次死亡变灵魂）
var ResetDeathCount = true;

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
    var ADH_Character_Died = base.add(0xdca660);
    
    // void ADH_PlayerState::SetDeathCount(ADH_PlayerState* this, int NewDeathCount)
    var ADH_PlayerState_SetDeathCount = new NativeFunction(base.add(0xec4ba0), 'void', ['pointer', 'int32'], 'win64');
    
    // void ADH_PlayerState::SetIsDead(ADH_PlayerState* this, bool bIsDead)
    var ADH_PlayerState_SetIsDead = new NativeFunction(base.add(0xec61c0), 'void', ['pointer', 'bool'], 'win64');

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

    // 构造 FTransform
    function createTransform(x, y, z, yaw) {
        var transformPtr = Memory.alloc(0x30);
        
        var yawRad = yaw * Math.PI / 180.0;
        var halfYaw = yawRad / 2.0;
        var sinHalf = Math.sin(halfYaw);
        var cosHalf = Math.cos(halfYaw);
        
        // Rotation (FQuat @ 0x00)
        transformPtr.writeFloat(0.0);
        transformPtr.add(0x4).writeFloat(0.0);
        transformPtr.add(0x8).writeFloat(sinHalf);
        transformPtr.add(0xC).writeFloat(cosHalf);
        
        // Translation (FVector @ 0x10)
        transformPtr.add(0x10).writeFloat(x);
        transformPtr.add(0x14).writeFloat(y);
        transformPtr.add(0x18).writeFloat(z);
        
        // Scale3D (FVector @ 0x20)
        transformPtr.add(0x20).writeFloat(1.0);
        transformPtr.add(0x24).writeFloat(1.0);
        transformPtr.add(0x28).writeFloat(1.0);
        
        return transformPtr;
    }

    // 直接复活角色（不调用 GameMode 函数）
    function respawnCharacter(character, controller) {
        logInfo("=== 开始复活流程 ===");
        
        try {
            // 1. 获取 PlayerState
            var playerState = character.add(0x240).readPointer();
            logInfo("PlayerState: " + playerState);
            
            // 2. 重置死亡状态
            // DeathState = 0 (CDS_ALIVE)
            character.add(0x818).writeU8(0);
            // bHasDied = 0
            character.add(0x850).writeU8(0);
            logInfo("已重置 DeathState 和 bHasDied");
            
            // 3. 设置 PlayerState->IsDead = false
            if (!playerState.isNull()) {
                ADH_PlayerState_SetIsDead(playerState, 0);
                logInfo("已设置 IsDead = false");
                
                // 4. 重置死亡次数
                if (ResetDeathCount) {
                    ADH_PlayerState_SetDeathCount(playerState, 0);
                    logInfo("已重置死亡次数为 0");
                }
            }
            
            // 5. 恢复生命值
            var maxHealth = character.add(0x7E0).readFloat();
            character.add(0x94C).writeFloat(maxHealth);
            logInfo("已恢复生命值: " + maxHealth);
            
            // 6. 移动到复活点
            var spawnPoint = RespawnPoints[currentRespawnIndex % RespawnPoints.length];
            currentRespawnIndex++;
            
            // 获取 RootComponent
            var rootComponent = character.add(0x130).readPointer();
            if (!rootComponent.isNull()) {
                // 设置世界位置
                // RootComponent->RelativeLocation (offset 0x1C0 是 ComponentToWorld，我们需要设置相对位置)
                // 实际上应该调用 SetActorLocation，但我们可以直接修改
                
                // 简单方法：直接设置 RootComponent 的世界位置
                // ComponentToWorld.Translation @ 0x10
                var componentToWorld = rootComponent.add(0x1C0);
                componentToWorld.add(0x10).writeFloat(spawnPoint.x);
                componentToWorld.add(0x14).writeFloat(spawnPoint.y);
                componentToWorld.add(0x18).writeFloat(spawnPoint.z);
                
                logInfo("已移动到位置: X=" + spawnPoint.x + ", Y=" + spawnPoint.y + ", Z=" + spawnPoint.z);
            }
            
            logInfo("=== 复活完成 ===");
            
        } catch (e) {
            logInfo("复活失败: " + e);
        }
    }

    // ============== Hook Died 函数 ==============
    
    Interceptor.replace(ADH_Character_Died, new NativeCallback(function(character, killer, damageType, overkillDamage) {
        logInfo("=== 检测到死亡事件（已拦截） ===");
        logInfo("Character: " + character);
        logInfo("Killer: " + killer);
        
        try {
            // 获取 Controller
            var controller = character.add(0xA08).readPointer();
            logInfo("Controller: " + controller);
            
            if (controller.isNull()) {
                logInfo("Controller 为空，可能是 AI 角色，放行原始死亡");
                return;
            }
            
            // 直接复活，跳过所有死亡流程
            respawnCharacter(character, controller);
            
        } catch (e) {
            logInfo("错误: " + e);
        }
        
        // 不调用原始 Died 函数，完全跳过死亡流程
        
    }, 'void', ['pointer', 'pointer', 'pointer', 'float'], 'win64'));

    logInfo("Hook 安装完成，等待死亡事件...");

} else {
    logInfo("跳过牢房复活脚本已禁用");
}
