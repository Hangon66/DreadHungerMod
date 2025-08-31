function logInfo(Info) {
	var f = new File('output.log', 'a');
	f.write('[Patches] ' + Info + '\n');
	f.close();
}

try {
    var targetAddress = base.add(0xD9D27F); // 目标地址
    // 确保内存可写
    Memory.protect(targetAddress, 1, 'rwx');
    // 直接写入 1 字节：0x74
    targetAddress.writeU8(0x74);
    // 恢复内存保护（只读可执行）
    Memory.protect(targetAddress, 1, 'rx');


} catch (error) {
    
    logInfo("[*] 获取游戏基址失败");
}






