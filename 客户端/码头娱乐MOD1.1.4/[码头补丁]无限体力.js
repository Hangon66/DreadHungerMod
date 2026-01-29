
var Switch = 1; //无限体力开关，1为开，0为关

if(Switch){
	var base = Module.findBaseAddress("DreadHunger-Win64-Shipping.exe");
	var ADH_HumanCharacter_ModifyStamina_addr = base.add(0xDD83B0);

	Interceptor.attach(ADH_HumanCharacter_ModifyStamina_addr, {
		onEnter : function(args) {
			var rcx_temp = this.context.rcx;
			this.Stamina_addr = rcx_temp.add(0XA50);
		},
		onLeave : function(ret) {
			this.Stamina_addr.writeFloat(3.0);
		}
	});
}
