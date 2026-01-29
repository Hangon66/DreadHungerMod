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
var DeathUnpossessDelay = 30;   //抓捕者复活延迟

//0=小枪,1=子弹,2=磨刀石,3=斧头,4=炸药桶 5=钥匙 6=铁 7=木板 8=弓 9=箭 10=大枪 11=导管 
// 12=煤炭 13=灯笼 14=火药 15=草药 16=毒药 17=解毒剂 18=骨头 19=冰稿 20=茶 21=石头 
// 22=铲子 23=炖肉 24=鸦片酊 25=针 26=菜刀 27=煤炭桶 28=军刀 29=夹子 30=烤肉

var RoleInitInventory = new Map([
    ['Explorer', [//抓捕者装备
        [8,1],
        [28,1],
        [17,1],
        [4,5],
        [30,1],
        [20,1],
        [23,99],
        [29,30],
        [9,200],
    ]],
    ['Explorer2', [//抓捕者装备
        [17,1],
    ]],
    ['Thrall', [//躲藏者装备
        [3,1],
        [17,1],
        [20,1],
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
    var ADH_GameState = getGameState();
    getRemainingTotalLife(ADH_GameState);
    Message = "躲藏者剩余命数" + ThrallRemainingLife +"\n\n\n";
    //logInfo("躲藏者剩余命数" + RemainingLife);
    SendBroadMessage(ADH_GameState, Message);
    if(ThrallRemainingLife == 0) {
        var ADH_GameMode = ADH_GameState.add(0x228).readPointer();
        var timer1 = setTimeout(function() {
            SendBroadMessage(ADH_GameState, "躲藏者无一生还");
        }, 2000);
        var timer2 = setTimeout(function() {
            ADH_GameMode_WarshipEscaped(ADH_GameMode, 1);
        }, 7000);
    }
}

Interceptor.attach(ADH_HumanCharacter_Died_addr, {
    onEnter : function(args) {
        this.ADH_HumanCharacter = args[0];
        var ADH_HumanCharacter = args[0];
        var ADH_PlayerState = ADH_HumanCharacter.add(0x240).readPointer();
        this.bIsDoppelganger = ADH_HumanCharacter.add(0x11D2).readU8();
        this.IsThrall = ADH_PlayerState.add(0x572).readU8(); 
    },onLeave : function(retval) {
        try{
            var ADH_HumanCharacter = this.ADH_HumanCharacter;
            var bIsDoppelganger = this.bIsDoppelganger;
            var IsThrall = this.IsThrall;
            if(IsThrall && !bIsDoppelganger){
                sendRemainingTotalLife();
            }else if(!IsThrall){
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

function getThrallPlayerStates(GameState) {
    var PlayerArray = GameState.add(0x238);
    var ShuffleArray = [];
    for(var i = 0; i < getArraySize(PlayerArray); i++) {
        var PlayerState = getArrayItemAddr(PlayerArray, 8, i).readPointer();
        // var SelectedRole = PlayerState.add(0x590).readPointer();
        // var number = SelectedRole.add(0x58).readU8(); 
        var IsThrall = PlayerState.add(0x572).readU8();
		if(IsThrall){
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
        var ADH_PlayerState = ADH_BrigCell.add(0x2F0).readPointer();
        var IsThrall = ADH_PlayerState.add(0x572).readU8();
        try{
            ADH_BrigCell_FreePrisoner(ADH_BrigCell, ptr(0));
        }catch(e){
            logInfo(e);
        }
        
        var ADH_PlayerController = ADH_PlayerState.add(0xE0).readPointer();
        var ADH_HumanCharacter = ADH_PlayerController.add(0x588).readPointer();
        //var ADH_BrigDoor = ADH_BrigCell.add(0x300).readPointer();
        try{
            setActorRelativeScale3D(ADH_HumanCharacter, 0.3, 0.3, 0.3);
        }catch(e){
            logInfo(e);
        }
        if(!IsThrall){
            //发送抓捕者复活物资
            InitExplorerInventory(ADH_PlayerState, 'Explorer');
            //设置无敌
            ADH_HumanCharacter.add(0x11D0).writeU8(1);
            //5连跳
            ADH_HumanCharacter.add(0x344).writeU32(5);
        }else{
            //狼人复活灵界
            InitThrallInventory(ADH_PlayerState);
            ADH_HumanCharacter_SetIsSpiritWalking(ADH_HumanCharacter, 1, 8);
        }
        updatePlayerProperties(ADH_PlayerState, {}, true)
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
    [30, '/Game/Blueprints/Inventory/Meat/BP_CookedMeat_Inventory.BP_CookedMeat_Inventory_C'],

]);


function InitExplorerInventory(PlayerState, Inventorys) {
    //logInfo('InitExplorerInventory');
    var DesiredInventory = RoleInitInventory.get(Inventorys);
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

function InitThrallInventory(PlayerState) {
    //logInfo('InitExplorerInventory');
    var DesiredInventory = RoleInitInventory.get('Thrall');
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
            }
        }
    },onLeave : function (ret) { 

    }
})



/**
 * 暴风雪躲藏者胜利
 */
var ADH_GameState_OnNewDayStarted_addr = base.add(0xda1680);
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
            },1000);
            
        }else if(DaysUntilBlizzard == 1){ 
            /* 暴风雪前一天取消好人无敌 */
            var ExplorerArray = getExplorerPlayerStates(ADH_GameState);
            for(var i = 0; i < ExplorerArray.length; i++){ 
                var ADH_PlayerState = ExplorerArray[i];
                var ADH_PlayerController = ADH_PlayerState.add(0xE0).readPointer();
                var ADH_HumanCharacter = ADH_PlayerController.add(0x588).readPointer();
                ADH_HumanCharacter.add(0x11D0).writeU8(0);
                InitExplorerInventory(ADH_PlayerState, 'Explorer2')

            }
            var timer = setTimeout(function(){
                SendBroadMessage(ADH_GameState, "反抗时刻,谁是猎人谁是猎物");
            },3000);


        }

    }
})

/**
 * 无法实现xxx被夹中增加体型
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


/**
 * 奖励机制
 */
const PlayerMatchStatType = {
    // 未定义或无效的统计类型
    PMS_UNDEFINED: 0x0,

    // --- 击杀类 (Kills) ---
    PMS_KILLS_START: 0x1,           // 击杀类型起始标记
    PMS_KILL_PLAYER_SELF: 0x2,      // 击杀自己（自杀）
    PMS_KILL_PLAYER_ENEMY: 0x3,     // 击杀敌方玩家
    PMS_KILL_PLAYER_ALLY: 0x4,      // 击杀友方玩家
    PMS_KILL_WOLF: 0x5,             // 击杀狼
    PMS_KILL_RABBIT: 0x6,           // 击杀兔子
    PMS_KILL_BEAR: 0x7,             // 击杀熊
    PMS_KILL_SEAL: 0x8,             // 击杀海豹
    PMS_KILL_CANNIBAL: 0x9,         // 击杀食人族
    PMS_KILLS_END: 0xA,             // 击杀类型结束标记

    // --- 倒下与复活类 (Downs & Revives) ---
    PMS_DOWN_SELF: 0xB,             // 玩家自己被击倒
    PMS_DOWN_ALLY: 0xC,             // 友方玩家被击倒
    PMS_DOWN_ENEMY: 0xD,            // 敌方玩家被击倒
    PMS_REVIVE_SELF: 0xE,           // 玩家自己被复活
    PMS_REVIVE_ALLY: 0xF,           // 复活友方玩家
    PMS_REVIVE_ENEMY: 0x10,         // 复活敌方玩家

    // --- 治疗与状态影响类 (Healing & Status Effects) ---
    PMS_HEAL_SELF: 0x11,            // 治疗自己
    PMS_HEAL_ALLY: 0x12,            // 治疗友方
    PMS_HEAL_ENEMY: 0x13,           // 治疗敌方
    PMS_FEED_SELF: 0x14,            // 喂食自己（恢复饥饿/体力）
    PMS_FEED_ALLY: 0x15,            // 喂食友方
    PMS_FEED_ENEMY: 0x16,           // 喂食敌方
    PMS_POISON_SELF: 0x17,          // 自己中毒
    PMS_POISON_ALLY: 0x18,          // 友方中毒
    PMS_POISON_ENEMY: 0x19,         // 敌方中毒
    PMS_CURE_SELF: 0x1A,            // 自己被解毒
    PMS_CURE_ALLY: 0x1B,            // 友方被解毒
    PMS_CURE_ENEMY: 0x1C,           // 敌方被解毒
    PMS_WARM_SELF: 0x1D,            // 自己取暖成功
    PMS_WARM_ALLY: 0x1E,            // 为友方取暖
    PMS_WARM_ENEMY: 0x1F,           // 为敌方取暖

    // --- 越狱、逃脱与伤害类 (Jailbreak, Escape & Damage) ---
    PMS_JAILBREAK_ALLY: 0x20,       // 帮助友方越狱
    PMS_JAILBREAK_ENEMY: 0x21,      // 帮助敌方越狱
    PMS_DAMAGE_ALLY: 0x22,          // 对友方造成伤害
    PMS_DAMAGE_ENEMY: 0x23,         // 对敌方造成伤害
    PMS_DAMAGE_BEAR: 0x24,          // 对熊造成伤害
    PMS_STAYING_ALIVE: 0x25,        // 生存时间/存活状态（可能作为基础得分）
    PMS_EMBEDDED: 0x26,             // 进入“嵌入”状态（具体机制需结合游戏）
    PMS_ALLY_ESCAPED: 0x27,         // 友方成功逃脱
    PMS_ENEMY_ESCAPED: 0x28,        // 敌方成功逃脱

    // --- 制作与资源类 (Crafting & Resources) ---
    PMS_CRAFT_STEW: 0x29,           // 制作炖菜
    PMS_CRAFT_PISTOL: 0x2A,         // 制作手枪
    PMS_CRAFT_MUSKET: 0x2B,         // 制作火枪
    PMS_CRAFT_WOODAXE: 0x2C,        // 制作木斧
    PMS_CRAFT_ICEAXE: 0x2D,         // 制作冰斧
    PMS_CRAFT_SYRINGE: 0x2E,        // 制作注射器
    PMS_COAL_DESTROYED: 0x2F,       // 破坏煤炭资源
    PMS_NITRO_CARRY: 0x30,          // 携带硝化甘油
    PMS_NITRO_CARRY_ASSIST: 0x31,   // 协助携带硝化甘油
    PMS_NITRO_DESTROY: 0x32,        // 成功破坏硝化甘油
    PMS_ICEBERG_DAMAGE: 0x33,       // 对冰山造成伤害
    PMS_SMALL_ICEBERG_DESTROYED: 0x34, // 摧毁小型冰山
    PMS_LARGE_ICEBERG_DESTROYED: 0x35, // 摧毁大型冰山

    // --- 胜利与战舰操作类 (Win & Warship) ---
    PMS_WIN_MATCH: 0x36,            // 赢得本场对局
    PMS_BOILER_FUEL: 0x37,          // 为战舰锅炉添加燃料
    PMS_BOILER_SABOTAGE: 0x38,      // 破坏战舰锅炉
    PMS_SHIP_BADPARK: 0x39,         // 战舰停靠不当（可能扣分）
    PMS_SHIP_MOVEUP: 0x3A,          // 战舰向前移动
    PMS_SHIP_MOVEBACK: 0x3B,        // 战舰向后移动
    PMS_SHIP_SLOWDRIVE: 0x3C,       // 战舰缓慢驾驶（可能为安全驾驶）
    PMS_SHIP_REPAIR: 0x3D,          // 修理战舰
    PMS_SHIP_DAMAGE: 0x3E,          // 战舰受到伤害
    PMS_SHIP_SINK: 0x3F,            // 战舰沉没

    // --- 其他行为类 (Other Actions) ---
    PMS_STOLE_FOOD: 0x40,           // 偷窃食物
    PMS_TOTEM_BUILT: 0x41,          // 建造图腾
    PMS_TOTEM_DESTROYED: 0x42,      // 图腾被摧毁
    PMS_BONECHARM_DESTROYED: 0x43,  // 骨制护身符被摧毁
    PMS_SPELL_WHITEOUT: 0x44,       // 施放“白雾”法术
    PMS_SPELL_CANNIBALS: 0x45,      // 施放“食人族”法术
    PMS_SPELL_SPIRITWALK: 0x46,     // 施放“灵行”法术
    PMS_SPELL_GALE: 0x47,           // 施放“狂风”法术
    PMS_STOWAWAY: 0x48,             // 成为偷渡者（特殊角色/行为）
    PMS_POKER_WINS: 0x49,           // 在扑克游戏中获胜
    PMS_CHEATER: 0x4A,              // 被检测到作弊行为
    PMS_SPELL_HYSTERIA: 0x4B,       // 施放“狂乱”法术
    PMS_SPELL_DOPPELGANGER: 0x4C,   // 施放“分身”法术
    PMS_SPELL_BLOODMOON: 0x4D,      // 施放“血月”法术
    PMS_SPELL_HUSH: 0x4E,           // 施放“寂静”法术
    PMS_BOILER_BOOST: 0x4F,         // 为战舰锅炉提供增益效果
    PMS_KILL_RAT: 0x50,             // 击杀老鼠

    PMS_MAX: 0x51 // 0x51 是所有有效值之后的下一个值，常用于数组边界检查
};

function giveTaskAwardInventory(PlayerState, TaskAwardInventory) {
    //logInfo('InitExplorerInventory');
    var DesiredInventory = TaskAwardInventorys.get(TaskAwardInventory);
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


function processProperty(PropTable, Data, TargetObject) {
    for(var PropertyName in Data) {
        var Value = Data[PropertyName];
        if(TargetObject.isNull())return;
        if(PropTable.hasOwnProperty(PropertyName)) {
            //修改ADH_HumanCharacter
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
            
        }else if(UCharacterMovementComponentPropertyOffsets.hasOwnProperty(PropertyName)){
            //修改UCharacterMovementComponent
            var WriteType = UCharacterMovementComponentPropertyOffsets[PropertyName][0];
            var Offset = UCharacterMovementComponentPropertyOffsets[PropertyName][1];
            var TargetPointer = TargetObject.add(0x288).readPointer().add(Offset);
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
			processProperty(HumanCharacterPropertyOffsets, {"CurrentHealth" : PlayerProperties[PlayerState]["CurrentHealth"]}, Pawn)
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

var UCharacterMovementComponentPropertyOffsets = {
    'GravityScale': ['float', 0x150], // 重力
    'MaxStepHeight': ['float', 0x154], // 最大可攀爬台阶高度
    'WalkableFloorZ': ['float', 0x164], // 可行走地面的最小法线Z分量
    'MaxWalkSpeed': ['float', 0x18C], // 步行最大速度
    'MaxSwimSpeed': ['float', 0x194], // 游泳最大速度
    'MaxAcceleration': ['float', 0x1A0], // 最大加速度
    'AirControl': ['float', 0x1C4], // 空中控制力
    'Buoyancy': ['float', 0x1D8], // 浮力系数
}

//奖励列表
var TaskAwardInventorys = new Map([
    ['TOTEM_BUILT', [//制造图腾
        [17,1],
    ]],
    ['TOTEM_BUILT1', [//制造图腾1
        [25,1],
        [2,1],
    ]],
    ['TOTEM_DESTROYED', [//摧毁图腾
        [17,1],
    ]]
    ,
    ['Explorer_KILL_PLAYER_ENEMY', [//探险家击杀敌方
        [17,1],
    ]]
]);

var PlayerProperties = [];
var ADH_PlayerState_ModifyMatchStat_addr = base.add(0xe42820);
var FindByKey = new NativeFunction(base.add(0xe25f50), 'pointer', ['pointer', 'pointer'], 'win64');
var TotelTotemCount = 0;
Interceptor.attach(ADH_PlayerState_ModifyMatchStat_addr, {
    onEnter: function (args) {
        this.ADH_PlayerState = args[0];
        this.Stat = args[1];
        
    },onLeave : function (ret) { 
        try{
            var ADH_PlayerState = this.ADH_PlayerState;
            //logInfo('ADH_PlayerState :' + ADH_PlayerState);
            var Stat = this.Stat;
            var statValue = Stat.toInt32();
            var statPtr = Memory.alloc(1);
            statPtr.writeS8(statValue & 0xFF);
            //logInfo('Stat = '+Stat + ' ' + statPtr);
            var MatchStats = ADH_PlayerState.add(0x330);
            //logInfo('MatchStats = '+MatchStats);
            var FPlayerMatchStat = FindByKey(MatchStats, statPtr);
            if(FPlayerMatchStat.isNull())return;
            //logInfo('FPlayerMatchStat = '+FPlayerMatchStat);
            var ScoreTotal = FPlayerMatchStat.add(0x8).readFloat();
            var Count = FPlayerMatchStat.add(0x4).readU32();
            var IsThrall = ADH_PlayerState.add(0x572).readU8();
            var ADH_PlayerController = ADH_PlayerState.add(0xE0).readPointer();
            if(ADH_PlayerController.isNull())return;
            var ADH_HumanCharacter = ADH_PlayerController.add(0x588).readPointer();
            if(ADH_HumanCharacter.isNull())return;
            var bIsDoppelganger = ADH_HumanCharacter.add(0x11D2).readU8();
            //logInfo(' ScoreTotal ' + ScoreTotal + ' Count ' + Count);
            //区分好人狼人奖励类型
            // logInfo('ADH_HumanCharacter :' + ADH_HumanCharacter);
            // logInfo('IsThrall: ' + IsThrall)
            // logInfo('bIsDoppelganger :' + bIsDoppelganger)
            if(IsThrall){
                if(Stat == PlayerMatchStatType.PMS_TOTEM_BUILT){//建造图腾
                    //单人图腾制造奖励
                    /*
                    //logInfo('TOTEM_BUILT:  ' + Count);
                    if(Count == 10){ 
                        //奖励物资
                        giveTaskAwardInventory(ADH_PlayerState, 'TOTEM_BUILT');
                    }else if(Count == 20){
                        //奖励连跳
                        var JumpMaxCount = ADH_HumanCharacter.add(0x344).readU32();
                        JumpMaxCount++;
                        ADH_HumanCharacter.add(0x344).writeU32(JumpMaxCount);
                    }else if(Count == 30){
                        //奖励最大生命值
                        var MaximumHealth = ADH_HumanCharacter.add(0x7E0).readFloat();
                        MaximumHealth = MaximumHealth + 20;
                        ADH_HumanCharacter.add(0x7E0).writeFloat(MaximumHealth);
                    }*/
                   //团队图腾制造奖励
                   //logInfo('ADH_PlayerState :' + ADH_PlayerState);
                   
                   //logInfo('RealPawn :' + ADH_PlayerState.add(0x638).readPointer());
                   //logInfo('PawnPrivate :' + ADH_PlayerState.add(0x280).readPointer());

                    TotelTotemCount++;
                    if(TotelTotemCount == 10){ 
                        //奖励物资
                        var ThrallsPlayerState = getThrallPlayerStates(getGameState());
                        for(var i = 0; i < ThrallsPlayerState.length; i++){
                            giveTaskAwardInventory(ThrallsPlayerState[i], 'TOTEM_BUILT');
                        }
                    }else if(TotelTotemCount == 20){
                        //奖励连跳
                        var ThrallsPlayerState = getThrallPlayerStates(getGameState());
                        for(var ADH_PlayerState1 of ThrallsPlayerState){ 
                            addPlayerProperty(ADH_PlayerState1, 'JumpMaxCount', 2);
                            updatePlayerProperties(ADH_PlayerState1, {'JumpStaminaConsumption' :  0}, 0);
                        }
                        

                    }else if(TotelTotemCount == 30){ 
                        //奖励生命值
                        var ThrallsPlayerState = getThrallPlayerStates(getGameState());
                        for(var ADH_PlayerState1 of ThrallsPlayerState){ 
                            addPlayerProperty(ADH_PlayerState1, 'MaximumHealth', 20);
                        }

                    }else if(TotelTotemCount == 40){ 
                        //奖励物资
                        var ThrallsPlayerState = getThrallPlayerStates(getGameState());
                        for(var i = 0; i < ThrallsPlayerState.length; i++){
                            giveTaskAwardInventory(ThrallsPlayerState[i], 'TOTEM_BUILT1');
                        }
                    }

                }else if(Stat == PlayerMatchStatType.PMS_FEED_SELF){
                    //吃饭增加生命值
                    addPlayerProperty(ADH_PlayerState, 'MaximumHealth', 0.1);

                }
            }else{
                if(Stat == PlayerMatchStatType.PMS_TOTEM_DESTROYED){//摧毁图腾
                    if(Count%15 == 0){ 
                        //奖励物资
                        giveTaskAwardInventory(ADH_PlayerState, 'TOTEM_DESTROYED');
                    }
                }else if(Stat == PlayerMatchStatType.PMS_KILL_PLAYER_ENEMY){//击杀敌方
                    if(Count%3 == 0){ 
                        //奖励物资
                        giveTaskAwardInventory(ADH_PlayerState, 'Explorer_KILL_PLAYER_ENEMY');
                    }
                }
        }
        }catch(e){
            logInfo('ADH_PlayerState_ModifyMatchStat_addr ' + e);

        }
        
    }
})



/**
 * 启用野怪船上攻击
 */
var ADH_HumanCharacter_IsAITargetable_Implementation_addr = base.add(0xd5c7c0)
Interceptor.attach(ADH_HumanCharacter_IsAITargetable_Implementation_addr,{
	onEnter : function (args) {
		this.ADH_Character = args[0];
	},onLeave : function (ret) {
        try{
            var ADH_Character = this.ADH_Character;
            var ADH_PlayerController = ADH_Character.add(0x538).readPointer();
            if(ADH_PlayerController.isNull())return;
            var ADH_HumanCharacter = ADH_PlayerController.add(0x588).readPointer();
            if(ADH_HumanCharacter.isNull())return;
            var ADH_PlayerState = ADH_HumanCharacter.add(0x240).readPointer();
            var SelectedRole = ADH_PlayerState.add(0x590).readPointer();
            var number = SelectedRole.add(0x58).readU8();
            if(number == ExplorerRole){
                this.context.rax = 0;
            }else{
                this.context.rax = 1;
            }
        }catch(e){
            logInfo('ADH_HumanCharacter_IsAITargetable_Implementation :' + e)
        }
        
	}
});