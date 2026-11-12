// [服务端]自动搜索物资.js（触发式热重载版 v2）
// 玩家按 E 完成交互后，自动把该对象 CraftingComponent 里配置列表内的配方全部搜完。
//
// 之前只搜一次的原因：可多次搜索的容器在首次搜索后不会重新调用 AddCraftableRecipes，
// 配方一直在 CraftableRecipes 里，只是 CraftedRecipes 次数增加，所以"配方添加事件"驱动不到下一轮。
// 本版改为监听"搜索项目完成"的边沿：
//   hook UDH_CraftingComponent::TickComponent(0xDAD880)，
//   对任务队列中的容器检测 CurrentProjects(0x248) 从 >0 变为 0 的时刻，
//   立即重新读取 CraftableRecipes 并 Craft 下一条，直到 CanCraft/IsRecipeExhausted 失败。
//
// 触发链路：
//   1) OnInteractComplete → 建立任务 + 立即尝试一次
//   2) AddCraftableRecipes → 容器刷新出新配方时补一次
//   3) TickComponent 中 CurrentProjects 从有到无的边沿 → 上一次搜索完成，开始下一次
//
// 偏移（服务端 IDA 确认）：
//   UDH_InteractComponent::OnInteractComplete 0xE435A0
//   UDH_CraftingComponent::AddCraftableRecipes 0xD82EC0
//   UDH_CraftingComponent::TickComponent 0xDAD880
//   UDH_CraftingComponent::Craft 0xD8BAE0
//   AActor::GetComponentByClass 0x22D93E0
//   UDH_CraftingComponent::GetPrivateStaticClass 0xEA9100
//   FName::ToString 0x1166E70
// 字段（两端一致）：
//   InstigatingCharacter 0x198 / PlayerState 0x240 / OwnerPrivate 0xA0
//   CraftableRecipes 0x1B0 / CurrentProjects 0x248 / NamePrivate 0x18

var ENABLE = 1;
var MAX_ROUNDS = 30;   // 单容器最大搜索轮数（防异常循环）

var autoCraftList = [
    'CR_HarvestAnimalMeat',    // 动物肉
    'CR_HarvestHumanMeat',     // 人肉
    'CR_SearchWoodCabinet',    // 船上书柜
    'CR_SearchWoodTrunk',      // 物资箱
    'CR_SearchSkeleton',       // 骷髅
    'CR_SearchMetalTrunk',     // 弹药箱
    'CR_SearchFrozenCorpse',   // 冰冻尸体
    'CR_Searching',            // 普通搜索
    'CR_UnlockCaptainsTrunk',  // 船长室宝箱
    'CR_MineCoal',             // 煤车
    'CR_SearchLifeBoat',       // 小艇
    'CR_HullPatch'             // 漏洞
];

var base = Module.findBaseAddress('DreadHungerServer-Win64-Shipping.exe');
if (base === null) {
    console.log('[AutoSearch] 未找到 DreadHungerServer-Win64-Shipping.exe，脚本退出');
} else {
    var OFF = {
        OnInteractComplete: 0xE435A0,
        AddCraftableRecipes: 0xD82EC0,
        CraftingTick: 0xDAD880,
        Craft: 0xD8BAE0,
        GetComponentByClass: 0x22D93E0,
        CraftingComponentClass: 0xEA9100,
        FNameToString: 0x1166E70,
        InstigatingCharacter: 0x198,
        PlayerState: 0x240,
        OwnerPrivate: 0xA0,
        CraftableRecipes: 0x1B0,
        CurrentProjects: 0x248,
        NamePrivate: 0x18
    };

    var GetComponentByClass = new NativeFunction(base.add(OFF.GetComponentByClass), 'pointer', ['pointer', 'pointer'], 'win64');
    var GetCraftingComponentClass = new NativeFunction(base.add(OFF.CraftingComponentClass), 'pointer', [], 'win64');
    var CraftingComponent_Craft = new NativeFunction(base.add(OFF.Craft), 'pointer', ['pointer', 'pointer', 'pointer'], 'win64');
    var FName_ToString = new NativeFunction(base.add(OFF.FNameToString), 'void', ['pointer', 'pointer'], 'win64');

    var jobs = [];
    var regInteract = null;
    var regAddRecipe = null;
    var regCraftTick = null;

    function logInfo(msg) {
        try {
            var f = new File('output.log', 'a');
            f.write('[Patches] [AutoSearch] ' + msg + '\n');
            f.close();
        } catch (e) {
        }
    }

    function getObjectName(uObject) {
        if (!uObject || uObject.isNull()) {
            return '';
        }
        try {
            var namePrivate = uObject.add(OFF.NamePrivate);
            var fstrBuf = Memory.alloc(16);
            fstrBuf.writePointer(ptr(0));
            fstrBuf.add(8).writeInt(0);
            fstrBuf.add(12).writeInt(0);
            FName_ToString(namePrivate, fstrBuf);
            var dataPtr = fstrBuf.readPointer();
            var arrayNum = fstrBuf.add(8).readInt();
            if (dataPtr.isNull() || arrayNum <= 0) {
                return '';
            }
            return dataPtr.readUtf16String(arrayNum - 1);
        } catch (e) {
            return '';
        }
    }

    function findJob(craftingComp) {
        for (var i = 0; i < jobs.length; i++) {
            if (jobs[i].comp.equals(craftingComp)) {
                return jobs[i];
            }
        }
        return null;
    }

    function projectNum(craftingComp) {
        return craftingComp.add(OFF.CurrentProjects).add(8).readU32();
    }

    // 从当前 CraftableRecipes 里找一条配置内配方并 Craft
    function trySearch(job) {
        if (job.rounds >= MAX_ROUNDS) {
            return false;
        }
        if (projectNum(job.comp) > 0) {
            return false;
        }
        var recipesBase = job.comp.add(OFF.CraftableRecipes);
        var dataPtr = recipesBase.readPointer();
        var arrayNum = recipesBase.add(8).readInt();
        if (dataPtr.isNull() || arrayNum <= 0) {
            return false;
        }
        for (var k = 0; k < arrayNum; k++) {
            var recipePtr = dataPtr.add(k * 8).readPointer();
            if (recipePtr.isNull()) {
                continue;
            }
            if (!autoCraftList.includes(getObjectName(recipePtr))) {
                continue;
            }
            var project = CraftingComponent_Craft(job.comp, recipePtr, job.playerState);
            if (project !== null && !project.isNull()) {
                job.rounds += 1;
                job.lastProjectNum = projectNum(job.comp);
                return true;
            }
        }
        return false;
    }

    function onInteractComplete(args) {
        var context = args[0];
        var interactTarget = args[1];
        if (context === null || context.isNull() || interactTarget === null || interactTarget.isNull()) {
            return;
        }
        try {
            var human = context.add(OFF.InstigatingCharacter).readPointer();
            if (human.isNull()) {
                return;
            }
            var playerState = human.add(OFF.PlayerState).readPointer();
            if (playerState.isNull()) {
                return;
            }
            var interactActor = interactTarget.add(OFF.OwnerPrivate).readPointer();
            if (interactActor.isNull()) {
                return;
            }
            var craftingClass = GetCraftingComponentClass();
            if (craftingClass === null || craftingClass.isNull()) {
                return;
            }
            var craftingComp = GetComponentByClass(interactActor, craftingClass);
            if (craftingComp === null || craftingComp.isNull()) {
                return;
            }

            var job = findJob(craftingComp);
            if (job === null) {
                job = { comp: craftingComp, actor: interactActor, playerState: playerState, rounds: 0, lastProjectNum: 0 };
                jobs.push(job);
            } else {
                job.playerState = playerState;
                job.rounds = 0;
            }
            job.lastProjectNum = projectNum(craftingComp);
            trySearch(job);
        } catch (e) {
            logInfo('OnInteractComplete 异常: ' + e);
        }
    }

    // 容器把新的可制作配方加入 CraftableRecipes 时补一次
    function onRecipeAdded(craftingComp, recipe) {
        if (craftingComp === null || craftingComp.isNull() || recipe === null || recipe.isNull()) {
            return;
        }
        try {
            var job = findJob(craftingComp);
            if (job === null || job.rounds >= MAX_ROUNDS) {
                return;
            }
            if (!autoCraftList.includes(getObjectName(recipe))) {
                return;
            }
            if (projectNum(craftingComp) > 0) {
                return;
            }
            var project = CraftingComponent_Craft(craftingComp, recipe, job.playerState);
            if (project !== null && !project.isNull()) {
                job.rounds += 1;
                job.lastProjectNum = projectNum(craftingComp);
            }
        } catch (e) {
            logInfo('onRecipeAdded 异常: ' + e);
        }
    }

    // 搜索项目完成（CurrentProjects 从有到无）→ 开始下一轮
    function onCraftingTick(craftingComp) {
        if (craftingComp === null || craftingComp.isNull()) {
            return;
        }
        var job = findJob(craftingComp);
        if (job === null) {
            return;
        }
        try {
            var num = projectNum(craftingComp);
            if (job.lastProjectNum > 0 && num === 0) {
                trySearch(job);
            }
            job.lastProjectNum = projectNum(craftingComp);
        } catch (e) {
            logInfo('onCraftingTick 异常: ' + e);
        }
    }

    function install() {
        if (!ENABLE) {
            return;
        }
        if (regInteract !== null || regAddRecipe !== null || regCraftTick !== null) {
            return;
        }
        jobs = [];
        try {
            regInteract = Interceptor.attach(base.add(OFF.OnInteractComplete), {
                onEnter: function (args) {
                    onInteractComplete(args);
                }
            });
        } catch (e) {
            logInfo('attach OnInteractComplete 失败: ' + e);
            regInteract = null;
        }
        try {
            regAddRecipe = Interceptor.attach(base.add(OFF.AddCraftableRecipes), {
                onEnter: function (args) {
                    this.comp = args[0];
                    this.recipe = args[1];
                },
                onLeave: function () {
                    onRecipeAdded(this.comp, this.recipe);
                }
            });
        } catch (e) {
            logInfo('attach AddCraftableRecipes 失败: ' + e);
            regAddRecipe = null;
        }
        try {
            regCraftTick = Interceptor.attach(base.add(OFF.CraftingTick), {
                onEnter: function (args) {
                    onCraftingTick(args[0]);
                }
            });
        } catch (e) {
            logInfo('attach CraftingTick 失败: ' + e);
            regCraftTick = null;
        }
        logInfo('已加载（触发式 v2）');
    }

    function uninstall() {
        if (regInteract !== null) {
            try { regInteract.detach(); } catch (e) { logInfo('detach interact 失败: ' + e); }
            regInteract = null;
        }
        if (regAddRecipe !== null) {
            try { regAddRecipe.detach(); } catch (e) { logInfo('detach addRecipe 失败: ' + e); }
            regAddRecipe = null;
        }
        if (regCraftTick !== null) {
            try { regCraftTick.detach(); } catch (e) { logInfo('detach craftTick 失败: ' + e); }
            regCraftTick = null;
        }
        jobs = [];
    }

    rpc.exports = {
        init: function (stage, params) { install(); },
        dispose: function () { uninstall(); }
    };

    install();
}
