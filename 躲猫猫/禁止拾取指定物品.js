var base = Module.findBaseAddress('DreadHungerServer-Win64-Shipping.exe');
var UDH_InventoryManager_AddInventory_addr = base.add(0xDBB960);
var ADH_Inventory_Use_Implementation_addr = base.add(0xdeb340);
var StaticFindObject = new NativeFunction(base.add(0x137AAA0), 'pointer', ['pointer', 'pointer', 'pointer', 'int8'], 'win64');
var UClass_GetPrivateStaticClass = new NativeFunction(base.add(0x11F02E0), 'pointer', [], 'win64');
var ADH_PlayerState_SetIsDead = new NativeFunction(base.add(0xE4E700), 'void', ['pointer', 'int8'], 'win64');
var ADH_HumanCharacter_SetIsSpiritWalking = new NativeFunction(base.add(0xD70310), 'void', ['pointer', 'int8', 'float'], 'win64');
function findClassByName(ClassName) {
    return findObjectByName(ClassName, UClass_GetPrivateStaticClass());
}

function findObjectByName(ObjectName, Clazz) {
    var Buffer = Memory.alloc((ObjectName.length + 1) * 2);
    Buffer.writeUtf16String(ObjectName);
    return StaticFindObject(Clazz, ptr(0xFFFFFFFFFFFFFFFF), Buffer, 0);
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
        var TargetItem = args[1]; 
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
                if(TargetItem.equals(ThrallClazzs[i])){
                    args[1] = ptr(0);
                }
            }
        }else{
            for(var i = 0; i < ExplorerClazzs.length; i++){
                if(TargetItem.equals(ExplorerClazzs[i])){
                    args[1] = ptr(0);
                }
            }

        }
    }
});

var SpecialInventory1 = [
    '/Game/Blueprints/Inventory/Syringe/BP_Inventory_Laudanum.BP_Inventory_Laudanum_C',
];

Interceptor.attach(ADH_Inventory_Use_Implementation_addr, {
    onEnter : function (args) {
        this.ADH_Inventory = args[0];
    },onLeave : function (retval) { 
        var ADH_Inventory = this.ADH_Inventory;
        var ADH_HumanCharacter = ADH_Inventory.add(0x268).readPointer();
        var TargetItem = ADH_Inventory.add(0x10).readPointer();
        for(var i = 0; i < SpecialInventory1.length; i++){
            var Clazz = findClassByName(SpecialInventory1[i]);
            if(Clazz.isNull()) {
                continue;
            }
            if(TargetItem.equals(Clazz)){
                ADH_HumanCharacter_SetIsSpiritWalking(ADH_HumanCharacter, 1, 2);
            }
        }
    }
});
