var base = Module.findBaseAddress('DreadHungerServer-Win64-Shipping.exe');

// 日志函数
function logInfo(Info) {
    var f = new File('output.log', 'a');
    f.write('[AutoCraft] ' + Info + '\n');
    f.close();
}

// ---- 配置：需要自动执行的配方名列表 ----
var autoCraftList = [
    'CR_HarvestAnimalMeat',    // 动物肉
    'CR_HarvestHumanMeat',     // 人肉
    'CR_SearchWoodCabinet',    // 船上书柜
    'CR_SearchWoodTrunk',      // 物资箱
    'CR_SearchSkeleton',       // 骷髅
    'CR_SearchMetalTrunk',     // 弹药箱
    'CR_SearchFrozenCorpse',   // 尸体
    'CR_Searching',            // 普通搜索
    'CR_UnlockCaptainsTrunk',  // 船长室宝箱
    'CR_MineCoal',             // 煤车
    'CR_SearchLifeBoat',       // 小艇
    'CR_HullPatch'             // 漏洞
];

// ---- 偏移常量 ----
var UDH_InteractComponent_InstigatingCharacter_offset = 0x198;
var APawn_PlayerState_offset                          = 0x240;
var UPrimitiveComponent_OwnerPrivate_offset           = 0xA0;
var UDH_CraftingComponent_CraftableRecipes_offset     = 0x1b0;
var UObject_NamePrivate_offset                        = 0x18;

// ---- NativeFunction 声明 ----

// AActor::GetComponentByClass(TSubclassOf<UActorComponent> ComponentClass) -> UActorComponent*
var GetComponentByClass = new NativeFunction(
    base.add(0x22d93e0),
    'pointer',
    ['pointer', 'pointer'],
    'win64'
);

// UDH_CraftingComponent::GetPrivateStaticClass() -> UClass*
var GetCraftingComponentClass = new NativeFunction(
    base.add(0xea9100),
    'pointer',
    [],
    'win64'
);

// UDH_CraftingComponent::Craft(UDH_CraftingRecipe* Recipe, ADH_PlayerState* PlayerState) -> UDH_CraftingProject*
var CraftingComponent_Craft = new NativeFunction(
    base.add(0xd8bae0),
    'pointer',
    ['pointer', 'pointer', 'pointer'],
    'win64'
);

// FName::ToString(FString& OutString) — sret 约定，第一个参数为 FName* (this), 第二个为 FString* (out)
var FName_ToString = new NativeFunction(
    base.add(0x1166e70),
    'void',
    ['pointer', 'pointer'],
    'win64'
);

// ---- 工具函数 ----

// 读取 UObject 的 FName 并转为 JS 字符串
function getObjectName(uObject) {
    if (!uObject || uObject.isNull()) return '';
    try {
        var namePrivate = uObject.add(UObject_NamePrivate_offset); // FName*
        var fstrBuf = Memory.alloc(16);
        fstrBuf.writePointer(ptr(0));
        fstrBuf.add(8).writeInt(0);
        fstrBuf.add(12).writeInt(0);
        FName_ToString(namePrivate, fstrBuf);
        var dataPtr = fstrBuf.readPointer();
        var arrayNum = fstrBuf.add(8).readInt();
        if (dataPtr.isNull() || arrayNum <= 0) return '';
        return dataPtr.readUtf16String(arrayNum - 1);
    } catch(e) {
        return '';
    }
}

// ---- Hook 点 ----
var OnInteractComplete_addr = base.add(0xe435a0);

Interceptor.attach(OnInteractComplete_addr, {
    onEnter: function(args) {
        // args[0] = UDH_InteractComponent* Context
        // args[1] = UPrimitiveComponent*   PendingInteractTarget
        // args[2] = int                    PendingInteractSlotIndex
        var context        = args[0];
        var interactTarget = args[1];

        if (!context || context.isNull()) return;
        if (!interactTarget || interactTarget.isNull()) return;

        try {
            // 1. 获取交互发起者的 PlayerState
            var human = context.add(UDH_InteractComponent_InstigatingCharacter_offset).readPointer();
            if (!human || human.isNull()) return;

            var playerState = human.add(APawn_PlayerState_offset).readPointer();
            if (!playerState || playerState.isNull()) return;

            // 2. 获取被交互 Actor
            var interactActor = interactTarget.add(UPrimitiveComponent_OwnerPrivate_offset).readPointer();
            if (!interactActor || interactActor.isNull()) return;

            // 3. 获取该 Actor 上的 UDH_CraftingComponent
            var craftingClass = GetCraftingComponentClass();
            if (!craftingClass || craftingClass.isNull()) return;

            var craftingComp = GetComponentByClass(interactActor, craftingClass);
            if (!craftingComp || craftingComp.isNull()) return;

            // 4. 读取 CraftableRecipes TArray
            // TArray 布局：Data(ptr +0x0), ArrayNum(int +0x8), ArrayMax(int +0xC)
            var recipesBase = craftingComp.add(UDH_CraftingComponent_CraftableRecipes_offset);
            var dataPtr  = recipesBase.readPointer();
            var arrayNum = recipesBase.add(8).readInt();

            if (!dataPtr || dataPtr.isNull() || arrayNum <= 0) return;

            // 5. 遍历配方，匹配 autoCraftList 并执行制作
            for (var i = 0; i < arrayNum; i++) {
                var recipePtr = dataPtr.add(i * 8).readPointer();
                if (!recipePtr || recipePtr.isNull()) continue;

                var recipeName = getObjectName(recipePtr);
                if (autoCraftList.includes(recipeName)) {
                    logInfo('自动制作: ' + recipeName);
                    CraftingComponent_Craft(craftingComp, recipePtr, playerState);
                }
            }

        } catch(e) {
            logInfo('自动搜索物资异常: ' + e);
        }
    }
});
