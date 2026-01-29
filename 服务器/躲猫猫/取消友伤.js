// 获取模块基址
var base = Module.findBaseAddress('DreadHungerServer-Win64-Shipping.exe');

// 日志函数
function logInfo(Info) {
    var f = new File('output.log', 'a');
    f.write('[Patches] ' + Info + '\n');
    f.close();
}

// TakeDamage 函数地址
var ADH_HumanCharacter_TakeDamage = base.add(0xd73db0);

// 创建指向原函数的 NativeFunction（用于调用原逻辑）
const originalTakeDamage = new NativeFunction(
    ADH_HumanCharacter_TakeDamage,
    'float',                    // 返回值类型
    ['pointer', 'float', 'pointer', 'pointer', 'pointer']  // 参数类型
);

// 使用 Interceptor.replace 替换函数
Interceptor.replace(ADH_HumanCharacter_TakeDamage, new NativeCallback(
    function (thisPtr, damage, damageEvent, eventInstigator, damageCauser) {
        try {
            //logInfo(`[TakeDamage] 原始伤害: ${damage}`);
            // ===== 读取角色状态 =====
            var playerStateTaken = thisPtr.add(0x240).readPointer(); // 被打者 PlayerState
            var playerStateCauser = damageCauser.add(0x240).readPointer(); // 造成者 PlayerState
            //var DamageType = damageEvent.add(0x8).readPointer();
            //var bCausedByWorld = (DamageType.add(0x28).readU8() & 0x01) !== 0;
            //logInfo('bCausedByWorld : ' + bCausedByWorld);
            //logInfo(`[TakeDamage] 被打者: ${playerStateTaken}` + `, 造成者: ${playerStateCauser}`);
            var isThrall1 = 0, isThrall2 = 0;
            if (!playerStateTaken.isNull() 
                && !playerStateCauser.isNull() 
                && (!playerStateTaken.equals(playerStateCauser)) 
                && !playerStateCauser.equals(ptr("0xffffffffffffffff"))) {

                isThrall1 = playerStateTaken.add(0x572).readU8();
                isThrall2 = playerStateCauser.add(0x572).readU8();
                //logInfo(`IsThrall1: ${isThrall1}, IsThrall2: ${isThrall2}`);
                if (isThrall1 === isThrall2) {
                    //logInfo('友伤已取消');
                    damage = 0.0;
                }

            }
            // ===== 调用原函数，保留所有逻辑 =====
            let result = originalTakeDamage(thisPtr, damage, damageEvent, eventInstigator, damageCauser);

            //logInfo(`[TakeDamage] 执行完成，返回值: ${result}`);
            return result;

        } catch (err) {
            logInfo('ADH_HumanCharacter_TakeDamage Error: ' + err.message);
            // 出错时仍调用原函数，避免崩溃
            return originalTakeDamage(thisPtr, damage, damageEvent, eventInstigator, damageCauser);
        }
    },
    'float',                    // 返回类型
    ['pointer', 'float', 'pointer', 'pointer', 'pointer']  // 参数类型
));
