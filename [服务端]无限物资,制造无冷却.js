var base = Module.findBaseAddress('DreadHungerServer-Win64-Shipping.exe');

//若启用无限物品丢弃该变量为1，关闭为0
var enableFeature_diuqi = 0;
//若启用子弹无消耗该变量为1，关闭为0
var enableFeature_zidan = 0;
//若启用制造无消耗该变量为1，关闭为0					
var enableFeature_zhizao = 0;
//若启用制造无冷却该变量为1，关闭为0
var enableFeature_NoMakeTime = 1;


// 跳过特定的汇编指令
if (enableFeature_diuqi) {
	// 跳过物品丢弃
	var targetAddress = base.add(0xE3B675);
	Memory.protect(targetAddress, 4, 'rwx'); // 确保内存可写
	Memory.patchCode(targetAddress, 4, function (code) {
		var writer = new X86Writer(code, { pc: targetAddress });
		writer.putNop(); // 用NOP指令替换原来的指令
		writer.putNop();
		writer.putNop();
		writer.putNop();
		writer.flush();
	});
	Memory.protect(targetAddress, 4, 'rx'); // 恢复内存保护
}
if (enableFeature_zidan) {
	// 跳过子弹消耗
	var targetAddress1 = base.add(0xE3A3C3);
	Memory.protect(targetAddress1, 3, 'rwx'); // 确保内存可写
	Memory.patchCode(targetAddress1, 3, function (code) {
    var writer = new X86Writer(code, { pc: targetAddress1 });
		writer.putNop(); // 用NOP指令替换原来的指令
		writer.putNop();
		writer.putNop();
		writer.flush();
	});
	Memory.protect(targetAddress1, 3, 'rx'); // 恢复内存保护
}

if (enableFeature_zhizao) {
	// 跳过制造消耗
	var targetAddress2 = base.add(0xE5855C);
	Memory.protect(targetAddress2, 3, 'rwx'); // 确保内存可写
	Memory.patchCode(targetAddress2, 3, function (code) {
    var writer = new X86Writer(code, { pc: targetAddress2 });
		writer.putNop(); // 用NOP指令替换原来的指令
		writer.putNop();
		writer.putNop();
		writer.flush();
	});
	Memory.protect(targetAddress2, 3, 'rx'); // 恢复内存保护
}

if (enableFeature_NoMakeTime) {
	// 跳过制造等待
	var targetAddress3 = base.add(0xDAF5A6);
	Memory.protect(targetAddress3, 2, 'rwx'); // 确保内存可写
	Memory.patchCode(targetAddress3, 2, function (code) {
		var writer = new X86Writer(code, { pc: targetAddress3 });
		writer.putNop(); // 用NOP指令替换原来的指令
		writer.putNop();
		writer.flush();
	});
	Memory.protect(targetAddress3, 2, 'rx'); // 恢复内存保护
}







