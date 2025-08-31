var base = Module.findBaseAddress('DreadHungerServer-Win64-Shipping.exe');
function logInfo(Info) {
	var f = new File('output.log', 'a');
	f.write('[Patches] ' + Info + '\n');
	f.close();
}
var ADH_HumanCharacter_TakeDamage =  base.add(0xd73db0)
Interceptor.attach(ADH_HumanCharacter_TakeDamage, {
    onEnter: function(args) {
        //logInfo('ADH_HumanCharacter_TakeDamage');
        try{
            var ADH_HumanCharacterTaken = args[0];
            var ADH_HumanCharacterCauser = args[4];
            //logInfo('ADH_HumanCharacterTaken ' + ADH_HumanCharacterTaken + ' ' + 'ADH_HumanCharacterCauser ' + ADH_HumanCharacterCauser);
            if(ADH_HumanCharacterTaken.equals(ADH_HumanCharacterCauser)){
                //logInfo('ADH_HumanCharacterTaken == ADH_HumanCharacterCauser');
                return;
            }
            // 添加空指针检查
            if (ADH_HumanCharacterTaken.isNull() || ADH_HumanCharacterCauser.isNull()) {
                //logInfo('Null character pointer detected' + ' ' + ADH_HumanCharacterCauser + ' ' + ADH_HumanCharacterTaken);
                return;
            }
            
            var ADH_PlayerStateTaken = ADH_HumanCharacterTaken.add(0x240).readPointer();
            var ADH_PlayerStateCauser = ADH_HumanCharacterCauser.add(0x240).readPointer();
            var bIsDoppelganger = ADH_HumanCharacterTaken.add(0x11D2).readU8();
            //logInfo('ADH_PlayerStateTaken ' + ADH_PlayerStateTaken + ' ' + 'ADH_PlayerStateCauser ' + ADH_PlayerStateCauser + ' ' + 'bIsDoppelganger ' + bIsDoppelganger);
            
    
            // 添加PlayerState空指针检查
            if (ADH_PlayerStateTaken.isNull() || ADH_PlayerStateCauser.isNull()) {
                //logInfo('Null player state pointer detected'  + ' ' + ADH_PlayerStateTaken+ ' ' + ADH_PlayerStateCauser);
                return;
            }
            
            var IsThrall1 = ADH_PlayerStateTaken.add(0x572).readU8();
            var IsThrall2 = ADH_PlayerStateCauser.add(0x572).readU8();
            //logInfo(IsThrall1 + ' ' + IsThrall2)
            if((IsThrall1 == IsThrall2) && !bIsDoppelganger){
                
                args[1] = 0;
            }
        }catch(err){
            logInfo(err);
        }
        //logInfo('ADH_HumanCharacter_TakeDamage end');
    },
});