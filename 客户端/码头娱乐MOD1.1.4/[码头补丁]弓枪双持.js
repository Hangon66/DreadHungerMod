//开关开启为1，关闭为0
var Switch = 0;	

if(Switch){
	var base = Module.findBaseAddress("DreadHunger-Win64-Shipping.exe");
	var UDH_InventoryManager_FindRangedWeapon_addr = base.add(0xE3D520);
	Interceptor.replace(UDH_InventoryManager_FindRangedWeapon_addr, new NativeCallback(function(){
    return ptr(0);
	}, 'pointer', ['pointer', 'pointer', 'pointer']));
}
