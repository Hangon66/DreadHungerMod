// [服务端]自动搜索物资_普通版.js（单次加载，无热重载生命周期）
// 顶层直接 Hook；与热重载版 [服务端]自动搜索物资.js 二选一，不要同时放在 Patches 目录。
//
// 功能：玩家按 E 完成交互后，自动把容器 CraftingComponent 里配置列表内的配方全部搜完。
// 驱动方式（触发式）：
//   1) OnInteractComplete 建立任务 + 立即搜索一次
//   2) AddCraftableRecipes 容器刷新出新配方时补一次
//   3) TickComponent 中 CurrentProjects 从 >0 变为 0 的边沿 → 上一次搜索完成，继续下一轮
//   直到 CanCraft / IsRecipeExhausted 失败（CraftedRecipes 达到 CraftingLimits 上限）。
//
// 偏移（服务端 IDA 确认）：
//   OnInteractComplete 0xE435A0 / AddCraftableRecipes 0xD82EC0 / TickComponent 0xDAD880
//   Craft 0xD8BAE0 / GetComponentByClass 0x22D93E0 / CraftingComponentClass 0xEA9100
//   FName::ToString 0x1166E70
// 字段（两端一致）：
//   InstigatingCharacter 0x198 / PlayerState 0x240 / OwnerPrivate 0xA0
//   CraftableRecipes 0x1B0 / CurrentProjects 0x248 / NamePrivate 0x18

var base = Module.findBaseAddress('DreadHungerServer-Win64-Shipping.exe');
if (base === null) {
    console.log('[AutoSearch] 未找到 DreadHungerServer-Win64-Shipping.exe，脚本退出');
} else {
    var MAX_ROUNDS = 30;

    var autoCraftList = [
        'CR_HarvestAnimalMeat',
        'CR_HarvestHumanMeat',
        'CR_SearchWoodCabinet',
        'CR_SearchWoodTrunk',
        'CR_SearchSkeleton',
        'CR_SearchMetalTrunk',
        'CR_SearchFrozenCorpse',
        'CR_Searching',
        'CR_UnlockCaptainsTrunk',
        'CR_MineCoal',
        'CR_SearchLifeBoat',
        'CR_HullPatch'
    ];

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

    Interceptor.attach(base.add(OFF.OnInteractComplete), {
        onEnter: function (args) {
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
                    job = { comp: craftingComp, playerState: playerState, rounds: 0, lastProjectNum: 0 };
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
    });

    Interceptor.attach(base.add(OFF.AddCraftableRecipes), {
        onEnter: function (args) {
            this.comp = args[0];
            this.recipe = args[1];
        },
        onLeave: function () {
            var craftingComp = this.comp;
            var recipe = this.recipe;
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
    });

    Interceptor.attach(base.add(OFF.CraftingTick), {
        onEnter: function (args) {
            var craftingComp = args[0];
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
    });

    logInfo('已加载（普通版）');
}
