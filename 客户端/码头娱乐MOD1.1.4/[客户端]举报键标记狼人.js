var base = Module.findBaseAddress('DreadHunger-Win64-Shipping.exe');

var FDH_RoleIconPreset_ThrallInverted = new NativeFunction(base.add(0xfefe30), 'pointer', ['pointer']);
var UDH_ScoreboardUtility_GetRoleIcon = new NativeFunction(base.add(0xfc90c0), 'pointer', ['pointer', 'pointer']);
var UImage_SetBrushResourceObject = new NativeFunction(base.add(0x2457f10), 'void', ['pointer', 'pointer']);
var UDH_LobbySlotWidget_UpdateAvatarImage = new NativeFunction(base.add(0x1031060), 'void', ['pointer', 'pointer']);
var FWeakObjectPtr_Get = new NativeFunction(base.add(0x13e6cf0), 'pointer', ['pointer']);

// function logInfo(Info) {
// 	var f = new File('output.log', 'a');
// 	f.write('[Patches] ' + Info + '\n');
// 	f.close();
// }

var UDH_LobbySlotWidget = null;
var UDH_LobbySlotWidget_OnLobbyButtonClicked = base.add(0x10219e0)
Interceptor.attach(UDH_LobbySlotWidget_OnLobbyButtonClicked, {
    onEnter : function(args){
        UDH_LobbySlotWidget = args[0];
    }, 
    onLeave : function(){}
});

var UDH_PlayerContextMenuWidget_OnReportButtonClicked = base.add(0x10259f0)
Interceptor.replace(UDH_PlayerContextMenuWidget_OnReportButtonClicked, new NativeCallback(function (thisPtr, UDH_ButtonWidget){

        var flag = UDH_LobbySlotWidget.add(0x269).readU8();
        var ADH_PlayerState = FWeakObjectPtr_Get(UDH_LobbySlotWidget.add(0x318));
        var UDH_PlayerRoleData = ADH_PlayerState.add(0x590).readPointer();
        if(flag == 0){
            var resultPtr = Memory.alloc(0x40);
            var p_Preset = FDH_RoleIconPreset_ThrallInverted(resultPtr);
            var RoleIcon = UDH_ScoreboardUtility_GetRoleIcon(UDH_PlayerRoleData, p_Preset);
            UImage_SetBrushResourceObject(UDH_LobbySlotWidget.add(0x2C0).readPointer(), RoleIcon);
            UDH_LobbySlotWidget.add(0x269).writeU8(1);
        }else{
            UDH_LobbySlotWidget_UpdateAvatarImage(UDH_LobbySlotWidget, UDH_PlayerRoleData);
            UDH_LobbySlotWidget.add(0x269).writeU8(0);
        }
    },
        'void',                    // 返回类型
        ['pointer', 'pointer']  // 参数类型: 
    ));

// 显示举报按钮
var targetAddress = base.add(0x1031465);
Memory.protect(targetAddress, 2, 'rwx'); // 确保内存可写
Memory.patchCode(targetAddress, 2, function (code) {
    var writer = new X86Writer(code, { pc: targetAddress });
    writer.putNop(); // 用NOP指令替换原来的指令
    writer.putNop();
    writer.flush();
});
Memory.protect(targetAddress, 2, 'rx'); // 恢复内存保护