var base = Module.findBaseAddress("DreadHungerServer-Win64-Shipping.exe");
//本插件不能跳,跳了就再也跑不起来了
var ADH_HumanCharacter_ModifyStamina_addr = base.add(0xD5E0D0);

Interceptor.attach(ADH_HumanCharacter_ModifyStamina_addr, {
		onEnter : function(args) {
			var rcx_temp = this.context.rcx;
			this.Stamina_addr = rcx_temp.add(0XA50);
		},
		onLeave : function(ret) {
			this.Stamina_addr.writeFloat(3.0);
		}
	});