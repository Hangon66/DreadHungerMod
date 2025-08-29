var base = Module.findBaseAddress("DreadHungerServer-Win64-Shipping.exe");

//最大连跳次数
var max_jump = 2;

var ADH_HumanCharacter_ADH_HumanCharacter_addr = base.add(0xd49150);

Interceptor.attach(ADH_HumanCharacter_ADH_HumanCharacter_addr,{
	onEnter : function (args) {
		this.ADH_HumanCharacter = args[0];
	},
    onLeave : function(ret) {
		var Default_ADH_HumanCharacter = this.ADH_HumanCharacter.add(0x9A8).readPointer();
		// Default_ADH_HumanCharacter.add(0x344).writeU32(max_jump);
		this.ADH_HumanCharacter.add(0x344).writeU32(max_jump);
    }
});