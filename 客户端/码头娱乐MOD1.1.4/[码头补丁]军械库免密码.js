
var Switch = 1;//军械库免密码开关

if(Switch){
	var base = Module.findBaseAddress("DreadHunger-Win64-Shipping.exe");
	var ADH_ArmoryDoor_Tick_addr = base.add(0xEEB100);
	var UObject_GetWorld = new NativeFunction(base.add(0x1380FD0), 'pointer', ['pointer'], 'win64');


	Interceptor.attach(ADH_ArmoryDoor_Tick_addr, {
		onEnter : function(args) {
			this.ArmoryLockComponent = args[0];
		},
		onLeave : function(ret) {
			var ArmoryLockComponent = this.ArmoryLockComponent;
			var World = UObject_GetWorld(ArmoryLockComponent);
			var GameState = World.add(0x120).readPointer();
			var BlizzardStarted = GameState.add(0x359).readU8();

			this.context.rax = 1;

		}
	});
}
