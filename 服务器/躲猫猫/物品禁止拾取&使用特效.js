var base = Module.findBaseAddress('DreadHungerServer-Win64-Shipping.exe');
var UDH_InventoryManager_AddInventory_addr = base.add(0xDBB960);
var ADH_Inventory_Use_Implementation_addr = base.add(0xdeb340);
var StaticFindObject = new NativeFunction(base.add(0x137AAA0), 'pointer', ['pointer', 'pointer', 'pointer', 'int8'], 'win64');
var StaticLoadObject = new NativeFunction(base.add(0x137B290), 'pointer', ['pointer', 'pointer', 'pointer', 'pointer', 'int32', 'pointer', 'int8', 'pointer'], 'win64');
var UClass_GetPrivateStaticClass = new NativeFunction(base.add(0x11F02E0), 'pointer', [], 'win64');
var ADH_PlayerState_SetIsDead = new NativeFunction(base.add(0xE4E700), 'void', ['pointer', 'int8'], 'win64');
var ADH_HumanCharacter_SetIsSpiritWalking = new NativeFunction(base.add(0xD70310), 'void', ['pointer', 'int8', 'float'], 'win64');
var AActor_TeleportTo = new NativeFunction(base.add(0x22eb150), 'int8', ['pointer','pointer','pointer', 'int8', 'int8'], 'win64');
var GetActorLocation = new NativeFunction(base.add(0x2988e70), "void", ['pointer', 'pointer', 'pointer'], 'win64');
var FActorSpawnParameters_FActorSpawnParameters = new NativeFunction(base.add(0x29584A0), 'void', ['pointer'], 'win64');
var UWorld_SpawnActor = new NativeFunction(base.add(0x2624510), 'pointer', ['pointer', 'pointer', 'pointer', 'pointer'], 'win64');

var GWorld = base.add(0x46ED420);//7FF60EEFD420

function logInfo(Info) {
	var f = new File('output.log', 'a');
	f.write('[Patches] ' + Info + '\n');
	f.close();
}
function findClassByName(ClassName) {
    return findObjectByName(ClassName, UClass_GetPrivateStaticClass());
}

function findObjectByName(ObjectName, Clazz) {
    var Buffer = Memory.alloc((ObjectName.length + 1) * 2);
    Buffer.writeUtf16String(ObjectName);
    return StaticFindObject(Clazz, ptr(0xFFFFFFFFFFFFFFFF), Buffer, 0);
}

function loadClassByName(ClassName) {
    return loadObjectByName(ClassName, UClass_GetPrivateStaticClass());
}
function loadObjectByName(ObjectName, Clazz) {
    var Buffer = Memory.alloc((ObjectName.length + 1) * 2);
    Buffer.writeUtf16String(ObjectName);
    return StaticLoadObject(Clazz, ptr(0), Buffer, ptr(0), 0, ptr(0), 1, ptr(0));
}
function getClass(ClassName) {
    var Clazz = findClassByName(ClassName);
    if(!Clazz.isNull()) {
        return Clazz; 
    }
    return loadClassByName(ClassName);
}
function makeTransform(Pos, Rot, Scale) {
    var TransformBuffer = Memory.alloc(16*3);
    TransformBuffer.add(0).writeFloat(Pos[0]);
    TransformBuffer.add(4).writeFloat(Pos[1]);
    TransformBuffer.add(8).writeFloat(Pos[2]);

    TransformBuffer.add(16).writeFloat(Rot[0]);
    TransformBuffer.add(20).writeFloat(Rot[1]);
    TransformBuffer.add(24).writeFloat(Rot[2]);

    TransformBuffer.add(32).writeFloat(Scale[0]);
    TransformBuffer.add(36).writeFloat(Scale[1]);
    TransformBuffer.add(40).writeFloat(Scale[2]);
    return TransformBuffer;
}

function spawnActor(World, Clazz, Position, Owner) {
    var Parameters = Memory.alloc(0x30);
    FActorSpawnParameters_FActorSpawnParameters(Parameters);
    Parameters.add(0x10).writePointer(Owner);
    return UWorld_SpawnActor(World, Clazz, Position, Parameters);
}

function getGameState()
{
    var AuthorityGameMode = GWorld.readPointer().add(0x118).readPointer();
    var GameState = AuthorityGameMode.add(0x280).readPointer();
    return GameState;
}
function getArraySize(TArray) {
    return TArray.add(8).readU32();
}
function getArrayItemAddr(TArray, size, index) {
    var ArrNum = getArraySize(TArray);
    if (index > ArrNum)
        return null;
    return TArray.readPointer().add(index * size);
}

function ActorTeleport(ADH_HumanCharacter, spot) {
    var DestLocation = Memory.alloc(0xC);
    var DestRotation = Memory.alloc(0xC);
    DestLocation.add(0x0).writeFloat(spot[0]);
    DestLocation.add(0x4).writeFloat(spot[1]);
    DestLocation.add(0x8).writeFloat(spot[2]);
    DestRotation.add(0x0).writeFloat(0);
    DestRotation.add(0x4).writeFloat(0);
    DestRotation.add(0x8).writeFloat(0);
    AActor_TeleportTo(ADH_HumanCharacter, DestLocation, DestRotation, false, false)
}


function GetWarshipLocation(Warship) {
    var stackFrame = Memory.alloc(16);
    var resultPointer = Memory.alloc(12);
    GetActorLocation(Warship, stackFrame, resultPointer);
    return resultPointer;
}

function ReturnScroll(ADH_HumanCharacter) {
    var ShipBase = ADH_HumanCharacter.add(0x9F8).readPointer();
    if(ShipBase.isNull())return;
    var Spot = GetWarshipLocation(ShipBase);
    var DestRotation = Memory.alloc(0xC);
    DestRotation.add(0x0).writeFloat(0);
    DestRotation.add(0x4).writeFloat(0);
    DestRotation.add(0x8).writeFloat(0);
    try {
        AActor_TeleportTo(ADH_HumanCharacter, Spot, DestRotation, 0, 0)
    } catch (error) {
        logInfo('ReturnScroll' + error);
    }
    
}


function AnimalHelperSpawn(ADH_HumanCharacter) {
    var Location = ADH_HumanCharacter.add(0x1298)
    var ActorClass = getClass(AnimalHelperSpawnArray[0][0]);
    AnimalHelperSpawnArray[0][2][0] = Location.readFloat();
    AnimalHelperSpawnArray[0][2][1] = Location.add(0x4).readFloat();
    AnimalHelperSpawnArray[0][2][2] = Location.add(0x8).readFloat();
    var Transform = makeTransform(AnimalHelperSpawnArray[0][1], AnimalHelperSpawnArray[0][2], AnimalHelperSpawnArray[0][3]);
    spawnActor(GWorld.readPointer(), ActorClass, Transform, getGameState());
}


var AnimalHelperSpawnArray = [[
    "/Game/Blueprints/AI/Predators/BP_Predator_Wolf.BP_Predator_Wolf_C",
    [0, 0, 0],//旋转
    [0, 0, 0],
    [1, 1, 1]//缩放
]];

var ProhibitedClassThrall = [
    '/Game/Blueprints/Inventory/Bow/BP_Bow_Inventory.BP_Bow_Inventory_C',//弓
    '/Game/Blueprints/Inventory/Sword/BP_Sword_Inventory.BP_Sword_Inventory_C'//军刀
];
var ThrallClazzs = [];

var ProhibitedClassExplorer = [
    
];
var ExplorerClazzs = [];
var flag1 = false;

function findInventory(InventoryManager, ItemClass) {
    var StoredInventory = InventoryManager.add(0x138);
    for(var i = 0; i < getArraySize(StoredInventory); i++) {
        var Inventory = getArrayItemAddr(StoredInventory, 8, i).readPointer();
        if(Inventory.isNull()) {
            continue;
        }
        var Clazz = Inventory.add(0x10).readPointer();
        if(Clazz.equals(ItemClass)) {
            return Inventory;
        }
    }
    return ptr(0);
}

Interceptor.attach(UDH_InventoryManager_AddInventory_addr, {
    onEnter : function (args) {
        var UDH_InventoryManager = args[0];
        var ADH_HumanCharacter = UDH_InventoryManager.add(0xD8).readPointer();
        var ADH_PlayerState = ADH_HumanCharacter.add(0x240).readPointer();
        var IsThrall = ADH_PlayerState.add(0x572).readU8();
        var UClass = args[1]; 
        if(!flag1){
            for(var i = 0; i < ProhibitedClassThrall.length; i++){
                var Clazz = findClassByName(ProhibitedClassThrall[i]);
                if(Clazz.isNull()) {
                    continue;
                }
                ThrallClazzs.push(Clazz);
            }

            for(var i = 0; i < ProhibitedClassExplorer.length; i++){
                var Clazz = findClassByName(ProhibitedClassExplorer[i]);
                if(Clazz.isNull()) {
                    continue;
                }
                ExplorerClazzs.push(Clazz);
            }
            flag1 = true;
        }
        if(IsThrall){
            for(var i = 0; i < ThrallClazzs.length; i++){
                if(UClass.equals(ThrallClazzs[i])){
                    args[1] = ptr(0);
                }
            }
        }else{
            for(var i = 0; i < ExplorerClazzs.length; i++){
                if(UClass.equals(ExplorerClazzs[i])){
                    args[1] = ptr(0);
                }
            }

        }
    }
});

var SpiritWalkingInventorys = [
    '/Game/Blueprints/Inventory/Poison/BP_Antidote_Inventory.BP_Antidote_Inventory_C',
];

var ReturnScrollInventorys = [
    '/Game/Blueprints/Inventory/Tea/BP_Tea_Inventory.BP_Tea_Inventory_C',
];

var AnimalHelperInventorys = [
    '/Game/Blueprints/Inventory/Meat/BP_CookedMeat_Inventory.BP_CookedMeat_Inventory_C',
];
Interceptor.attach(ADH_Inventory_Use_Implementation_addr, {
    onEnter : function (args) {
        this.ADH_Inventory = args[0];
    },onLeave : function (retval) { 
        var ADH_Inventory = this.ADH_Inventory;
        var ADH_HumanCharacter = ADH_Inventory.add(0x268).readPointer();
        var ADH_PlayerState = ADH_HumanCharacter.add(0x240).readPointer();
        var IsThrall = ADH_PlayerState.add(0x572).readU8();
        var TargetItem = ADH_Inventory.add(0x10).readPointer();
        //灵界物品
        for(var i = 0; i < SpiritWalkingInventorys.length; i++){
            var Clazz = findClassByName(SpiritWalkingInventorys[i]);
            if(Clazz.isNull()) {
                continue;
            }
            if(TargetItem.equals(Clazz)){
                if(IsThrall){
                    ADH_HumanCharacter_SetIsSpiritWalking(ADH_HumanCharacter, 1, 2);
                }else{
                    ADH_HumanCharacter_SetIsSpiritWalking(ADH_HumanCharacter, 1, 5);
                }
                return;
            }

        }

        //回城物品
        for(var i = 0; i < ReturnScrollInventorys.length; i++){
            var Clazz = findClassByName(ReturnScrollInventorys[i]);
            if(Clazz.isNull()) {
                continue;
            }
            if(TargetItem.equals(Clazz)){
                if(IsThrall){
                    ADH_HumanCharacter_SetIsSpiritWalking(ADH_HumanCharacter, 1, 3);
                    ReturnScroll(ADH_HumanCharacter);
                }else{
                    ADH_HumanCharacter_SetIsSpiritWalking(ADH_HumanCharacter, 1, 1);
                    ReturnScroll(ADH_HumanCharacter);
                }
                return;
            }
        }

        //召唤动物朋友
        for(var i = 0; i < AnimalHelperInventorys.length; i++){
            var Clazz = findClassByName(AnimalHelperInventorys[i]);
            if(Clazz.isNull()) {
                continue;
            }
            if(TargetItem.equals(Clazz)){
                if(IsThrall){
                    return;
                }else{
                    AnimalHelperSpawn(ADH_HumanCharacter)
                }
                return;
            }
        }

    }
});


