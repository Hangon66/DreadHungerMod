var base = Module.findBaseAddress('DreadHungerServer-Win64-Shipping.exe');
var UObject_Serialize_addr = base.add(0x1312A60);
var FName_GetPlainNameString = new NativeFunction(base.add(0x11604F0), 'void', ['pointer', 'pointer'], 'win64');
var FMemory_Realloc = new NativeFunction(base.add(0x106C3D0), 'pointer', ['pointer', 'int64', 'int32'], 'win64');
var UClass_GetPrivateStaticClass = new NativeFunction(base.add(0x11F02E0), 'pointer', [], 'win64');
var StaticLoadObject = new NativeFunction(base.add(0x137B290), 'pointer', ['pointer', 'pointer', 'pointer', 'pointer', 'int32', 'pointer', 'int8', 'pointer'], 'win64');
var StaticFindObject = new NativeFunction(base.add(0x137AAA0), 'pointer', ['pointer', 'pointer', 'pointer', 'int8'], 'win64');
function logInfo(Info) {
    var f = new File('output.log', 'a');
    f.write('[Patches] ' + Info + '\n');
    f.close();
}

function newFString(Length) {
    var FString = Memory.alloc(16 + Length * 2);
    FString.writePointer(FString.add(16));
    FString.add(8).writeU32(0);
    FString.add(12).writeU32(Length);
    return FString;
}

function getObjectName(UObject) {
    var NamePrivate = UObject.add(0x18);
    var NameBuffer = newFString(100);
    FName_GetPlainNameString(NamePrivate, NameBuffer);
    return NameBuffer.readPointer().readUtf16String();
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

function getArraySize(TArray) {
    return TArray.add(8).readU32();
}
function getArrayItemAddr(TArray, size, index) {
    var ArrNum = getArraySize(TArray);
    if (index > ArrNum)
        return null;
    return TArray.readPointer().add(index * size);
}
var ItemTable = new Map([
    [0, '/Game/Blueprints/Inventory/Fists/BP_Fists_Inventory.BP_Fists_Inventory_C'],
    [1, '/Game/Blueprints/Inventory/Flintlock/BP_Flintlock_Inventory.BP_Flintlock_Inventory_C'],
    [2, '/Game/Blueprints/Inventory/Musket/BP_Musket_Inventory.BP_Musket_Inventory_C'],
    [3, '/Game/Blueprints/Inventory/Bow/BP_Bow_Inventory.BP_Bow_Inventory_C'],
    [4, '/Game/Blueprints/Inventory/Flint/BP_GunParts_Inventory.BP_GunParts_Inventory_C'],
    [5, '/Game/Blueprints/Inventory/Flintlock/BP_Flintlock_Ammo_Inventory.BP_Flintlock_Ammo_Inventory_C'],
    [6, '/Game/Blueprints/Inventory/Bow/BP_Arrows_Inventory.BP_Arrows_Inventory_C'],
    [7, '/Game/Blueprints/Inventory/Sword/BP_Sword_Inventory.BP_Sword_Inventory_C'],
    [8, '/Game/Blueprints/Inventory/WoodAxe/BP_WoodAxe_Inventory.BP_WoodAxe_Inventory_C'],
    [9, '/Game/Blueprints/Inventory/IceAxe/BP_IceAxe_Inventory.BP_IceAxe_Inventory_C'],
    [10, '/Game/Blueprints/Inventory/Cleaver/BP_Cleaver_Inventory.BP_Cleaver_Inventory_C'],
    [11, '/Game/Blueprints/Inventory/Shovel/BP_Shovel_Inventory.BP_Shovel_Inventory_C'],
    [12, '/Game/Blueprints/Inventory/Stick/BP_Stick_Inventory.BP_Stick_Inventory_C'],
    [13, '/Game/Blueprints/Inventory/Rock/BP_Rock_Inventory.BP_Rock_Inventory_C'],
    [14, '/Game/Blueprints/Inventory/Metals/BP_IronIngot_Inventory.BP_IronIngot_Inventory_C'],
    [15, '/Game/Blueprints/Inventory/Metals/BP_Nails_Inventory.BP_Nails_Inventory_C'],
    [16, '/Game/Blueprints/Inventory/Metals/BP_LeadIngot_Inventory.BP_LeadIngot_Inventory_C'],
    [17, '/Game/Blueprints/Inventory/Coal/BP_Coal_Inventory.BP_Coal_Inventory_C'],
    [18, '/Game/Blueprints/Inventory/Flintlock/BP_Gunpowder_Inventory.BP_Gunpowder_Inventory_C'],
    [19, '/Game/Blueprints/Inventory/AnimalParts/BP_Sinew_Inventory.BP_Sinew_Inventory_C'],
    [20, '/Game/Blueprints/Inventory/AnimalParts/BP_WolfPelt_Inventory.BP_WolfPelt_Inventory_C'],
    [21, '/Game/Blueprints/Inventory/Tea/BP_Herbs_Inventory.BP_Herbs_Inventory_C'],
    [22, '/Game/Blueprints/Inventory/Syringe/BP_Syringe_Inventory.BP_Syringe_Inventory_C'],
    [23, '/Game/Blueprints/Inventory/Poison/BP_Antidote_Inventory.BP_Antidote_Inventory_C'],
    [24, '/Game/Blueprints/Inventory/Syringe/BP_Inventory_Laudanum.BP_Inventory_Laudanum_C'],
    [25, '/Game/Blueprints/Inventory/Meat/BP_AnimalMeat_Inventory.BP_AnimalMeat_Inventory_C'],
    [26, '/Game/Blueprints/Inventory/Meat/BP_CookedMeat_Inventory.BP_CookedMeat_Inventory_C'],
    [27, '/Game/Blueprints/Inventory/Meat/BP_HumanMeat_Inventory.BP_HumanMeat_Inventory_C'],
    [28, '/Game/Blueprints/Inventory/Meat/BP_BoneClub_Inventory.BP_BoneClub_Inventory_C'],
    [29, '/Game/Blueprints/Inventory/AnimalParts/BP_Blubber_Inventory.BP_Blubber_Inventory_C'],
    [30, '/Game/Blueprints/Inventory/Meat/BP_Stew_Inventory.BP_Stew_Inventory_C'],
    [31, '/Game/Blueprints/Inventory/Tea/BP_Tea_Inventory.BP_Tea_Inventory_C'],
    [32, '/Game/Blueprints/Inventory/Metals/BP_Whetstone_Inventory.BP_Whetstone_Inventory_C'],
    [33, '/Game/Blueprints/Inventory/BearTrap/BP_BearTrap_Inventory.BP_BearTrap_Inventory_C'],
    [34, '/Game/Blueprints/Inventory/Spyglass/BP_Spyglass_Inventory.BP_Spyglass_Inventory_C'],
    [35, '/Game/Blueprints/Inventory/Lantern/BP_Lantern_Inventory.BP_Lantern_Inventory_C'],
    [36, '/Game/Blueprints/Inventory/Powderkeg/BP_CoalBarrel_Inventory.BP_CoalBarrel_Inventory_C'],
    [37, '/Game/Blueprints/Inventory/Powderkeg/BP_Powderkeg_Inventory.BP_Powderkeg_Inventory_C'],
    [38, '/Game/Blueprints/Inventory/Poison/BP_Poison_Inventory.BP_Poison_Inventory_C'],
    [39, '/Game/Blueprints/Environment/Nitro/BP_Nitro_Inventory.BP_Nitro_Inventory_C'],
    [40, '/Game/Blueprints/Inventory/LockPick/BP_SkeletonKey_Inventory.BP_SkeletonKey_Inventory_C'],
    [41, '/Game/Blueprints/Inventory/LockPick/BP_CaptainsKey_Inventory.BP_CaptainsKey_Inventory_C'],
    [42, '/Game/Blueprints/Inventory/Armory/BP_Code_Inventory.BP_Code_Inventory_C'],
    [43, '/Game/Blueprints/Inventory/Totem/BP_BoneDagger_Inventory.BP_BoneDagger_Inventory_C'],
    [44, '/Game/Blueprints/Inventory/Quest/BP_Quest_Inventory.BP_Quest_Inventory_C']
/*

拳头 = 0

远程武器:
小枪 = 1
大枪 = 2
弓 = 3
枪械零件 = 4

弹药:	
子弹 = 5
箭 = 6

近战武器:
军刀 = 7
斧头 = 8
冰镐 = 9
菜刀 = 10
铲子 = 11

物资:
木板 = 12
石头 = 13
废铁 = 14
钉子 = 15
铅锭 = 16
煤炭 = 17
火药 = 18
肌腱 = 19
动物皮毛 = 20
草药 = 21

恢复:
针 = 22
解毒剂 = 23
鸦片酊 = 24

食物:
兽肉 = 25
熟兽肉 = 26
人肉 = 27
骨棒 = 28
脂肪 = 29
炖肉 = 30
茶 = 31

道具类:
磨刀石 = 32
夹子 = 33
望远镜 = 34
灯笼 = 35
煤炭桶 = 36
炸药桶 = 37
毒药 = 38
硝化甘油 = 39

钥匙:
万能钥匙 = 40
船长的钥匙 = 41

其他:
军械库密码 = 42
骸骨匕首 = 43
任务卷轴 = 44

*/
]);

var CustomDropTables = {
    "DT_HumanSkeleton" : [ //骸骨
        {
            "Items": [],
            "Weight": 30, //权重
            "GuaranteedSpawns": 0, //最小生成的数量
            "MaximumSpawns": 1, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
        {
            "Items": [],
            "Weight": 10, //权重
            "GuaranteedSpawns": 0, //最小生成的数量
            "MaximumSpawns": 3, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
        {
            "Items": [19],
            "Weight": 5, //权重
            "GuaranteedSpawns": 0, //最小生成的数量
            "MaximumSpawns": 1, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
        {
            "Items": [28],
            "Weight": 20, //权重
            "GuaranteedSpawns": 0, //最小生成的数量
            "MaximumSpawns": 1, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
        {
            "Items": [24],
            "Weight": 2, //权重
            "GuaranteedSpawns": 0, //最小生成的数量
            "MaximumSpawns": 1, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
        {
            "Items": [43],
            "Weight": 5, //权重
            "GuaranteedSpawns": 0, //最小生成的数量
            "MaximumSpawns": 1, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
        {
            "Items": [],
            "Weight": 5, //权重
            "GuaranteedSpawns": 0, //最小生成的数量
            "MaximumSpawns": 1, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
    ],
    "DT_OfficerSkeleton" : [ //军官骸骨
        {
            "Items": [],
            "Weight": 30, //权重
            "GuaranteedSpawns": 0, //最小生成的数量
            "MaximumSpawns": 1, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
        {
            "Items": [19],
            "Weight": 8, //权重
            "GuaranteedSpawns": 0, //最小生成的数量
            "MaximumSpawns": 1, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
        {
            "Items": [28],
            "Weight": 30, //权重
            "GuaranteedSpawns": 0, //最小生成的数量
            "MaximumSpawns": 2, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
        {
            "Items": [7],
            "Weight": 15, //权重
            "GuaranteedSpawns": 0, //最小生成的数量
            "MaximumSpawns": 1, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
        {
            "Items": [43],
            "Weight": 2, //权重
            "GuaranteedSpawns": 0, //最小生成的数量
            "MaximumSpawns": 1, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
        {
            "Items": [5],
            "Weight": 8, //权重
            "GuaranteedSpawns": 0, //最小生成的数量
            "MaximumSpawns": 3, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
        {
            "Items": [],
            "Weight": 5, //权重
            "GuaranteedSpawns": 0, //最小生成的数量
            "MaximumSpawns": 1, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
    ],
    "DT_HumanCorpse" : [ //尸体
        {
            "Items": [27],
            "Weight": 30, //权重
            "GuaranteedSpawns": 1, //最小生成的数量
            "MaximumSpawns": 1, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
        {
            "Items": [],
            "Weight": 10, //权重
            "GuaranteedSpawns": 0, //最小生成的数量
            "MaximumSpawns": 3, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
        {
            "Items": [],
            "Weight": 5, //权重
            "GuaranteedSpawns": 0, //最小生成的数量
            "MaximumSpawns": 3, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
        {
            "Items": [43],
            "Weight": 5, //权重
            "GuaranteedSpawns": 0, //最小生成的数量
            "MaximumSpawns": 1, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
        {
            "Items": [19],
            "Weight": 4, //权重
            "GuaranteedSpawns": 0, //最小生成的数量
            "MaximumSpawns": 1, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
        {
            "Items": [28],
            "Weight": 20, //权重
            "GuaranteedSpawns": 0, //最小生成的数量
            "MaximumSpawns": 1, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
        {
            "Items": [24],
            "Weight": 2, //权重
            "GuaranteedSpawns": 0, //最小生成的数量
            "MaximumSpawns": 1, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
    ],
    "DT_CaptainsTrunk" : [ //船长宝箱
        {
            "Items": [36, 43, 22, 23],
            "Weight": 1, //权重
            "GuaranteedSpawns": 1, //最小生成的数量
            "MaximumSpawns": 1, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
        {
            "Items": [31],
            "Weight": 1, //权重
            "GuaranteedSpawns": 1, //最小生成的数量
            "MaximumSpawns": 1, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
        {
            "Items": [33, 24, 20],
            "Weight": 1, //权重
            "GuaranteedSpawns": 1, //最小生成的数量
            "MaximumSpawns": 1, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
        {
            "Items": [17, 35],
            "Weight": 1, //权重
            "GuaranteedSpawns": 1, //最小生成的数量
            "MaximumSpawns": 1, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
    ],
    "DT_StrongBox" : [ //保险箱
        {
            "Items": [4, 32, 22, 34, 9, 23],
            "Weight": 30, //权重
            "GuaranteedSpawns": 1, //最小生成的数量
            "MaximumSpawns": 1, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
        {
            "Items": [43,17, 33, 20, 36, 24, 35],
            "Weight": 10, //权重
            "GuaranteedSpawns": 1, //最小生成的数量
            "MaximumSpawns": 1, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
        {
            "Items": [15, 18, 5],
            "Weight": 3, //权重
            "GuaranteedSpawns": 0, //最小生成的数量
            "MaximumSpawns": 5, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
        {
            "Items": [31, 26],
            "Weight": 5, //权重
            "GuaranteedSpawns": 0, //最小生成的数量
            "MaximumSpawns": 1, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
    ],
    "DT_StrongBoxThrall" : [ //保险箱_狼人
        {
            "Items": [43, 4, 32, 22, 9, 23],
            "Weight": 30, //权重
            "GuaranteedSpawns": 1, //最小生成的数量
            "MaximumSpawns": 1, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
        {
            "Items": [17, 33, 20, 36, 24, 35, 34],
            "Weight": 10, //权重
            "GuaranteedSpawns": 1, //最小生成的数量
            "MaximumSpawns": 1, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
        {
            "Items": [38, 37],
            "Weight": 5, //权重
            "GuaranteedSpawns": 0, //最小生成的数量
            "MaximumSpawns": 5, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
        {
            "Items": [15, 18, 5],
            "Weight": 5, //权重
            "GuaranteedSpawns": 0, //最小生成的数量
            "MaximumSpawns": 5, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
        {
            "Items": [31, 26],
            "Weight": 5, //权重
            "GuaranteedSpawns": 0, //最小生成的数量
            "MaximumSpawns": 1, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
    ],
	"DT_RaftStorage" : [ //救生艇
        {
            "Items": [14], //这行勿动(否则会导致无法拿取)
            "Weight": 1, //权重
            "GuaranteedSpawns": 20, //最小生成的数量
            "MaximumSpawns": 20, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数DT_RaftStorage
        },
		{
            "Items": [16], //这行勿动(否则会导致无法拿取)
            "Weight": 1, //权重
            "GuaranteedSpawns": 20, //最小生成的数量
            "MaximumSpawns": 20, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数DT_RaftStorage
        },
    ],
}
/*
    "DT_HumanSkeleton" : [ //骸骨
    ],
    "DT_OfficerSkeleton" : [ //军官骸骨
    ],
    "DT_HumanCorpse" : [ //尸体
    ],
    "DT_CaptainsTrunk" : [ //船长宝箱
    ],
    "DT_StorageTrunk_Supplies" : [ //大物资箱
    ],
    "DT_StorageTrunk_Supplies_Low" : [ //小物资箱
    ],
    "DT_ArmoryBox_Musket" : [ //军械库储藏箱
    ],
    "DT_CoalSled" : [ //煤车
    ],
    "DT_CoalSled_High" : [ //大煤车
    ],
    "DT_StorageTrunk_Ammo" : [ //弹药箱
    ],
    "DT_StorageTrunk_Nitro" : [ //硝化甘油
    ],
    "DT_StrongBox" : [ //保险箱
    ],
    "DT_StrongBoxThrall" : [ //保险箱_狼人
    ],
    "DT_ShipCoalStorage" : [ //锅炉房储藏箱
    ],
    "DT_ShipStorage" : [ //储藏箱_船
    ],
    "DT_Stove" : [ //火炉
    ],
    "DT_ShipBoiler" : [ //锅炉
    ],
    "DT_Cannibal" : [ //食尸鬼尸体
        {
            "Items": [27], //这行勿动(否则会导致无法拿取)
            "Weight": 1, //权重
            "GuaranteedSpawns": 1, //最小生成的数量
            "MaximumSpawns": 1, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
    ],
    "DT_Bear" : [ //北极熊尸体
        {
            "Items": [25], //这行勿动(否则会导致无法拿取)
            "Weight": 1, //权重
            "GuaranteedSpawns": 6, //最小生成的数量
            "MaximumSpawns": 6, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
    ],
    "DT_Wolf" : [ //狼尸体
        {
            "Items": [25], //这行勿动(否则会导致无法拿取)
            "Weight": 1, //权重
            "GuaranteedSpawns": 3, //最小生成的数量
            "MaximumSpawns": 3, //最大生成的数量
            "StackSizeToSpawn": 1 //倍率
        },
    ],
    "DT_SealPrey" : [ //海豹尸体
        {
            "Items": [25], //这行勿动(否则会导致无法拿取)
            "Weight": 1, //权重
            "GuaranteedSpawns": 1, //最小生成的数量
            "MaximumSpawns": 1, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
    ],
    "DT_SmallPrey" : [ //北极兔 老鼠尸体
        {
            "Items": [25], //这行勿动(否则会导致无法拿取)
            "Weight": 1, //权重
            "GuaranteedSpawns": 1, //最小生成的数量
            "MaximumSpawns": 1, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数
        },
    ],
	"DT_RaftStorage" : [ //救生艇
        {
            "Items": [14], //这行勿动(否则会导致无法拿取)
            "Weight": 1, //权重
            "GuaranteedSpawns": 20, //最小生成的数量
            "MaximumSpawns": 20, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数DT_RaftStorage
        },
		{
            "Items": [16], //这行勿动(否则会导致无法拿取)
            "Weight": 1, //权重
            "GuaranteedSpawns": 20, //最小生成的数量
            "MaximumSpawns": 20, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数DT_RaftStorage
        },
    ]
	"DT_MedicalSupplies" : [ //医生包
        {
            "Items": [14], //这行勿动(否则会导致无法拿取)
            "Weight": 1, //权重
            "GuaranteedSpawns": 20, //最小生成的数量
            "MaximumSpawns": 20, //最大生成的数量
            "StackSizeToSpawn": 1 //物品生成倍数DT_RaftStorage
        },
	"DT_SurvivalSupplies" : [ //背包
	{
		"Items": [14], //这行勿动(否则会导致无法拿取)
		"Weight": 1, //权重
		"GuaranteedSpawns": 20, //最小生成的数量
		"MaximumSpawns": 20, //最大生成的数量
		"StackSizeToSpawn": 1 //物品生成倍数DT_RaftStorage
	},
    ]
*/
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


function getItemClass(ClassName) {
    var Clazz = findClassByName(ClassName);
    if (Clazz.isNull()) {
        Clazz = loadClassByName(ClassName);
    }
    return Clazz;
}
Interceptor.attach(UObject_Serialize_addr, {
    onEnter : function(args) {
        this.UObject = args[0];
    },
    onLeave : function(ret) {
        var ClassPrivate = this.UObject.add(0x10).readPointer();
        var ClassName = getObjectName(ClassPrivate);
        var ObjectName = getObjectName(this.UObject);
        if(ClassName == 'DH_DropTable') {
            var DropTable = this.UObject;
            var Table = DropTable.add(0x40);
            if(!CustomDropTables.hasOwnProperty(ObjectName)) {
                return;
            }
            var CustomDropTable = CustomDropTables[ObjectName];
            var Length = Object.keys(CustomDropTable).length;
            arrayResize(Table, 40, Length);
            Table.add(8).writeU32(Length);
            for (var i = 0; i < Length; i++) { 
                var InventoryList = getArrayItemAddr(Table, 40, i);
                var InventoryInfo = CustomDropTable[i];

                var List = InventoryList;
                var Weight = InventoryList.add(0x10);
                var GuaranteedSpawns = InventoryList.add(0x14);
                var MaximumSpawns = InventoryList.add(0x18);
                var StackSizeToSpawn = InventoryList.add(0x1C);
                
                Weight.writeFloat(InventoryInfo.Weight);
                MaximumSpawns.writeU32(InventoryInfo.MaximumSpawns);
                StackSizeToSpawn.writeU32(InventoryInfo.StackSizeToSpawn);
                GuaranteedSpawns.writeU32(InventoryInfo.GuaranteedSpawns);
                var ItemNum = InventoryInfo.Items.length;
                arrayInit(List, 8, ItemNum, ItemNum);
                List.add(8).writeU32(ItemNum);
                for(var j = 0; j < ItemNum; j++) {
                    var ItemName = ItemTable.get(InventoryInfo.Items[j]);
                    var ItemClass = getItemClass(ItemName);
                    getArrayItemAddr(List, 8, j).writePointer(ItemClass);
                }
            }
        }
        
    }
});