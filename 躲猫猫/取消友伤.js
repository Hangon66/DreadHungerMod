var base = Module.findBaseAddress('DreadHungerServer-Win64-Shipping.exe');
function logInfo(Info) {
	var f = new File('output.log', 'a');
	f.write('[Patches] ' + Info + '\n');
	f.close();
}
var ADH_HumanCharacter_TakeDamage =  base.add(0xd73db0)
Interceptor.attach(ADH_HumanCharacter_TakeDamage, {
    onEnter: function(args) {
        logInfo('ADH_HumanCharacter_TakeDamage');
        try{
            var ADH_HumanCharacterTaken = args[0];
            var ADH_HumanCharacterCauser = args[4];
            
            // 添加空指针检查
            if (ADH_HumanCharacterTaken.isNull() || ADH_HumanCharacterCauser.isNull()) {
                logInfo('Null character pointer detected');
                return;
            }
            
            var ADH_PlayerStateTaken = ADH_HumanCharacterTaken.add(0x240).readPointer();
            var ADH_PlayerStateCauser = ADH_HumanCharacterCauser.add(0x240).readPointer();
            
            // 添加PlayerState空指针检查
            if (ADH_PlayerStateTaken.isNull() || ADH_PlayerStateCauser.isNull()) {
                logInfo('Null player state pointer detected');
                return;
            }
            
            var IsThrall1 = ADH_PlayerStateTaken.add(0x572).readU8();
            var IsThrall2 = ADH_PlayerStateCauser.add(0x572).readU8();
            if(IsThrall1 == IsThrall2){
                args[1] = 0;
            }
        }catch(err){
            logInfo(err);
        }
        
    },
});