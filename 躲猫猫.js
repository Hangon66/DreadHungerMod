function logInfo(Info) {
	var f = new File('output.log', 'a');
	f.write('[Patches] ' + Info + '\n');
	f.close();
}

var base = Module.findBaseAddress('DreadHungerServer-Win64-Shipping.exe');
var ADH_PlayerState_SetIsDead_addr = base.add(0xE4E700);
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



function randomNum(max) {
  return Math.floor(Math.random() * max);
}
function getGameState()
{
    var AuthorityGameMode = GWorld.readPointer().add(0x118).readPointer();
    var GameState = AuthorityGameMode.add(0x280).readPointer();
    return GameState;
}

var RemainingLife = 0;
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
function SendThrallMessage(object, message){
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
    var ShuffleArray = [];
    for(var i = 0; i < getArraySize(PlayerArray); i++) {
        var PlayerState = getArrayItemAddr(PlayerArray, 8, i).readPointer();
		var bHasDied = PlayerState.add(0x3F0).readU8();
        var IsThrall = PlayerState.add(0x572).readU8();
        var bIsDead = PlayerState.add(0x570).readU8();
        var bIsDisconnected = PlayerState.add(0x571).readU8();
        RemainingLife = 0;
		if(IsThrall && !bIsDisconnected){
			if(bIsDead) {
				continue;
			}
			if(bHasDied){
				RemainingLife++;
			}else{
				RemainingLife+=2;
			}
		}
    }
    return --RemainingLife;
}



Interceptor.attach(ADH_PlayerState_SetIsDead_addr, {
    onEnter : function(args) {
        PlayerState = args[0];
        var DeadFlag = args[1] & 1;
        if(!DeadFlag) {
            return;
        }
        IsThrall = PlayerState.add(0x572).readU8(); 
        if(IsThrall){
            var GameState = getGameState();
            getRemainingTotalLife(GameState);
            Message = "躲藏者剩余命数" + --RemainingLife +"\n\n\n";
            SendThrallMessage(GameState, Message);
        }
    }
});


/* 
    随机角色&指定躲藏者 
 */
var ThrallsRole = 2;    //躲藏者角色
var ExplorerRole = 3;   //抓捕者角色
var MaxPlayers = 8;     //最大玩家数
var MaxExplorer = 1;     //最大抓捕者
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

var roles = [3 , 3, 3, 3];
/* 加入躲藏者 */
// for(var i = 0; i < MaxPlayers - MaxExplorer; i++) {
//     roles.push(ThrallsRole);
// }

/* 加入抓捕者 */
// for(var i = 0; i < MaxExplorer; i++) {
//     roles.push(ExplorerRole);
// }


function getRolePlayerStates(GameState) {
    var PlayerArray = GameState.add(0x238);
    var ShuffleArray = [];
    for(var i = 0; i < getArraySize(PlayerArray); i++) {
        var PlayerState = getArrayItemAddr(PlayerArray, 8, i).readPointer();
        var SelectedRole = PlayerState.add(0x590).readPointer();
        var number = SelectedRole.add(0x58).readU8(); 
		if(number == ThrallsRole){
            ShuffleArray.push(PlayerState);    
		}
    }
    return ShuffleArray;
}

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


var ADH_PlayerState_SetIsThrall = new NativeFunction(base.add(0xE4E880), 'void', ['pointer', 'int8'], 'win64');

Interceptor.replace(ADH_GameMode_RandomizeThralls_addr, new NativeCallback(function(){
    var GameState = getGameState();
    var ThrallsPlayerState = getRolePlayerStates(GameState);
    for(var i = 0; i < ThrallsPlayerState.length; i++) {
        ADH_PlayerState_SetIsThrall(ThrallsPlayerState[i], 1);
    }
}, 'void', ['pointer']));


/*
    开局抓捕者死亡延迟复活  
*/
var ADH_BrigCell_AddPrisoner = base.add(0xE5D180);
var ADH_BrigCell_FreePrisoner = new NativeFunction(base.add(0xE69380), 'pointer', ['pointer', 'pointer']);
var BrigCellFlag = false;
var BrigCells = [];

function FreePrisonerExplorer() {
    for(var i = 0; i < BrigCells.length; i++){
        var ADH_BrigCell = BrigCells[i];
        ADH_BrigCell_FreePrisoner(ADH_BrigCell, ptr(0));
    }
}


Interceptor.attach(ADH_BrigCell_AddPrisoner, {
    onEnter: function (args) {
        this.ADH_BrigCell = args[0];
        this.PlayerState = args[1];
        this.IsThrall = PlayerState.add(0x572).readU8();
        
    },
    onLeave: function (ret) {
        var ADH_BrigCell = this.ADH_BrigCell;
        var IsThrall = this.IsThrall;
        var PlayerState = this.PlayerState;
        ADH_BrigCell_FreePrisoner(ADH_BrigCell, ptr(0));
        if(!IsThrall){
            InitExplorerInventory(PlayerState);
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
var DeathUnpossessDelay = 3;   //抓捕者复活延迟
var ADH_HumanCharacter_AddStartingInventory_addr = base.add(0xd46f10);
var ADH_GameMode_FinishRestartPlayer_addr = base.add(0xd8fcf0);
var ADH_HumanCharacter_Died = new NativeFunction(base.add(0xd50cb0), 'void', ['pointer', 'pointer', 'pointer', 'float'], 'win64');
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
        logInfo("ADH_PlayerState2: " + ADH_PlayerState);
        if(number == ExplorerRole && !bHasDied) {
            ADH_HumanCharacter.add(0x590).writeFloat(DeathUnpossessDelay);
            ADH_HumanCharacter_Died(ADH_HumanCharacter, ptr(0), ptr(0), 500);
        }
        
    },onLeave : function (ret) { 
        var ADH_HumanCharacter = this.ADH_HumanCharacter;
        var ADH_PlayerState = ADH_HumanCharacter.add(0x240).readPointer();
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
//0=小枪,1=子弹,2=磨刀石,3=斧头,4=炸药桶 5=钥匙 6=铁 7=木板 8=弓 9=箭 10=大枪 11=导管 
// 12=煤炭 13=灯笼 14=火药 15=草药 16=毒药 17=解毒剂 18=骨头 19=冰稿 20=茶 21=石头 
// 22=铲子 23=炖肉 24=鸦片酊 25=针 26=菜刀 27=煤炭桶 28=军刀 29=夹子
var RoleInitInventory = new Map([
    ['Explorer', [
        [8,1],
        [29,5],
        [9,50]
    ]]
]);

function InitExplorerInventory(PlayerState) {
    logInfo('InitExplorerInventory');
    var DesiredInventory = RoleInitInventory.get('Explorer');
    if (DesiredInventory.length == 0) {
        return;
    }
    for (var i = 0; i < DesiredInventory.length; i++) { 
        var InventoryInfo = DesiredInventory[i];
        var ClassId = InventoryInfo[0];
        var Count = InventoryInfo[1];
        var Clazz = RegisterItemClass.get(ClassId);
        logInfo('InitExplorerInventory ' + ClassId + ' ' + Count+ ' ' + Clazz);
        for(var j = 0; j < Count; j++){
            giveInventory(PlayerState, Clazz);
        }
    }

}