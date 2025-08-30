var base = Module.findBaseAddress('DreadHungerServer-Win64-Shipping.exe');
var UClass_SerializeDefaultObject_addr = base.add(0x11C3530);
var FName_GetPlainNameString = new NativeFunction(base.add(0x11604F0), 'void', ['pointer', 'pointer'], 'win64');
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

function getObjectFullName(UObject) {
    var FullName = '';
    var Ptr = ptr(UObject);
    while(!Ptr.isNull()) {
        var Name = getObjectName(Ptr);
        if(FullName.length == 0) {
            FullName = Name;
        }
        else {
            FullName = Name + '.' + FullName;
        }
        
        var OuterObject = Ptr.add(0x20);
        Ptr = OuterObject.readPointer();
    }
    return FullName;
}
/*修改每个物品下方的MaxStackCount和DurabilityUses后面的数字即可
MaxStackCount=最大叠加数
DurabilityUses=耐久值
Damage=武器伤害
UpgradeBonusDamage=磨刀石额外伤害
*/
var InventoryTable = {
    '/Game/Blueprints/Inventory/Flintlock/BP_Flintlock_Inventory.BP_Flintlock_Inventory_C' : {      //小枪
        'MaxStackCount' : 1,
		'DurabilityUses' : 999
    },
    '/Game/Blueprints/Inventory/Musket/BP_Musket_Inventory.BP_Musket_Inventory_C' : {      //大枪
        'MaxStackCount' : 1,
		'DurabilityUses' : 999,
        'Damage' : 30
    },
	'/Game/Blueprints/Inventory/Sword/BP_Sword_Inventory.BP_Sword_Inventory_C' : {      //军刀
		'MaxStackCount' : 1,
		'DurabilityUses' : 999,
        'Damage' : 50,
        'bHasDurability' : 0,
        'ThrowCost' : 0,
        'ThrowDelay' : 0

    },
	'/Game/Blueprints/Inventory/Lantern/BP_Lantern_Inventory.BP_Lantern_Inventory_C' : {      //灯笼
        'MaxStackCount' : 1,
    },
    '/Game/Blueprints/Inventory/Bow/BP_Bow_Inventory.BP_Bow_Inventory_C' : {      //弓
        'MaxStackCount' : 1,
        'Damage' : 100,
    },
    '/Game/Blueprints/Inventory/Flint/BP_GunParts_Inventory.BP_GunParts_Inventory_C' : {      //枪械零件
        'MaxStackCount' : 1
    },
    '/Game/Blueprints/Inventory/Flintlock/BP_Flintlock_Ammo_Inventory.BP_Flintlock_Ammo_Inventory_C' : {      //子弹
        'MaxStackCount' : 999
    },
    '/Game/Blueprints/Inventory/Bow/BP_Arrows_Inventory.BP_Arrows_Inventory_C' : {      //箭
        'MaxStackCount' : 999
    },
    '/Game/Blueprints/Inventory/WoodAxe/BP_WoodAxe_Inventory.BP_WoodAxe_Inventory_C' : {      //斧头
        'MaxStackCount' : 1
    },
    '/Game/Blueprints/Inventory/IceAxe/BP_IceAxe_Inventory.BP_IceAxe_Inventory_C' : {      //冰镐
        'MaxStackCount' : 1
    },
    '/Game/Blueprints/Inventory/Cleaver/BP_Cleaver_Inventory.BP_Cleaver_Inventory_C' : {      //菜刀
        'MaxStackCount' : 1
    },
    '/Game/Blueprints/Inventory/Shovel/BP_Shovel_Inventory.BP_Shovel_Inventory_C' : {      //铲子
        'MaxStackCount' : 1
    },
    '/Game/Blueprints/Inventory/Stick/BP_Stick_Inventory.BP_Stick_Inventory_C' : {      //木板
        'MaxStackCount' : 999
    },
    '/Game/Blueprints/Inventory/Rock/BP_Rock_Inventory.BP_Rock_Inventory_C' : {      //石头
        'MaxStackCount' : 999
    },
    '/Game/Blueprints/Inventory/Metals/BP_IronIngot_Inventory.BP_IronIngot_Inventory_C' : {      //废铁
        'MaxStackCount' : 999
    },
    '/Game/Blueprints/Inventory/Metals/BP_Nails_Inventory.BP_Nails_Inventory_C' : {      //钉子
        'MaxStackCount' : 999
    },
    '/Game/Blueprints/Inventory/Metals/BP_LeadIngot_Inventory.BP_LeadIngot_Inventory_C' : {      //铅锭
        'MaxStackCount' : 999
    },
    '/Game/Blueprints/Inventory/Coal/BP_Coal_Inventory.BP_Coal_Inventory_C' : {      //煤炭
        'MaxStackCount' : 999
    },
    '/Game/Blueprints/Inventory/Flintlock/BP_Gunpowder_Inventory.BP_Gunpowder_Inventory_C' : {      //火药
        'MaxStackCount' : 999
    },
    '/Game/Blueprints/Inventory/AnimalParts/BP_Sinew_Inventory.BP_Sinew_Inventory_C' : {      //肌腱
        'MaxStackCount' : 99
    },
    '/Game/Blueprints/Inventory/AnimalParts/BP_WolfPelt_Inventory.BP_WolfPelt_Inventory_C' : {      //动物皮毛
        'MaxStackCount' : 99
    },
    '/Game/Blueprints/Inventory/Tea/BP_Herbs_Inventory.BP_Herbs_Inventory_C' : {      //草药
        'MaxStackCount' : 99
    },
    '/Game/Blueprints/Inventory/Syringe/BP_Syringe_Inventory.BP_Syringe_Inventory_C' : {      //针
        'MaxStackCount' : 99
    },
    '/Game/Blueprints/Inventory/Poison/BP_Antidote_Inventory.BP_Antidote_Inventory_C' : {      //解毒剂
        'MaxStackCount' : 99
    },
    '/Game/Blueprints/Inventory/Syringe/BP_Inventory_Laudanum.BP_Inventory_Laudanum_C' : {      //鸦片酊
        'MaxStackCount' : 99
    },
    '/Game/Blueprints/Inventory/Meat/BP_AnimalMeat_Inventory.BP_AnimalMeat_Inventory_C' : {      //兽肉
        'MaxStackCount' : 99
    },
    '/Game/Blueprints/Inventory/Meat/BP_CookedMeat_Inventory.BP_CookedMeat_Inventory_C' : {      //熟兽肉
        'MaxStackCount' : 99
    },
    '/Game/Blueprints/Inventory/Meat/BP_HumanMeat_Inventory.BP_HumanMeat_Inventory_C' : {      //人肉
        'MaxStackCount' : 99
    },
    '/Game/Blueprints/Inventory/Meat/BP_BoneClub_Inventory.BP_BoneClub_Inventory_C' : {      //骨棒
        'MaxStackCount' : 99
    },
    '/Game/Blueprints/Inventory/AnimalParts/BP_Blubber_Inventory.BP_Blubber_Inventory_C' : {      //脂肪
        'MaxStackCount' : 99
    },
    '/Game/Blueprints/Inventory/Meat/BP_Stew_Inventory.BP_Stew_Inventory_C' : {      //炖肉
        'MaxStackCount' : 99
    },
    '/Game/Blueprints/Inventory/Tea/BP_Tea_Inventory.BP_Tea_Inventory_C' : {      //茶
        'MaxStackCount' : 99
    },
    '/Game/Blueprints/Inventory/Metals/BP_Whetstone_Inventory.BP_Whetstone_Inventory_C' : {      //磨刀石
        'MaxStackCount' : 99
    },
    '/Game/Blueprints/Inventory/BearTrap/BP_BearTrap_Inventory.BP_BearTrap_Inventory_C' : {      //夹子
        'MaxStackCount' : 99
    },
    '/Game/Blueprints/Inventory/Spyglass/BP_Spyglass_Inventory.BP_Spyglass_Inventory_C' : {      //望远镜
        'MaxStackCount' : 1
    },
    '/Game/Blueprints/Inventory/Powderkeg/BP_CoalBarrel_Inventory.BP_CoalBarrel_Inventory_C' : {      //煤炭桶
        'MaxStackCount' : 99
    },
    '/Game/Blueprints/Inventory/Powderkeg/BP_Powderkeg_Inventory.BP_Powderkeg_Inventory_C' : {      //炸药桶
        'MaxStackCount' : 99
    },
    '/Game/Blueprints/Inventory/Poison/BP_Poison_Inventory.BP_Poison_Inventory_C' : {      //毒药
        'MaxStackCount' : 99
    },
    '/Game/Blueprints/Environment/Nitro/BP_Nitro_Inventory.BP_Nitro_Inventory_C' : {      //硝化甘油
        'MaxStackCount' : 1
    },
    '/Game/Blueprints/Inventory/LockPick/BP_SkeletonKey_Inventory.BP_SkeletonKey_Inventory_C' : {      //万能钥匙
        'MaxStackCount' : 99
    },
    '/Game/Blueprints/Inventory/LockPick/BP_CaptainsKey_Inventory.BP_CaptainsKey_Inventory_C' : {      //船长室钥匙
        'MaxStackCount' : 1
    },
    '/Game/Blueprints/Inventory/Armory/BP_Code_Inventory.BP_Code_Inventory_C' : {      //军械库密码
        'MaxStackCount' : 1
    },
    '/Game/Blueprints/Inventory/Totem/BP_BoneDagger_Inventory.BP_BoneDagger_Inventory_C' : {      //骸骨匕首
        'MaxStackCount' : 1
    },
};

var PropertyOffsets = {
    'MaxStackCount' : ['int32', 0x814],//最大堆叠
	'DurabilityUses' : ['int32', 0x44c],//耐久
    'Damage' : ['float', 0x868],//武器伤害
    'UpgradeBonusDamage' : ['float', 0x84C],//磨刀石增加伤害
    'AimEntryTime' : ['float', 0x2C4],//进入瞄准耗时
    'AimExitTime' : ['float', 0x2C8],//离开瞄准耗时
    'bHasDurability' : ['int8', 0x441],//是否存在耐久
    'bDestroyOnZeroDurability' : ['int8', 0x442],//耐久度归零时是否自动销毁物品
    'bAlwaysDamageWhenDropped' : ['int8', 0x444],//丢弃物品时是否必定造成耐久度损伤
    'bDamageWhenUsed' : ['int8', 0x445],//是否消耗耐久
    'DefaultDurability' : ['float', 0x448],//默认最大耐久度值
    'UseCooldown' : ['float', 0x520],//使用冷却
    'bCanBeDropped' : ['int8', 0x690],//是否可以被主动丢弃
    'bObliterateWithCarrier' : ['int8', 0x691],//拥有者死亡则物品消失
    'ThrowCost' : ['float', 0x774],//投掷体力消耗
    'ThrowDelay' : ['float', 0x778],//投掷延迟
    'bCanBeTransferred' : ['int8', 0x811],//物品是否可以在玩家之间转移
    'FuelValue' : ['float', 0x8AC],//作为燃料时提供的能量值
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
Interceptor.attach(UClass_SerializeDefaultObject_addr, {
    onEnter : function(args) {
        this.UClass = args[0];
        this.ClassDefaultObject = args[1];
    },
    onLeave : function(ret) {
        var UClass = this.UClass;
        var ClassDefaultObject = this.ClassDefaultObject;
        var FullName = getObjectFullName(UClass);
        
        if(!InventoryTable.hasOwnProperty(FullName)) {
            return;
        }
        var InventoryInfo = InventoryTable[FullName];
        processProperty(PropertyOffsets, InventoryInfo, ClassDefaultObject);
    }
});