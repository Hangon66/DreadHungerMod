var roleNames = {
    1: "船长",
    2: "工程师",
    3: "猎人",
    4: "厨子",
    5: "导航",
    6: "牧师",
    7: "枪手",
    8: "医生"
}
var ThrallsRole = 2;    //躲藏者角色
var ExplorerRole = 3;   //抓捕者角色
var MaxPlayers = 8;     //最大玩家数
var MaxExplorer = 2;     //最大抓捕者
var DeathUnpossessDelay = 25;   //抓捕者复活延迟

//0=小枪,1=子弹,2=磨刀石,3=斧头,4=炸药桶 5=钥匙 6=铁 7=木板 8=弓 9=箭 10=大枪 11=导管 
// 12=煤炭 13=灯笼 14=火药 15=草药 16=毒药 17=解毒剂 18=骨头 19=冰稿 20=茶 21=石头 
// 22=铲子 23=炖肉 24=鸦片酊 25=针 26=菜刀 27=煤炭桶 28=军刀 29=夹子
//抓捕者装备
var RoleInitInventory = new Map([
    ['Explorer', [
        [8,1],
        [28,1],
        [24,5],
        [23,99],
        [29,30],
        [9,200]
    ]]
]);
function logInfo(Info) {
	var f = new File('output.log', 'a');
	f.write('[Patches] ' + Info + '\n');
	f.close();
}

var base = Module.findBaseAddress('DreadHungerServer-Win64-Shipping.exe');
var ADH_HumanCharacter_Died_addr = base.add(0xd50cb0);
var ADH_HumanCharacter_Died = new NativeFunction(base.add(0xd50cb0), 'void', ['pointer', 'pointer', 'pointer', 'float'], 'win64');
var ADH_PlayerState_SetIsDead_addr = base.add(0xE4E700);
var ADH_PlayerState_SetIsDead = new NativeFunction(base.add(0xE4E700), 'void', ['pointer', 'int8'], 'win64');
var UClass_GetPrivateStaticClass = new NativeFunction(base.add(0x11F02E0), 'pointer', [], 'win64');
var StaticLoadObject = new NativeFunction(base.add(0x137B290), 'pointer', ['pointer', 'pointer', 'pointer', 'pointer', 'int32', 'pointer', 'int8', 'pointer'], 'win64');
var StaticFindObject = new NativeFunction(base.add(0x137AAA0), 'pointer', ['pointer', 'pointer', 'pointer', 'int8'], 'win64');
var UDH_GameplayStatics_BroadcastGameplayMessage = new NativeFunction(base.add(0xe8d050), 'void', ['pointer', 'pointer', 'pointer', 'pointer'], 'win64');
var FName_FName = new NativeFunction(base.add(0x1158F20), "void", ["pointer", "pointer", "int8"], 'win64');
var FText_FromName = new NativeFunction(base.add(0x1096370), "pointer", ["pointer","pointer"], 'win64');
var GWorld = base.add(0x46ED420);//7FF60EEFD420
//var GWorld = base.add(0x45F0710).readPointer().add(0x3A8);
//var GWorld = base.add(0x46ECF70).readPointer().add(0x3A8);
var ADH_GameMode_RandomizeThralls_addr = base.add(0xda4620);
var ADH_GameMode_WarshipEscaped = new NativeFunction(base.add(0xdb2c30), 'void', ['pointer', 'int8'], 'win64');


function randomNum(max) {
  return Math.floor(Math.random() * max);
}
function getGameState()
{
    var AuthorityGameMode = GWorld.readPointer().add(0x118).readPointer();
    var GameState = AuthorityGameMode.add(0x280).readPointer();
    return GameState;
}

var ThrallRemainingLife = 0;
var ExplorerRemainingLife = 0;
var Message = "躲藏者剩余命数";

function findClassByName(ClassName) {
    return findObjectByName(ClassName, UClass_GetPrivateStaticClass());
}

function findObjectByName(ObjectName, Clazz) {
    var Buffer = Memory.alloc((ObjectName.length + 1) * 2);
    Buffer.writeUtf16String(ObjectName);
    return StaticFindObject(Clazz, ptr(0xFFFFFFFFFFFFFFFF), Buffer, 0);
}

function newFName(Name) {
    var FName_Buffer = Memory.alloc(8);
    var Buffer = Memory.alloc((Name.length + 4) * 2);
    Buffer.writeUtf16String("   " + Name);
    FName_FName(FName_Buffer,Buffer,1)
    return FName_Buffer;
}
function FNameToFText(FName){
    var FText_Buffer = Memory.alloc(24)
    FText_FromName(FText_Buffer,FName)
    return FText_Buffer;
}
function SendBroadMessage(object, message){
    var FName_Message = newFName(message);
    var FText_Message = FNameToFText(FName_Message);
    UDH_GameplayStatics_BroadcastGameplayMessage(object, FText_Message, ptr(0), ptr(0));
}


function getArraySize(TArray){
    return TArray.add(8).readU32();
}

function getArrayItemAddr(TArray, size, index){
    var ArrNum = getArraySize(TArray);
    if(index > ArrNum)
        return null;
    return TArray.readPointer().add(index * size);
}

//计算躲藏者剩余命数
function getRemainingTotalLife(GameState) {
    var PlayerArray = GameState.add(0x238);
    ThrallRemainingLife = 0;
    ExplorerRemainingLife = 0;
    var AliveThrallPlayerNum = 0;
    var NoAliveFlag = true;
    for(var i = 0; i < getArraySize(PlayerArray); i++) {
        var PlayerState = getArrayItemAddr(PlayerArray, 8, i).readPointer();
        var DeathCount = PlayerState.add(0x630).readU32();
		// var bHasDied = PlayerState.add(0x3F0).readU8();
        var IsThrall = PlayerState.add(0x572).readU8();
        var bIsDead = PlayerState.add(0x570).readU8();
        var bIsDisconnected = PlayerState.add(0x571).readU8();
        
		if(!bIsDisconnected){
            if(IsThrall){
                ThrallRemainingLife += (2 - DeathCount);
                if(DeathCount < 2){
                    AliveThrallPlayerNum++;
                }
            }else{ 
                ExplorerRemainingLife += (2 - DeathCount);
            }
		}

        if(!bIsDead){
            NoAliveFlag = false;
        }
    }

    if(AliveThrallPlayerNum == 1 && ThrallRemainingLife > 0){
        ThrallRemainingLife = 1;
    }

    if(NoAliveFlag){
        ThrallRemainingLife = 0;
    }

    return ThrallRemainingLife;
}

//计算躲藏者剩余命数
function sendRemainingTotalLife() {
    var GameState = getGameState();
    getRemainingTotalLife(GameState);
    Message = "躲藏者剩余命数" + ThrallRemainingLife +"\n\n\n";
    //logInfo("躲藏者剩余命数" + RemainingLife);
    SendBroadMessage(GameState, Message);
}

Interceptor.attach(ADH_HumanCharacter_Died_addr, {
    onEnter : function(args) {
        this.ADH_HumanCharacter = args[0];
        var ADH_HumanCharacter = args[0];
        var ADH_PlayerState = ADH_HumanCharacter.add(0x240).readPointer();
        this.IsThrall = ADH_PlayerState.add(0x572).readU8(); 
    },onLeave : function(retval) {
        try{
            var ADH_HumanCharacter = this.ADH_HumanCharacter;
            var IsThrall = this.IsThrall;
            if(IsThrall){
                sendRemainingTotalLife();
            }else{
                var ADH_GameState = getGameState();
                var ADH_GameMode = ADH_GameState.add(0x228).readPointer();
                getRemainingTotalLife(ADH_GameState);
                if(ExplorerRemainingLife <= 0){
                    SendBroadMessage(ADH_GameState, "你们打倒了抓捕者,躲藏者胜利");
                    var timer = setTimeout(function(){
                        ADH_GameMode_WarshipEscaped(ADH_GameMode, 1);
                    },8000);
                }
            }
        }catch(e){
            logInfo(e);
        }
    }
});


/* 
    随机角色&指定躲藏者 
 */



var roles = [];
 /* 加入躲藏者 */
 for(var i = 0; i < MaxPlayers - MaxExplorer; i++) {
     roles.push(ThrallsRole);
 }

// /* 加入抓捕者 */
 for(var i = 0; i < MaxExplorer; i++) {
     roles.push(ExplorerRole);
 }


function getRolePlayerStates(GameState, role) {
    var PlayerArray = GameState.add(0x238);
    var ShuffleArray = [];
    for(var i = 0; i < getArraySize(PlayerArray); i++) {
        var PlayerState = getArrayItemAddr(PlayerArray, 8, i).readPointer();
        var SelectedRole = PlayerState.add(0x590).readPointer();
        var number = SelectedRole.add(0x58).readU8(); 
		if(number == role){
            ShuffleArray.push(PlayerState);    
		}
    }
    return ShuffleArray;
}

function getExplorerPlayerStates(GameState) {
    var PlayerArray = GameState.add(0x238);
    var ShuffleArray = [];
    for(var i = 0; i < getArraySize(PlayerArray); i++) {
        var PlayerState = getArrayItemAddr(PlayerArray, 8, i).readPointer();
        // var SelectedRole = PlayerState.add(0x590).readPointer();
        // var number = SelectedRole.add(0x58).readU8(); 
        var IsThrall = PlayerState.add(0x572).readU8();
		if(!IsThrall){
            ShuffleArray.push(PlayerState);    
		}
    }
    return ShuffleArray;
}


/**
 * 随机角色
 */
var ADH_PlayerState_SetPlayerRole = base.add(0xE4F390);
var UDH_PlayerRoleData_FindByType = new NativeFunction(base.add(0xE33300), "size_t", ["char", "pointer"], 'win64');
var ADH_PlayerState_SetPlayerRole_Interceptor = Interceptor.attach(ADH_PlayerState_SetPlayerRole, {
	onEnter : function (args) {
		var ADH_PlayerState=args[0];
		var index = randomNum(roles.length);
		var role = roles[index];
		var New_UDH_PlayerRoleData = UDH_PlayerRoleData_FindByType(role,ADH_PlayerState);
		roles.splice(index, 1);
        args[1] = ptr(New_UDH_PlayerRoleData);
	}
});

var UDH_GameplayStatics_IsRoleTaken = base.add(0xe93a70)
var UDH_GameplayStatics_IsRoleTaken_Interceptor = Interceptor.attach(UDH_GameplayStatics_IsRoleTaken,{
    onLeave : function (retval) {
        retval.replace(0)
    }
});

var ADH_PlayerState_SetIsThrall = new NativeFunction(base.add(0xE4E880), 'void', ['pointer', 'int8'], 'win64');

Interceptor.replace(ADH_GameMode_RandomizeThralls_addr, new NativeCallback(function(){
    var GameState = getGameState();
    var ThrallsPlayerState = getRolePlayerStates(GameState, ThrallsRole);
    for(var i = 0; i < ThrallsPlayerState.length; i++) {
        ADH_PlayerState_SetIsThrall(ThrallsPlayerState[i], 1);
    }
}, 'void', ['pointer']));


/*
    开局抓捕者死亡延迟复活  
*/
var ADH_BrigCell_AddPrisoner = base.add(0xE5D180);
var ADH_BrigCell_FreePrisoner = new NativeFunction(base.add(0xE69380), 'int8', ['pointer', 'pointer'], 'win64');
var ADH_BrigDoor_OnUnlockCraftComplete = new NativeFunction(base.add(0xe7bd90), 'void', ['pointer', 'pointer', 'pointer'], 'win64');
var BrigCellFlag = false;
var BrigCells = [];
var ADH_HumanCharacter_SetIsSpiritWalking = new NativeFunction(base.add(0xD70310), 'void', ['pointer', 'int8', 'float'], 'win64');
var AActor_SetActorRelativeScale3D = new NativeFunction(base.add(0x22e88b0), 'void', ['pointer', 'pointer'], 'win64');
var UCapsuleComponent_SetCapsuleSize = new NativeFunction(base.add(0x2407250), 'void', ['pointer', 'float', 'float', 'int8'], 'win64');
var USceneComponent_UpdateComponentToWorld = new NativeFunction(base.add(0x79cf20),'void', ['pointer', 'int32', 'int8'],'win64');
var AActor_ForceNetUpdate = new NativeFunction(base.add(0x22d8050), 'void', ['pointer'], 'win64');

function FreePrisonerExplorer() {
    for(var i = 0; i < BrigCells.length; i++){
        var ADH_BrigCell = BrigCells[i];
        ADH_BrigCell_FreePrisoner(ADH_BrigCell, ptr(0));
    }
}

function setActorRelativeScale3D(ADH_HumanCharacter, scaleX, scaleY, scaleZ) {
    try {
        // 检查输入参数
        if (!ADH_HumanCharacter || ADH_HumanCharacter.isNull()) {
            logInfo("[SetActorRelativeScale3D] 错误: ADH_HumanCharacter 为空或无效");
            return false;
        }
        
        // 验证缩放值
        if (typeof scaleX !== 'number' || typeof scaleY !== 'number' || typeof scaleZ !== 'number') {
            logInfo("[SetActorRelativeScale3D] 错误: 缩放值必须是数字");
            return false;
        }
        
        // 创建 FVector 结构体来存储缩放值
        // FVector 结构: X (4 bytes) + Y (4 bytes) + Z (4 bytes) = 12 bytes
        var scaleVector = Memory.alloc(12);
        scaleVector.writeFloat(scaleX);
        scaleVector.add(4).writeFloat(scaleY);
        scaleVector.add(8).writeFloat(scaleZ);
        
        // 调用 AActor::SetActorRelativeScale3D 函数
        AActor_SetActorRelativeScale3D(ADH_HumanCharacter, scaleVector);
        
        //logInfo(`[SetActorRelativeScale3D] 成功设置角色缩放为 X:${scaleX}, Y:${scaleY}, Z:${scaleZ}`);
        return true;
    } catch (error) {
        logInfo(`[SetActorRelativeScale3D] 设置缩放时发生错误: ${error}`);
        return false;
    }
}

Interceptor.attach(ADH_BrigCell_AddPrisoner, {
    onEnter: function (args) {
        this.ADH_BrigCell = args[0];
        
    },
    onLeave: function (ret) {
        var ADH_BrigCell = this.ADH_BrigCell;
        var PlayerState = ADH_BrigCell.add(0x2F0).readPointer();
        var IsThrall = PlayerState.add(0x572).readU8();
        try{
            ADH_BrigCell_FreePrisoner(ADH_BrigCell, ptr(0));
        }catch(e){
            logInfo(e);
        }
        
        var ADH_PlayerController = PlayerState.add(0xE0).readPointer();
        var ADH_HumanCharacter = ADH_PlayerController.add(0x588).readPointer();
        //var ADH_BrigDoor = ADH_BrigCell.add(0x300).readPointer();
        try{
            setActorRelativeScale3D(ADH_HumanCharacter, 0.3, 0.3, 0.3);
        }catch(e){
            logInfo(e);
        }
        if(!IsThrall){
            //发送抓捕者复活物资
            InitExplorerInventory(PlayerState);
            //设置无敌
            ADH_HumanCharacter.add(0x11D0).writeU8(1);
        }else{
            //狼人复活灵界
            ADH_HumanCharacter_SetIsSpiritWalking(ADH_HumanCharacter, 1, 8);
        }
        // if(!BrigCellFlag  && !IsThrall){

        //     if(BrigCells.length < MaxExplorer){
        //         BrigCells.push(ADH_BrigCell);
        //     }
            
        //     if(BrigCells.length >= MaxExplorer){
        //         // 设置单次定时器
        //         var timer = setTimeout(FreePrisonerExplorer, 3000);//20秒
        //         BrigCellFlag = true;
        //     }
        // }else{
        //     ADH_BrigCell_FreePrisoner(ADH_BrigCell, ptr(0));
        // }
    }
})

/**
 * 抓捕者开局死亡
 */

var ADH_HumanCharacter_AddStartingInventory_addr = base.add(0xd46f10);
var ADH_GameMode_FinishRestartPlayer_addr = base.add(0xd8fcf0);
var ADH_HumanCharacter_AddStartingInventory = new NativeFunction(base.add(0xd46f10), 'void', ['pointer', 'pointer'], 'win64');
var UDH_InventoryManager_AddInventory = new NativeFunction(base.add(0xDBC040), 'void', ['pointer', 'pointer', 'pointer', 'pointer', 'pointer', 'int8', 'pointer'], 'win64');
function InitItemState(State) {
    var prand = Math.floor(Math.random() * 25565);
    State.writeU32(prand);
    State.add(0x4).writeU8(1);
    State.add(0x8).writeFloat(1.0);
    State.add(0xC).writeU8(0);
    State.add(0xD).writeU8(0);
    State.add(0xE).writeU8(0);
    State.add(0x10).writePointer(ptr(0));
    State.add(0x18).writePointer(ptr(0));
    State.add(0x20).writePointer(ptr(0));
    State.add(0x28).writePointer(ptr(0));
    State.add(0x30).writePointer(ptr(0));
}
function giveInventory(PlayerState, ClassName) {
    var HumanCharacter = PlayerState.add(0x280).readPointer();
    if (HumanCharacter.isNull()) {
        return;
    }
    var ItemClass = findClassByName(ClassName);
    var InventoryComponent = HumanCharacter.add(0x808).readPointer();
    var Array = Memory.alloc(16 + 56);
    Array.writePointer(Array.add(16));
    Array.add(8).writeU32(1);
    Array.add(12).writeU32(1);
    InitItemState(Array.readPointer());
    var Buffer = Memory.alloc(8);
    Buffer.writeU32(0);
    Buffer.add(4).writeU32(0xffffffff);
    UDH_InventoryManager_AddInventory(InventoryComponent, ItemClass, Array, Buffer, Buffer.add(4), 0, ptr(0));
}

Interceptor.attach(ADH_HumanCharacter_AddStartingInventory_addr, {
    onEnter: function (args) {
        var ADH_HumanCharacter = args[0];
        this.ADH_HumanCharacter = ADH_HumanCharacter;
        var ADH_PlayerState = ADH_HumanCharacter.add(0x240).readPointer();
        var SelectedRole = ADH_PlayerState.add(0x590).readPointer();
        var number = SelectedRole.add(0x58).readU8(); 
        var bHasDied = ADH_PlayerState.add(0x3F0).readU8();
        var bAddedStartingInventory = ADH_PlayerState.add(0x3F1).readU8();
        //logInfo("ADH_PlayerState2: " + ADH_PlayerState);
        //ADH_HumanCharacter_Died(ADH_HumanCharacter, ptr(0), ptr(0), 500);
        if(number == ExplorerRole && !bHasDied) {
            ADH_HumanCharacter.add(0x590).writeFloat(DeathUnpossessDelay);
            var timer = setTimeout(function(){
                ADH_HumanCharacter_Died(ADH_HumanCharacter, ptr(0), ptr(0), 500);
            }, 1000);
            
        }
        
    },onLeave : function (ret) { 
    }
})


var RegisterItemClass = new Map([
    [0, '/Game/Blueprints/Inventory/Flintlock/BP_Flintlock_Inventory.BP_Flintlock_Inventory_C'],
    [1, '/Game/Blueprints/Inventory/Flintlock/BP_Flintlock_Ammo_Inventory.BP_Flintlock_Ammo_Inventory_C'],
    [2, '/Game/Blueprints/Inventory/Metals/BP_Whetstone_Inventory.BP_Whetstone_Inventory_C'],
    [3, '/Game/Blueprints/Inventory/WoodAxe/BP_WoodAxe_Inventory.BP_WoodAxe_Inventory_C'],
    [4, '/Game/Blueprints/Inventory/Powderkeg/BP_Powderkeg_Inventory.BP_Powderkeg_Inventory_C'],
    [5, '/Game/Blueprints/Inventory/LockPick/BP_SkeletonKey_Inventory.BP_SkeletonKey_Inventory_C'],
    [6, '/Game/Blueprints/Inventory/Metals/BP_IronIngot_Inventory.BP_IronIngot_Inventory_C'],
    [7, '/Game/Blueprints/Inventory/Stick/BP_Stick_Inventory.BP_Stick_Inventory_C'],
    [8, '/Game/Blueprints/Inventory/Bow/BP_Bow_Inventory.BP_Bow_Inventory_C'],
    [9, '/Game/Blueprints/Inventory/Bow/BP_Arrows_Inventory.BP_Arrows_Inventory_C'],
    [10, '/Game/Blueprints/Inventory/Musket/BP_Musket_Inventory.BP_Musket_Inventory_C'],
    [11, '/Game/Blueprints/Inventory/Spyglass/BP_Spyglass_Inventory.BP_Spyglass_Inventory_C'],
    [12, '/Game/Blueprints/Inventory/Coal/BP_Coal_Inventory.BP_Coal_Inventory_C'],
    [13, '/Game/Blueprints/Inventory/Lantern/BP_Lantern_Inventory.BP_Lantern_Inventory_C'],
    [14, '/Game/Blueprints/Inventory/Flintlock/BP_Gunpowder_Pickup.BP_Gunpowder_Pickup_C'],
    [15, '/Game/Blueprints/Inventory/Tea/BP_Herbs_Inventory.BP_Herbs_Inventory_C'],
    [16, '/Game/Blueprints/Inventory/Poison/BP_Poison_Inventory.BP_Poison_Inventory_C'],
    [17, '/Game/Blueprints/Inventory/Poison/BP_Antidote_Inventory.BP_Antidote_Inventory_C'],
    [18, '/Game/Blueprints/Inventory/Meat/BP_BoneClub_Inventory.BP_BoneClub_Inventory_C'],
    [19, '/Game/Blueprints/Inventory/IceAxe/BP_IceAxe_Inventory.BP_IceAxe_Inventory_C'],
    [20, '/Game/Blueprints/Inventory/Tea/BP_Tea_Inventory.BP_Tea_Inventory_C'],
    [21, '/Game/Blueprints/Inventory/Rock/BP_Rock_Inventory.BP_Rock_Inventory_C'],
    [22, '/Game/Blueprints/Inventory/Shovel/BP_Shovel_Inventory.BP_Shovel_Inventory_C'],
    [23, '/Game/Blueprints/Inventory/Meat/BP_Stew_Inventory.BP_Stew_Inventory_C'],
    [24, '/Game/Blueprints/Inventory/Syringe/BP_Inventory_Laudanum.BP_Inventory_Laudanum_C'],
    [25, '/Game/Blueprints/Inventory/Syringe/BP_Syringe_Inventory.BP_Syringe_Inventory_C'],
    [26, '/Game/Blueprints/Inventory/Cleaver/BP_Cleaver_Inventory.BP_Cleaver_Inventory_C'],
    [27, '/Game/Blueprints/Inventory/Powderkeg/BP_CoalBarrel_Inventory.BP_CoalBarrel_Inventory_C'],
    [28, '/Game/Blueprints/Inventory/Sword/BP_Sword_Inventory.BP_Sword_Inventory_C'],
    [29, '/Game/Blueprints/Inventory/BearTrap/BP_BearTrap_Inventory.BP_BearTrap_Inventory_C'],

]);


function InitExplorerInventory(PlayerState) {
    //logInfo('InitExplorerInventory');
    var DesiredInventory = RoleInitInventory.get('Explorer');
    if (DesiredInventory.length == 0) {
        return;
    }
    for (var i = 0; i < DesiredInventory.length; i++) { 
        var InventoryInfo = DesiredInventory[i];
        var ClassId = InventoryInfo[0];
        var Count = InventoryInfo[1];
        var Clazz = RegisterItemClass.get(ClassId);
        //logInfo('InitExplorerInventory ' + ClassId + ' ' + Count+ ' ' + Clazz);
        for(var j = 0; j < Count; j++){
            giveInventory(PlayerState, Clazz);
        }
    }

}

/**
 * 躲藏者游泳死亡
 */
var UDH_HumanMovementComponent_SetMovementMode_addr = base.add(0xd70600);
Interceptor.attach(UDH_HumanMovementComponent_SetMovementMode_addr, {
    onEnter: function (args) {
        //logInfo('UDH_HumanMovementComponent_SetMovementMode ' + args[1]);
        if(args[1] == 4){
            var UDH_HumanMovementComponent = args[0];
            var ADH_HumanCharacter = UDH_HumanMovementComponent.add(0xB50).readPointer();
            var ADH_PlayerController = ADH_HumanCharacter.add(0xA08).readPointer();
            //logInfo('ADH_PlayerController 2:' + ADH_PlayerController);
            var ADH_PlayerState = ADH_HumanCharacter.add(0x240).readPointer();
            var IsThrall = ADH_PlayerState.add(0x572).readU8();
            var bIsDoppelganger = ADH_HumanCharacter.add(0x11D2).readU8();
            
            //logInfo('IsThrall ' + IsThrall);
            if(IsThrall){
                ADH_HumanCharacter_Died(ADH_HumanCharacter, ptr(0), ptr(0), 500);
                if(!bIsDoppelganger){
                    sendRemainingTotalLife();
                }
            }
        }
    },onLeave : function (ret) { 

    }
})



/**
 * 暴风雪躲藏者胜利
 */
var ADH_GameState_OnNewDayStarted_addr = base.add(0xda1680);
//没作用
var ADH_GameMode_ShipHasArrived = new NativeFunction(base.add(0xdaa600), 'void', ['pointer'], 'win64');
Interceptor.attach(ADH_GameState_OnNewDayStarted_addr, {
    onEnter: function (args) {
        this.ADH_GameState = args[0];

    },onLeave : function (ret) { 
        var ADH_GameState = this.ADH_GameState;
        var ADH_GameMode = ADH_GameState.add(0x228).readPointer();
        var bBlizzardStarted = ADH_GameState.add(0x359).readU8();
        var DaysUntilBlizzard = ADH_GameState.add(0x484).readU32();
        //logInfo("DaysUntilBlizzard:"+DaysUntilBlizzard);
        if(bBlizzardStarted == 1){
            SendBroadMessage(ADH_GameState, "暴风雪已至,躲藏者胜利");
            var timer = setTimeout(function(){
                ADH_GameMode_WarshipEscaped(ADH_GameMode, 0);
            },3000);
            
        }else if(DaysUntilBlizzard == 1){ 
            /* 暴风雪前一天取消好人无敌 */
            var ExplorerArray = getExplorerPlayerStates(ADH_GameState);
            for(var i = 0; i < ExplorerArray.length; i++){ 
                var PlayerState = ExplorerArray[i];
                var ADH_PlayerController = PlayerState.add(0xE0).readPointer();
                var ADH_HumanCharacter = ADH_PlayerController.add(0x588).readPointer();
                ADH_HumanCharacter.add(0x11D0).writeU8(0);
            }
            var timer = setTimeout(function(){
                SendBroadMessage(ADH_GameState, "反抗时刻,拿起你们的武器");
            },3000);


        }

    }
})

/**
 * 被夹中增加体型
 */
var ADH_Character_SnareExpired_addr = base.add(0xd72110);
Interceptor.attach(ADH_Character_SnareExpired_addr, {
    onEnter: function (args) {
        this.ADH_HumanCharacter = args[0];
        
    },onLeave : function (ret) { 
        var ADH_HumanCharacter = this.ADH_HumanCharacter;
        //TODO:踩中夹子执行某效果

    }
})
