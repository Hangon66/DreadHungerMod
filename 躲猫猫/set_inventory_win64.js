var base = Module.findBaseAddress('DreadHungerServer-Win64-Shipping.exe');

var ADH_GameMode_InitGame_addr = base.add(0xD9B220);
//var FTransform_Identity = base.add(0x4559220);


var UDH_GameInstance_GetInstance = new NativeFunction(base.add(0xD93240), 'pointer', ['pointer'], 'win64');
//var UGameInstance_GetWorld = new NativeFunction(base.add(0x2562370), 'pointer', ['pointer'], 'win64');

//var UWorld_SpawnActor = new NativeFunction(base.add(0x2621CB0), 'pointer', ['pointer', 'pointer', 'pointer', 'pointer'], 'win64');

var AActor_GetPrivateStaticClass = new NativeFunction(base.add(0x2984D50), 'pointer', [], 'win64');
var UObject_GetPrivateStaticClass = new NativeFunction(base.add(0x137EDD0), 'pointer', [], 'win64');
var UClass_GetPrivateStaticClass = new NativeFunction(base.add(0x11F02E0), 'pointer', [], 'win64');

var StaticLoadObject = new NativeFunction(base.add(0x137B290), 'pointer', ['pointer', 'pointer', 'pointer', 'pointer', 'int32', 'pointer', 'int8', 'pointer'], 'win64');
var StaticFindObject = new NativeFunction(base.add(0x137AAA0), 'pointer', ['pointer', 'pointer', 'pointer', 'int8'], 'win64');

//var FActorSpawnParameters_FActorSpawnParameters = new NativeFunction(base.add(0x2955C40), 'void', ['pointer'], 'win64');

var FName_GetPlainNameString = new NativeFunction(base.add(0x11604F0), 'void', ['pointer', 'pointer'], 'win64');


var FMemory_Realloc = new NativeFunction(base.add(0x106C3D0), 'pointer', ['pointer', 'int64', 'int32'], 'win64');
/*
function spawnActor(World, Clazz) {
    var Parameters = Memory.alloc(0x30);
    FActorSpawnParameters_FActorSpawnParameters(Parameters);
    return UWorld_SpawnActor(World, Clazz, FTransform_Identity, Parameters);
}
*/
function logInfo(Info) {
    var f = new File('output.log', 'a');
    f.write('[Patches] ' + Info + '\n');
    f.close();
}
function arrayResize(Array, ElementSize, Num) {
    var Allocator = Array.readPointer();
    Array.add(12).writeU32(Num);
    var NewOne = FMemory_Realloc(Allocator, Num * ElementSize, 0);
    Array.writePointer(NewOne);
}

function arrayInit(Array, ElementSize, InitSize, MaxSize) {
    Array.writePointer(ptr(0));
    Array.add(8).writeU32(InitSize);
    arrayResize(Array, ElementSize, MaxSize);
}

function newFString(Length) {
    var FString = Memory.alloc(16 + Length * 2);
    FString.writePointer(FString.add(16));
    FString.add(8).writeU32(0);
    FString.add(12).writeU32(Length);
    return FString;
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
function getString(FString) {
    var Size = getArraySize(FString);
    var String = getArrayItemAddr(FString, 0, 0).readUtf16String(Size);
    return String;
}


//'ABP_Musket_Inventory_C'
function loadClassByName(ClassName) {
    return loadObjectByName(ClassName, UClass_GetPrivateStaticClass());
}
function findClassByName(ClassName) {
    return findObjectByName(ClassName, UClass_GetPrivateStaticClass());
}

function loadObjectByName(ObjectName, Clazz) {
    var Buffer = Memory.alloc((ObjectName.length + 1) * 2);
    Buffer.writeUtf16String(ObjectName);
    return StaticLoadObject(Clazz, ptr(0), Buffer, ptr(0), 0, ptr(0), 1, ptr(0));
}

function findObjectByName(ObjectName, Clazz) {
    var Buffer = Memory.alloc((ObjectName.length + 1) * 2);
    Buffer.writeUtf16String(ObjectName);
    return StaticFindObject(Clazz, ptr(0xFFFFFFFFFFFFFFFF), Buffer, 0);
}

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
//0=小枪,1=子弹,2=磨刀石,3=斧头,4=炸药桶 5=钥匙 6=铁 7=木板 8=弓 9=箭 
// 10=大枪 11=导管 12=煤炭 13=灯笼 14=火药 15=草药 16=毒药 17=解毒剂 18=骨头 
// 19=冰稿 20=茶 21=石头 22=铲子 23=炖肉 24=鸦片酊 25=针 26=菜刀 27=煤炭桶 28=军刀 29=夹子

var RoleInitInventory = new Map([
    ['Captain', [
        [23,99]
    ]],
    ['Chaplain', [
        [23,99]
    ]],
    ['Cook', [
        [23,99]
    ]],
    ['Doctor', [
        [23,99]
    ]],
    ['Engineer', [
        [23,99],
        [3,1]
    ]],
    ['Hunter', [
        [23,99]
    ]],
    ['Marine', [
        [23,99]
    ]],
    ['Navigator', [
        [23,99]
    ]]
]);

function initItemClass() {
    var TempMap = new Map([]);
    for (var [Id, ClassName] of RegisterItemClass) {
        var Clazz = findClassByName(ClassName);
        if (Clazz.isNull()) {
            Clazz = loadClassByName(ClassName);
        }
        TempMap.set(Id, Clazz);
    }
    RegisterItemClass = TempMap;
    return true;
}
Interceptor.attach(ADH_GameMode_InitGame_addr, {
    onEnter: function (args) {
        var GameMode = this.context.rcx;
        var GameInstance = UDH_GameInstance_GetInstance(GameMode);
        var PlayerRoleList = GameInstance.add(0x3B8);
        if (!initItemClass()) {
            return;
        }

        for (var i = 0; i < getArraySize(PlayerRoleList); i++) {
            var RoleData = getArrayItemAddr(PlayerRoleList, 8, i).readPointer();
            var OnlineName = getString(RoleData.add(0x48));
            //logInfo(OnlineName);
            var DesiredInventory = RoleInitInventory.get(OnlineName);
            //logInfo(DesiredInventory.length);
            if (DesiredInventory.length == 0) {
                continue;
            }
            var StartingDropTable = RoleData.add(0x128).readPointer();
            var Table = StartingDropTable.add(0x40);

            arrayResize(Table, 40, DesiredInventory.length);
            Table.add(8).writeU32(DesiredInventory.length);
            for (var j = 0; j < getArraySize(Table); j++) {
                var InventoryInfo = DesiredInventory[j];
                //logInfo(InventoryInfo);
                if (InventoryInfo.length != 2) {
                    continue;
                }
                var ClassId = InventoryInfo[0];

                var DesiredNum = InventoryInfo[1];
                var Clazz = RegisterItemClass.get(ClassId);
                //logInfo(DesiredNum);
                //logInfo(Clazz);

                var InventoryList = getArrayItemAddr(Table, 40, j);
                var ClassArray = InventoryList;
                arrayInit(ClassArray, 8, 1, 1);
                var ItemClass = getArrayItemAddr(ClassArray, 8, 0);
                var Weight = InventoryList.add(0x10);
                var GuaranteedSpawns = InventoryList.add(0x14);
                var MaximumSpawns = InventoryList.add(0x18);
                var StackSizeToSpawn = InventoryList.add(0x1C);

                Weight.writeFloat(1.0);
                MaximumSpawns.writeU32(0);
                StackSizeToSpawn.writeU32(1);


                ItemClass.writePointer(Clazz);
                GuaranteedSpawns.writeU32(DesiredNum);


                /*var NameBuffer = newFString(0x100);
                FName_GetPlainNameString(ItemClass.readPointer().add(0x18), NameBuffer);
                var ItemClassName = NameBuffer.readPointer().readUtf16String();
                logInfo(ItemClassName);
                logInfo("Weight: " + InventoryList.add(0x10).readFloat());
                logInfo("GuaranteedSpawns: " + InventoryList.add(0x14).readU32());
                logInfo("MaximumSpawns: " + InventoryList.add(0x18).readU32());
                logInfo("StackSizeToSpawn: " + InventoryList.add(0x1C).readU32());*/

            }


        }
    }

});