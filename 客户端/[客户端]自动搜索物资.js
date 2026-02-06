var Switch = 1;//开关，1开启，0关闭

if(Switch == 1){
	var base = Module.findBaseAddress('DreadHunger-Win64-Shipping.exe');

	// function logInfo(Info) {
	// 	var f = new File('output.log', 'a');
	// 	f.write('[Patches] ' + Info + '\n');
	// 	f.close();
	// }

	var UDH_CraftingRecipeWidget_OnCraftableChanged =  base.add(0xfa9450);
	var UDH_CraftingRecipeWidget_Craft = new NativeFunction(base.add(0xf8f390), 'void', ['pointer'], 'win64');
	var FName_GetPlainNameString = new NativeFunction(base.add(0x11d7830), 'void', ['pointer', 'pointer']);
	var FWeakObjectPtr_Get = new NativeFunction(base.add(0x13e6cf0), 'pointer', ['pointer']);

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
		'CR_SearchLifeBoat',//小艇
		'CR_HullPatch'//漏洞
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

	Interceptor.attach(UDH_CraftingRecipeWidget_OnCraftableChanged, {
		onEnter: function(args) {
			this.Context = args[0];
			this.bInCraftable = args[1];
		},onLeave : function() {
			try {
				var Context = this.Context;
				var bInCraftable = this.bInCraftable;
				
				if(bInCraftable == 1) {
					var RecipePtr = FWeakObjectPtr_Get(Context.add(0x310));
					var CraftingPlayerName = getObjectName(RecipePtr);
					//logInfo('UDH_CraftingRecipeWidget_OnCraftableChanged ' + CraftingPlayerName + ' ' + bInCraftable);
					if(autoCraftList.includes(CraftingPlayerName)){
						UDH_CraftingRecipeWidget_Craft(Context)
					}
				}
			} catch (error) {
				//logInfo(error);
			}
		}
	});
}

