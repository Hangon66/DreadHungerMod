var base = Module.findBaseAddress('DreadHungerServer-Win64-Shipping.exe');

// 日志函数
function logInfo(Info) {
    var f = new File('output.log', 'a');
    f.write('[CancelPlan] ' + Info + '\n');
    f.close();
}

// =====================================================================
// 感知取消建造计划 MOD
//
// 功能：
//   当玩家在环境建造轮盘（WBP_RadialMenu_GroundCraftable）中选择取消/拆除计划时，
//   服务端感知并记录日志。
//
// 原理：
//   玩家点击"取消计划"→ 客户端调用 DestroyActiveCraftingProject（Server RPC）
//   → 服务端执行 DestroyActiveCraftingProject_Implementation
//   → Hook 此函数的 onEnter，读取 PlayerController 信息
//
// Hook 点：
//   UDH_GroundCraftingProjectComponent::DestroyActiveCraftingProject_Implementation
//   IDA 地址：0x140d8bf20 → offset 0xd8bf20
//
// 函数签名：
//   void DestroyActiveCraftingProject_Implementation(
//       UDH_GroundCraftingProjectComponent *this)
//
// 关键偏移（服务端 IDA 确认）：
//   UActorComponent::OwnerPrivate     → +0xA0  （Owner = ADH_PlayerController*，IDA type_inspect 确认）
//   ADH_PlayerController::DHPlayerState → +0x658
// =====================================================================

// UActorComponent.OwnerPrivate 偏移（IDA type_inspect 确认）
var UActorComponent_OwnerPrivate_offset = 0xA0;

// ADH_PlayerController.DHPlayerState 偏移（IDA type_inspect 确认）
var ADH_PlayerController_DHPlayerState_offset = 0x658;

var DestroyActiveCraftingProject_Impl_addr = base.add(0xd8bf20);

Interceptor.attach(DestroyActiveCraftingProject_Impl_addr, {
    onEnter: function(args) {
        // args[0] = UDH_GroundCraftingProjectComponent*
        var comp = args[0];
        if (comp.isNull()) {
            logInfo('警告：组件指针为空');
            return;
        }

        try {
            // 获取 Owner（ADH_PlayerController*）
            var controller = comp.add(UActorComponent_OwnerPrivate_offset).readPointer();
            if (controller.isNull()) {
                logInfo('玩家取消了建造计划（无法获取 PlayerController）');
                return;
            }

            // 获取 DHPlayerState
            var playerState = controller.add(ADH_PlayerController_DHPlayerState_offset).readPointer();
            if (playerState.isNull()) {
                logInfo('玩家取消了建造计划（无法获取 DHPlayerState）');
                return;
            }

            // logInfo('玩家取消了建造计划 | PlayerController=' + controller + ' PlayerState=' + playerState);

            // -------------------------------------------------------
            // 在此处添加自定义逻辑，例如：
            //   - 惩罚玩家（扣除资源）
            //   - 记录统计数据
            //   - 通知其他玩家
            // -------------------------------------------------------

        } catch(e) {
            logInfo('处理取消建造计划异常: ' + e);
        }
    }
});
