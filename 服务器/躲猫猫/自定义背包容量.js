
//qq群421015336定期发布最新脚本
//作者：提莫
var base = Module.findBaseAddress("DreadHungerServer-Win64-Shipping.exe");
var ADH_HumanCharacter_AddStartingInventory_addr = base.add(0xD46F10);
var UDH_InventoryManager_SetStorageLimit = new NativeFunction(base.add(0xDE3DA0), 'void', ['pointer', 'int32'], 'win64');
var StorageLimit = new Map([
    ['Captain', 10],
    ['Chaplain', 10],
    ['Cook', 10],
    ['Doctor', 10],
    ['Engineer', 10],
    ['Hunter', 10],
    ['Marine', 10],
    ['Navigator', 10]
]);
/*
每个职业的背包数量在上面，设定为每个都是10
你问我英文什么意思？查查百度吧。
改后面那个数就行了
*/
function getArraySize(TArray) {
    return TArray.add(8).readU32();
}
function getArrayItemAddr(TArray, size, index) {
    var ArrNum = getArraySize(TArray);
    if (index > ArrNum)
        return null;
    return TArray.readPointer().add(index * size);
}
function bin2String(array) {
    return String.fromCharCode.apply(String, array);
}
function getString(FString) {
    var Size = getArraySize(FString);
    var String = getArrayItemAddr(FString, 0, 0).readUtf16String(Size);
    return String;
}
Interceptor.attach(ADH_HumanCharacter_AddStartingInventory_addr, {
    onEnter: function (args) {
        var HumanCharacter = args[0];
        var PlayerState = HumanCharacter.add(0x240).readPointer();
        var InventoryComponent = HumanCharacter.add(0x808).readPointer();
        var SelectedRole = PlayerState.add(0x590).readPointer();


        var OnlineName = SelectedRole.add(0x48);
        var Name = getString(OnlineName);
        if (StorageLimit.has(Name)) {
            UDH_InventoryManager_SetStorageLimit(InventoryComponent, StorageLimit.get(Name));
        }
        //UDH_InventoryManager_AddBlankSlot(InventoryComponent);
    }

});