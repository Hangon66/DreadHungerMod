var base = Module.findBaseAddress('DreadHungerServer-Win64-Shipping.exe');

var enableFeature_NoMakeTime = 1;

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







