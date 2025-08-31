var base = Module.findBaseAddress('DreadHungerServer-Win64-Shipping.exe');
var ADH_ArmoryDoor_Tick_addr = base.add(0xE73240);
var UObject_GetWorld = new NativeFunction(base.add(0x13075A0), 'pointer', ['pointer'], 'win64');


Interceptor.attach(ADH_ArmoryDoor_Tick_addr, {
    onEnter : function(args) {
        this.ArmoryLockComponent = args[1];
    },
    onLeave : function(ret) {
        var ArmoryLockComponent = this.ArmoryLockComponent;
        var World = UObject_GetWorld(ArmoryLockComponent);
        var GameState = World.add(0x120).readPointer();
        var DaysUntilBlizzard = GameState.add(0x484).readU32();
        if(GameState.isNull()) {
            return;
        }
        if(DaysUntilBlizzard == 1){
            this.context.rax = 1;
        }
        
    }
});