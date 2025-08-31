var base = Module.findBaseAddress('DreadHungerServer-Win64-Shipping.exe');
var ADH_HumanCharacter_AddStartingInventory_addr = base.add(0xD46F10);

function resetSpells(SpellManager) {
    // 如果 SpellManager 为空，不做任何操作
    if (SpellManager.isNull()) {
        return;
    }
    var SpellChargeLevel = SpellManager.add(0x284);
    SpellChargeLevel.writeFloat(SpellChargeLevel.readFloat() + 1);
}

Interceptor.attach(ADH_HumanCharacter_AddStartingInventory_addr, {
    onEnter: function (args) {
        // 获取玩家的状态
        var PlayerState = args[0].add(0x240).readPointer();
        // 获取技能管理器
        var SpellManager = PlayerState.add(0x488).readPointer();
        // 对所有玩家增加技能充能
        resetSpells(SpellManager);
    }
});