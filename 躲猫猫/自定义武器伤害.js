var base = Module.findBaseAddress('DreadHungerServer-Win64-Shipping.exe');
var ADH_Inventory_BeginPlay_addr = base.add(0xDBE260);
function logInfo(Info) {
    var f = new File('output.log', 'a');
    f.write('[Patches] ' + Info + '\n');
    f.close();
}
var DamageTable = [  // 伤害表
    ['/Game/Blueprints/Inventory/Flintlock/BP_Flintlock_Inventory.BP_Flintlock_Inventory_C', 52,5], // 燧发枪
    ['/Game/Blueprints/Inventory/WoodAxe/BP_WoodAxe_Inventory.BP_WoodAxe_Inventory_C', 16,5],  // 斧头
    ['/Game/Blueprints/Inventory/Bow/BP_Bow_Inventory.BP_Bow_Inventory_C', 100,5], // 弓
    ['/Game/Blueprints/Inventory/Musket/BP_Musket_Inventory.BP_Musket_Inventory_C', 1,5],  // 滑膛枪
    ['/Game/Blueprints/Inventory/IceAxe/BP_IceAxe_Inventory.BP_IceAxe_Inventory_C', 0,5],  // 冰镐
    ['/Game/Blueprints/Inventory/Shovel/BP_Shovel_Inventory.BP_Shovel_Inventory_C', 0,5],  // 铲子
    ['/Game/Blueprints/Inventory/Cleaver/BP_Cleaver_Inventory.BP_Cleaver_Inventory_C', 0,5], //菜刀
    ['/Game/Blueprints/Inventory/Sword/BP_Sword_Inventory.BP_Sword_Inventory_C', 50,5], //军刀
    ['/Game/Blueprints/Inventory/Totem/BP_BoneDagger_Inventory.BP_BoneDagger_Inventory_C', 0,5], // 骨匕首
    ['/Game/Blueprints/Inventory/Fists/BP_Fists_Inventory.BP_Fists_Inventory_C', 7,5], //拳头
    ['/Game/Blueprints/Inventory/BearTrap/BP_BearTrap_Inventory.BP_BearTrap_Inventory_C', 30,5], //夹子
    ['/Game/Blueprints/Inventory/Coal/BP_Coal_Inventory.BP_Coal_Inventory_C', 8,5], //煤炭
    ['/Game/Blueprints/Inventory/Meat/BP_BoneClub_Inventory.BP_BoneClub_Inventory_C', 10,5], //骨棒
    ['/Game/Blueprints/Inventory/Metals/BP_LeadIngot_Inventory.BP_LeadIngot_Inventory_C', 8,5], //铅锭
    ['/Game/Blueprints/Inventory/Rock/BP_Rock_Inventory.BP_Rock_Inventory_C', 8,5],  //石头
    ['/Game/Blueprints/Inventory/Spyglass/BP_Spyglass_Inventory.BP_Spyglass_Inventory_C', 10,5], //望远镜
    ['/Game/Blueprints/Inventory/Stick/BP_Stick_Inventory.BP_Stick_Inventory_C', 6,5] //木板
];
var UClass_GetPrivateStaticClass = new NativeFunction(base.add(0x11F02E0), 'pointer', [], 'win64');

var StaticLoadObject = new NativeFunction(base.add(0x137B290), 'pointer', ['pointer', 'pointer', 'pointer', 'pointer', 'int32', 'pointer', 'int8', 'pointer'], 'win64');
var StaticFindObject = new NativeFunction(base.add(0x137AAA0), 'pointer', ['pointer', 'pointer', 'pointer', 'int8'], 'win64');

function findClassByName(ClassName) {
    return findObjectByName(ClassName, UClass_GetPrivateStaticClass());
}
function findObjectByName(ObjectName, Clazz) {
    var Buffer = Memory.alloc((ObjectName.length + 1) * 2);
    Buffer.writeUtf16String(ObjectName);
    return StaticFindObject(Clazz, ptr(0xFFFFFFFFFFFFFFFF), Buffer, 0);
}
function initItemClass() {
    for (var i = 0; i < DamageTable.length; i++) {
        var ClassName = DamageTable[i][0];
        var Clazz = findClassByName(ClassName);
        if (Clazz.isNull()) {
            Clazz = loadClassByName(ClassName);
        }
        DamageTable[i][0] = Clazz;
    }
    return true;
}
var Init = false;
Interceptor.attach(ADH_Inventory_BeginPlay_addr, {
    onEnter : function(args) {
        this.Inventory = args[0];
    },
    onLeave : function(ret) {
        if(!Init) {
            if(!initItemClass()) {
                return;
            }
            Init = true;
        }
        var Inventory = this.Inventory;
        var Clazz = Inventory.add(0x10).readPointer();
        for (var i = 0; i < DamageTable.length; i++) {
            if(DamageTable[i][0].equals(Clazz)) {
                var Damage = Inventory.add(0x868);
                Damage.writeFloat(DamageTable[i][1]);
                var UpgradeBonusDamage = Inventory.add(0x86C);
                UpgradeBonusDamage.writeFloat(DamageTable[i][2]);
                break;
            }
        }
    }
});