xxxx
var base = Module.findBaseAddress('DreadHungerServer-Win64-Shipping.exe');

//若启用无限物品丢弃该变量为1，关闭为0
var flag_end = 1;


// 向指定地址写入一字节 0x74
if (flag_end) {
    // 修改物品丢弃相关的条件跳转
    var targetAddress = base.add(0xD9D27F); // 目标地址
    // 确保内存可写
    Memory.protect(targetAddress, 1, 'rwx');
    // 直接写入 1 字节：0x74
    targetAddress.writeU8(0x74);
    // 恢复内存保护（只读可执行）
    Memory.protect(targetAddress, 1, 'rx');
}






