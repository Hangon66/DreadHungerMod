

var base = Module.findBaseAddress('DreadHunger-Win64-Shipping.exe');
//当前为客户端地址，但客户端此方案不通
function logInfo(Info) {
    var f = new File('output.log', 'a');
    f.write('[Patches] ' + Info + '\n');
    f.close();
}

//制作检查函数UDH_CraftingComponent::CanCraft
//开始制作函数UDH_CraftingComponent::Craft

var UDH_CraftingComponent_CanCraft =  base.add(0xDFED40);
var UDH_CraftingComponent_Craft = new NativeFunction(base.add(0xE02A90), 'int8', ['pointer', 'pointer', 'pointer'], 'win64');
var FName_GetPlainNameString = new NativeFunction(base.add(0x11d7830), 'void', ['pointer', 'pointer']);

var autoCraftList = [
    'CR_HarvestAnimalMeat',//动物肉
    'CR_HarvestHumanMeat',//人肉
    'CR_SearchWoodCabinet',//船上书柜
    'CR_SearchWoodTrunk',//物资箱
    'CR_SearchSkeleton',//骨头
    'CR_SearchMetalTrunk',//弹药箱
    'CR_SearchFrozenCorpse',//尸体
    'CR_Searching',//普通搜索
    'CR_UnlockCaptainsTrunk',//船长室宝箱
    'CR_MineCoal',//煤车
];

function newFString(Length) {
    var FString = Memory.alloc(16 + Length * 2);
    FString.writePointer(FString.add(16));
    FString.add(8).writeU32(0);
    FString.add(12).writeU32(Length);
    return FString;
};

function getObjectName(UObject) {
    var NamePrivate = UObject.add(0x18);
    var NameBuffer = newFString(100);
    FName_GetPlainNameString(NamePrivate, NameBuffer);
    return NameBuffer.readPointer().readUtf16String();
};

logInfo('UDH_CraftingComponent::CanCraft');
Interceptor.attach(UDH_CraftingComponent_CanCraft, {
    onEnter: function(args) {
        this.Context = args[0];
        this.Recipe = args[1];
        this.CraftingPlayer = args[2];
    },onLeave : function(retval) {
        try {
            var CanCraft = retval;
            if(CanCraft == 1) {
            var Context = this.Context;
            var Recipe = this.Recipe;
            var CraftingPlayer = this.CraftingPlayer;
            var CraftingPlayerName = getObjectName(Recipe);
            logInfo('UDH_CraftingComponent::CanCraft ' + CraftingPlayerName + ' ' + CanCraft);
            if(autoCraftList.includes(CraftingPlayerName)){
                UDH_CraftingComponent_Craft(Context, Recipe, CraftingPlayer)
            }
        }
        } catch (error) {
            logInfo(error);
        }
        
        
    }
});

