var Switch = 1; //取消码头伤害开关开关，1为开，0为关

if(Switch){
	var base = Module.findBaseAddress("DreadHunger-Win64-Shipping.exe");
	var ADH_HumanCharacter_ModifyStamina_addr = base.add(0xEE3490);

	Interceptor.attach(ADH_HumanCharacter_ModifyStamina_addr, {
		onEnter : function(args) {
			var rcx_temp = this.context.rcx;
			this.temp_addr = rcx_temp.add(0X288);
			this.temp_addr.writeU32(0x0);
		},
		onLeave : function(ret) {
			
			
		}
	});
}
