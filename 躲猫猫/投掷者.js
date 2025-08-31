var base = Module.findBaseAddress('DreadHungerServer-Win64-Shipping.exe');

var UClass_GetPrivateStaticClass = new NativeFunction(base.add(0x11F02E0), 'pointer', []);
var StaticFindObject = new NativeFunction(base.add(0x1379D20), 'pointer', ['pointer', 'pointer', 'pointer', 'int8']);
var UObject_GetWorld = new NativeFunction(base.add(0x13075A0), 'pointer', ['pointer']);
var AActor_SetLifeSpan = new NativeFunction(base.add(0x22E9780), 'void', ['pointer', 'float']);
var FActorSpawnParameters_FActorSpawnParameters = new NativeFunction(base.add(0x29584A0), 'void', ['pointer']);
var UWorld_SpawnActor = new NativeFunction(base.add(0x2624510), 'pointer', ['pointer', 'pointer', 'pointer', 'pointer']);
var FName_GetPlainNameString = new NativeFunction(base.add(0x11604F0), 'void', ['pointer', 'pointer']);
var ADH_InventoryPickup_PickUp = new NativeFunction(base.add(0xdda3e0), 'void', ['pointer', 'pointer', 'int32']);
function logInfo(Info) {
	var f = new File('output.log', 'a');
	f.write('[Patches] ' + Info + '\n');
	f.close();
}
function getActorTransform(AActor) {
    var RootComponent = AActor.add(0x130).readPointer();
    if (RootComponent.isNull()) {
        return ptr(0);
    }
    var ComponentToWorld = RootComponent.add(0x1C0);
    return ComponentToWorld;
}
function findObjectByName(ObjectName, Clazz) {
    var Buffer = Memory.alloc((ObjectName.length + 1) * 2);
    Buffer.writeUtf16String(ObjectName);
    return StaticFindObject(Clazz, ptr(0xFFFFFFFFFFFFFFFF), Buffer, 0);
}
function findClassByName(ClassName) {
    return findObjectByName(ClassName, UClass_GetPrivateStaticClass());
}
function spawnActor(World, Clazz, Position) {
    var Parameters = Memory.alloc(0x30);
    FActorSpawnParameters_FActorSpawnParameters(Parameters);
    return UWorld_SpawnActor(World, Clazz, Position, Parameters);
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
/*
/Game/Blueprints/Game/BP_Explosion_Nitro.BP_Explosion_Nitro_C
/Game/Blueprints/Game/BP_Explosion_Gunpowder.BP_Explosion_Gunpowder_C
/Game/Blueprints/Game/BP_Explosion_Gunpowder_OffShip.BP_Explosion_Gunpowder_OffShip_C
*/

var autoRegressionInventorys = [
    '/Game/Blueprints/Inventory/Sword/BP_Sword_Inventory.BP_Sword_Inventory_C',//军刀
    '/Game/Blueprints/Inventory/WoodAxe/BP_WoodAxe_Inventory.BP_WoodAxe_Inventory_C'
];
var ADH_InventoryPickup_OnPickupMovementStopped_addr = base.add(0xDD77C0)
Interceptor.attach(ADH_InventoryPickup_OnPickupMovementStopped_addr, {
    onEnter : function(args){
        this.ADH_InventoryPickup = args[0]
        var ADH_InventoryPickup = args[0];
        this.ADH_HumanCharacter = ADH_InventoryPickup.add(0x118).readPointer();
        
    }, 
    onLeave : function(ret){
        var ADH_InventoryPickup = this.ADH_InventoryPickup;
        var UClass = ADH_InventoryPickup.add(0x248).readPointer();
        var ADH_HumanCharacter = this.ADH_HumanCharacter;
        var ADH_PlayerController = ADH_HumanCharacter.add(0xA08).readPointer();
        try{
            for(var i = 0; i < autoRegressionInventorys.length; i++){
                var InventoryClass = findClassByName(autoRegressionInventorys[i]);
                if(InventoryClass.isNull()){
                    continue;
                }
                if(UClass.equals(InventoryClass)){
                    ADH_InventoryPickup_PickUp(ADH_InventoryPickup, ADH_PlayerController, 0);
                }
            }
        }catch(e){
            //logInfo(e);
        }
        
    }
});