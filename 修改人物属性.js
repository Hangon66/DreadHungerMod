var base = Module.findBaseAddress("DreadHungerServer-Win64-Shipping.exe");

//最大血量
var MaximumHealth = 200;
//最大连跳
var JumpMaxCount = 2;

//在下面加入要修改的属性
var TargetPlayerProperties = {
            "MaximumHealth" : MaximumHealth
            , "JumpMaxCount" : JumpMaxCount
            , "bUpdateHunger" : 0
            , "bUpdateWarmth" : 0
        };

var HumanCharacterPropertyOffsets = {
    'JumpMaxCount' : ['int32', 0x344],//连跳次数
	'MaximumHealth' : ['float', 0x7E0],//最大血量
    'CurrentHealth' : ['float', 0x94C],//当前血量
    'JumpStaminaConsumption' : ['float', 0x0A8C],//跳跃体力消耗
    'bNeverRevive' : ['int8', 0x0B24], // 是否禁止复活
    'bHideGhost' : ['int8', 0x0BC9], // 是否隐藏幽灵
    'bIsLobbyPawn' : ['int8', 0x11D0], // 是否无敌
    'MinHealth' : ['float', 0x1000], // 最小生命值
    'bUpdateHunger' : ['int8', 0x0A40], // 是否更新饥饿，不更新就不会自然恢复生命值
    'bUpdateWarmth' : ['int8', 0x0A41], // 是否更新体温
};

function processProperty(PropTable, Data, TargetObject) {
    for(var PropertyName in Data) {
        var Value = Data[PropertyName];
        if(PropTable.hasOwnProperty(PropertyName)) {
            var WriteType = PropTable[PropertyName][0];
            var Offset = PropTable[PropertyName][1];
            var TargetPointer = TargetObject.add(Offset);
            if(WriteType == 'int8') {
                TargetPointer.writeU8(Value);
            }
            else if(WriteType == 'int16') {
                TargetPointer.writeU16(Value);
            }
            else if(WriteType == 'int32') {
                TargetPointer.writeU32(Value);
            }
            else if(WriteType == 'int64') {
                TargetPointer.writeU64(Value);
            }
            else if(WriteType == 'float') {
                TargetPointer.writeFloat(Value);
            }
            
        }
    }
}

// 更新玩家属性
function updatePlayerProperty(PlayerState, propertyName, value) {
    // 检查玩家是否存在
    if (!PlayerProperties[PlayerState]) {
        // 如果不存在，创建新玩家条目
        PlayerProperties[PlayerState] = {};
    }
    
    // 更新属性
    PlayerProperties[PlayerState][propertyName] = value;

}

// 增加并应用玩家属性
function addPlayerProperty(PlayerState, propertyName, value) {
    //获取玩家属性
    getPlayerProperties(PlayerState);
    if(PlayerProperties[PlayerState] && 
        PlayerProperties[PlayerState][propertyName] !== undefined){
            //玩家和属性存在
            PlayerProperties[PlayerState][propertyName] += value;
            updatePlayerProperties(PlayerState, {}, 0);
        }

}

// 批量更新并应用玩家属性
function updatePlayerProperties(PlayerState, properties, flag) {
    // 检查玩家是否存在
    if (!PlayerProperties[PlayerState]) {
        // 如果不存在，创建新玩家条目
        PlayerProperties[PlayerState] = {};
    }
    
    // 批量更新属性
    for (var prop in properties) {
        PlayerProperties[PlayerState][prop] = properties[prop];
    }
    var RealPawn = PlayerState.add(0x638).readPointer();
    var PawnPrivate = PlayerState.add(0x280).readPointer();
    var Array = [RealPawn, PawnPrivate];
    for(var Pawn of Array){
        if(Pawn.isNull()) continue;
        processProperty(HumanCharacterPropertyOffsets, PlayerProperties[PlayerState], Pawn);
		if(flag){
			processProperty(HumanCharacterPropertyOffsets, {"CurrentHealth" : PlayerProperties[PlayerState]["MaximumHealth"]}, Pawn)
		}
    }
}

// 获取玩家特定属性
function getPlayerProperty(PlayerState, propertyName) {
    if (PlayerProperties[PlayerState] && 
        PlayerProperties[PlayerState][propertyName] !== undefined) {
        return PlayerProperties[PlayerState][propertyName];
    }else{
        var PlayerProperties = getPlayerProperties(PlayerState);
        return PlayerProperties[propertyName];
    }
}

// 获取玩家所有期望属性
function getPlayerProperties(PlayerState) {
    if (PlayerProperties[PlayerState]) {
        return PlayerProperties[PlayerState];
    }else{
        //若玩家属性不存在则获取实际玩家属性
        var PlayerProperties1 = getPlayerRealProperties(PlayerState);
        PlayerProperties[PlayerState] = PlayerProperties1 || {};
        return PlayerProperties[PlayerState];
    }
}

// 获取玩家实际属性
function getPlayerRealProperties(PlayerState) {
    var RealPawn = PlayerState.add(0x638).readPointer();
    var PawnPrivate = PlayerState.add(0x280).readPointer();
    var Pawn;
    var Properties = {};
    if(!RealPawn.isNull()){
        Pawn = RealPawn;
        logInfo("RealPawn: " + RealPawn);
    }else if(!PawnPrivate.isNull()){
        Pawn = PawnPrivate;
        //logInfo("PawnPrivate: " + PawnPrivate);
    }
    if(Pawn.isNull())return Properties;
    var JumpMaxCount = Pawn.add(0x344).readU32();
    var MaximumHealth = Pawn.add(0x7E0).readFloat();
    Properties["JumpMaxCount"] = JumpMaxCount;
    Properties["MaximumHealth"] = MaximumHealth;
    //logInfo('Properties: ' + Properties.toString());
    return Properties;
}




// 检查玩家是否存在
function hasPlayer(PlayerState) {
    return PlayerProperties.hasOwnProperty(PlayerState);
}



// 删除玩家
function removePlayer(PlayerState) {
    if (PlayerProperties[PlayerState]) {
        delete PlayerProperties[PlayerState];
        return true;
    }
    return false;
}
var PlayerProperties = [];

var ADH_HumanCharacter_AddStartingInventory_addr = base.add(0xd46f10);
Interceptor.attach(ADH_HumanCharacter_AddStartingInventory_addr, {
    onEnter: function (args) {
        var ADH_HumanCharacter = args[0];
        var ADH_PlayerState = ADH_HumanCharacter.add(0x240).readPointer();
		this.ADH_PlayerState = ADH_PlayerState;
        var SelectedRole = ADH_PlayerState.add(0x590).readPointer();
        var number = SelectedRole.add(0x58).readU8();    
    },onLeave : function (ret) { 
		var ADH_PlayerState = this.ADH_PlayerState;
		updatePlayerProperties(ADH_PlayerState, TargetPlayerProperties, 1);
    }
})

var ADH_BrigCell_FreePrisoner_addr = base.add(0xE69380);
Interceptor.attach(ADH_BrigCell_FreePrisoner_addr, {
    onEnter: function (args) {
        this.ADH_BrigCell = args[0];
        
    },onLeave : function (ret) { 
		var ADH_BrigCell = this.ADH_BrigCell;
        var ADH_PlayerState = ADH_BrigCell.add(0x2F0).readPointer();
		updatePlayerProperties(ADH_PlayerState, {}, 1);
    }
})