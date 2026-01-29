
var Switch = 0; //码头拉扯伤害开启开关，1为开，0为关
//血量归0后会爆装备，视为战败
var base = Module.findBaseAddress("DreadHunger-Win64-Shipping.exe");
var ADH_HumanCharacter_openDamage_addr = base.add(0xDEDDB4);
var ADH_HumanCharacter_down_addr = base.add(0xDCB38A);
var ADH_HumanCharacter_isCloneedDied_addr = base.add(0xDCB556);
var ADH_HumanCharacter_toDied_addr = base.add(0xDCB538);

if(Switch){
	//开启码头伤害
	Memory.protect(ADH_HumanCharacter_openDamage_addr, 3, 'rwx'); // 确保内存可写
	Memory.patchCode(ADH_HumanCharacter_openDamage_addr, 3, function (code) {
    var writer = new X86Writer(code, { pc: ADH_HumanCharacter_openDamage_addr });
		writer.putNop(); // 用NOP指令替换原来的指令
		writer.putNop();
		writer.putNop();
		writer.flush();
	});
	Memory.protect(ADH_HumanCharacter_openDamage_addr, 3, 'rx'); // 恢复内存保护
	
	//修改分身死亡判断为真
	Memory.protect(ADH_HumanCharacter_isCloneedDied_addr, 6, 'rwx'); // 确保内存可写
	Memory.patchCode(ADH_HumanCharacter_isCloneedDied_addr, 6, function (code) {
    var writer = new X86Writer(code, { pc: ADH_HumanCharacter_isCloneedDied_addr });
		writer.putNop(); // 用NOP指令替换原来的指令
		writer.putNop();
		writer.putNop();
		writer.putNop();
		writer.putNop();
		writer.putNop();
		writer.flush();
	});
	Memory.protect(ADH_HumanCharacter_isCloneedDied_addr, 6, 'rx'); // 恢复内存保护
	
	//跳过人物倒地执行函数
	Memory.protect(ADH_HumanCharacter_down_addr, 5, 'rwx'); // 确保内存可写
	Memory.patchCode(ADH_HumanCharacter_down_addr, 5, function (code) {
    var writer = new X86Writer(code, { pc: ADH_HumanCharacter_down_addr });
		writer.putNop(); // 用NOP指令替换原来的指令
		writer.putNop();
		writer.putNop();
		writer.putNop();
		writer.putNop();
		writer.flush();
	});
	Memory.protect(ADH_HumanCharacter_down_addr, 5, 'rx'); // 恢复内存保护
	
	//跳过人物死亡函数
	Memory.protect(ADH_HumanCharacter_toDied_addr, 5, 'rwx'); // 确保内存可写
	Memory.patchCode(ADH_HumanCharacter_toDied_addr, 5, function (code) {
    var writer = new X86Writer(code, { pc: ADH_HumanCharacter_toDied_addr });
		writer.putNop(); // 用NOP指令替换原来的指令
		writer.putNop();
		writer.putNop();
		writer.putNop();
		writer.putNop();
		writer.flush();
	});
	Memory.protect(ADH_HumanCharacter_toDied_addr, 5, 'rx'); // 恢复内存保护
}
