var Switch = 0;//开启为1，关闭为0
if(Switch){
	var base = Module.findBaseAddress("DreadHunger-Win64-Shipping.exe");
	var ADH_GameMode_SpawnDefaultPawnAtTransform_Implementation =  base.add(0x291c640)
	Interceptor.attach(ADH_GameMode_SpawnDefaultPawnAtTransform_Implementation, {
		onEnter: function(args) {
			var Transform = args[2]
			Transform.add(32).writeFloat(0.2);	//长
			Transform.add(36).writeFloat(0.2);	//宽
			Transform.add(40).writeFloat(0.2);	//高
		},
	});
}
