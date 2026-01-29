
//开启播报为1，关闭播报为0
var MessageSwitch = 1;

//播报重复次数
var MessagesCount = 2;

//播报内容
var MessageList = [
 "玩家加入",
 "",
 "",
 ""
]


var base = Module.findBaseAddress("DreadHunger-Win64-Shipping.exe");
var FName_FName = new NativeFunction(base.add(0x11D04D0), "void", ["pointer", "pointer", "int8"]);
var FText_FromName = new NativeFunction(base.add(0x110DC20), "pointer", ["pointer","pointer"]);
var ADH_PlayerController_ReceiveThrallMessage = new NativeFunction(base.add(0xF5F580), "void", ["pointer", "pointer", "pointer"]);
var UGameplayStatics_GetPlayerController = new NativeFunction(base.add(0x2906300), 'pointer', ['pointer', 'int32']);
var ADH_PlayerState_SetPlayerRole = base.add(0xEC6F20);


function newFName(Name) {
    var FName_Buffer = Memory.alloc(8);
    var Buffer = Memory.alloc((Name.length + 4) * 2);
    Buffer.writeUtf16String("   " + Name);
    FName_FName(FName_Buffer,Buffer,1)
    return FName_Buffer
}
function FNameToFText(FName){
    var FText_Buffer = Memory.alloc(24)
    FText_FromName(FText_Buffer,FName)
    return FText_Buffer
}
function SendThrallMessage(PlayerController,Message,Usound){
    var FName_Message = newFName(Message)
    var FText_Message = FNameToFText(FName_Message)
    ADH_PlayerController_ReceiveThrallMessage(PlayerController,FText_Message,Usound)
}



function SendMessages(PlayerController, MessageList) {
	var count = 0;
	var timer = null;
	function sendMessages () {
	    for (let i = 0; i < MessageList.length; ++i) {
		    SendThrallMessage(PlayerController,MessageList[i],ptr(0))
	    }
	    count++;
	    if (count == MessagesCount) {
	        clearInterval(timer);
	    }
	}
	sendMessages ();
	timer = setInterval(sendMessages, 10000);
}


Interceptor.attach(ADH_PlayerState_SetPlayerRole,{
	onEnter : function (args) {
		if(MessageSwitch == 1){
			var ADH_PlayerState = args[0]
			var PlayerController = ADH_PlayerState.add(0xE0).readPointer();
			SendMessages(PlayerController, MessageList);
		}
	}
});