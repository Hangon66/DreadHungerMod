var base = Module.findBaseAddress('DreadHungerServer-Win64-Shipping.exe');
var FName_FName = new NativeFunction(base.add(0x1158F20), "void", ["pointer", "pointer", "int8"]);
var FText_FromName = new NativeFunction(base.add(0x1096370), "pointer", ["pointer","pointer"]);
var ADH_PlayerController_ReceiveThrallMessage = new NativeFunction(base.add(0xEE7810), "void", ["pointer", "pointer", "pointer"]);
var UGameplayStatics_GetPlayerController = new NativeFunction(base.add(0x25630D0), 'pointer', ['pointer', 'int32']);

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

var MessageList = [
"弓100,军刀50", 
"好人无敌直到暴风雪前一天", 
"开局20秒躲藏, 不能下水，坚持到暴风雪躲藏者胜利", 
]

function SendMessages(PlayerController, MessageList) {
	var count = 0;
	var timer = null;
	function sendMessages () {
	    for (let i = 0; i < MessageList.length; ++i) {
		    SendThrallMessage(PlayerController,MessageList[i],ptr(0))
	    }
	    count++;
	    if (count == 3) {
	        clearInterval(timer);
	    }
	}
	sendMessages ();
	timer = setInterval(sendMessages, 10000);
}

var ADH_PlayerState_SetPlayerRole = base.add(0xE4F390)
Interceptor.attach(ADH_PlayerState_SetPlayerRole,{
	onEnter : function (args) {
		var ADH_PlayerState = args[0]
		var PlayerId = ADH_PlayerState.add(0x224).readU8()
		var PlayerController = UGameplayStatics_GetPlayerController(ADH_PlayerState,PlayerId)
		SendMessages(PlayerController, MessageList)
	}
});