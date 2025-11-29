var modSwitch = 1;
if (modSwitch == 1) {
    // 获取模块基址
    var base = Module.findBaseAddress('DreadHunger-Win64-Shipping.exe');
    var YawValue = 0.0;
    // 日志函数
    function logInfo(Info) {
        var f = new File('output.log', 'a');
        f.write('[Patches] ' + Info + '\n');
        f.close();
    }


    // ReplicateMoveToServer 函数地址
    var UCharacterMovementComponent_CallServerMovePacked = base.add(0x27a3480);

    // 创建指向原函数的 NativeFunction（用于调用原逻辑）
    const originalCallServerMovePacked = new NativeFunction(
        UCharacterMovementComponent_CallServerMovePacked,
        'void',                    // 返回值类型
        ['pointer', 'pointer', 'pointer', 'pointer']  // 参数类型: this, DeltaTime, NewAcceleration
    );

    // 使用 Interceptor.replace 替换函数
    Interceptor.replace(UCharacterMovementComponent_CallServerMovePacked, new NativeCallback(
        function (thisPtr, NewMove, PendingMove,OldMove) {
            try {
                /* 读奔跑状态bIsSprinting */
                var characterOwnerOffset = 0x148;
                var characterOwnerPtr = thisPtr.add(characterOwnerOffset).readPointer();
                
                // 检查指针是否有效
                if (!characterOwnerPtr.isNull()) {
                    // 读取CharacterOwner偏移0xA54处的int8值
                    var a54Offset = 0xA54;
                    var bIsSprinting = characterOwnerPtr.add(a54Offset).readS8();
                }

                /* 读是否收手bEquipped */
                var UDH_InventoryManagerPtr = characterOwnerPtr.add(0x808).readPointer();
                var ADH_Inventory = UDH_InventoryManagerPtr.add(0xF8).readPointer();
                var bEquipped = ADH_Inventory.add(0x530).readU8();


                var MovementModeOffset = 0x168;
                var MovementMode = NewMove.add(MovementModeOffset).readU8();
                if(bEquipped == 0 && (bIsSprinting != 1 || MovementMode == 3 || MovementMode == 4 || MovementMode == 6)){
                    //反向偏航角
                    var SavedControlRotationOffset = 0x19C;
                    var SavedControlRotationPtr = NewMove.add(SavedControlRotationOffset+0x4);
                    // FRotator有3个浮点数组成 (Pitch, Yaw, Roll) - 每个占4字节
                    //var currYaw = SavedControlRotationPtr.readFloat();
                    YawValue = YawValue + 100.0;
                    if(YawValue > 360.0){
                        YawValue = 0.0;
                    }
                    SavedControlRotationPtr.writeFloat(YawValue);
                    originalCallServerMovePacked(thisPtr, NewMove, PendingMove, OldMove);
                }else{
                    originalCallServerMovePacked(thisPtr, NewMove, PendingMove,OldMove);
                }
            } catch (err) {
                logInfo('UCharacterMovementComponent_ReplicateMoveToServer Error: ' + err.message);
                // 出错时仍调用原函数，避免崩溃
                originalCallServerMovePacked(thisPtr, NewMove, PendingMove,OldMove);
            }
        },
        'void',                    // 返回类型
        ['pointer', 'pointer', 'pointer', 'pointer']  // 参数类型: this, NewMove, PendingMove, OldMove
    ));
}
