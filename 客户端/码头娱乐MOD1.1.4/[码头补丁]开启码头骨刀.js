var Switch = 1;//好人摸骨刀变狼开关

if(Switch){
	var base = Module.findBaseAddress("DreadHunger-Win64-Shipping.exe");
	var UDH_InventoryManager_AddInventory_addr = base.add(0xE30700);
	var ADH_BoneDagger_Constructor_addr = base.add(0xECFC60);
	var ADH_HumanCharacter_Died_addr = base.add(0xDCB0A0);
	var ADH_HumanCharacter_TakeDamage_addr = base.add(0xDEDD40);

	var UClass_GetPrivateStaticClass = new NativeFunction(base.add(0x1269CE0), 'pointer', [], 'win64');//
	var StaticFindObject = new NativeFunction(base.add(0x13F44D0), 'pointer', ['pointer', 'pointer', 'pointer', 'int8'], 'win64');
	var ADH_Character_IsAlive = new NativeFunction(base.add(0xDD6B30), 'int8', ['pointer'], 'win64');
	var ADH_HumanCharacter_SetIsSpiritWalking = new NativeFunction(base.add(0xDEA100), 'void', ['pointer', 'int8', 'float'], 'win64');
	var UDH_InventoryManager_AddInventory = new NativeFunction(UDH_InventoryManager_AddInventory_addr, 'pointer', ['pointer', 'pointer', 'pointer', 'pointer', 'pointer', 'int8', 'pointer'], 'win64');
	var ADH_Inventory_DecreaseItemStack = new NativeFunction(base.add(0xE3A310), 'void', ['pointer', 'int32', 'int8', 'int8'], 'win64');
	//var UClass_CreateDefaultObject = new NativeFunction(base.add(0x11EC670), 'pointer', ['pointer'], 'win64');


	var ADH_PlayerState_SetIsThrall = new NativeFunction(base.add(0xEC6300), 'void', ['pointer', 'int8'], 'win64');
	//var UDH_InventoryManager_AddInventory = new NativeFunction(base.add(0xE30DE0), 'void', ['pointer', 'pointer', 'pointer', 'pointer', 'pointer', 'int8', 'pointer'], 'win64');

	function logInfo(Info) {
		var f = new File('output.log', 'a');
		f.write('[Patches] ' + Info + '\n');
		f.close();
	}

	var CCT_BONEDAGGER = 24;

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

	function unlockItem(ItemObject) {
		var bCanBeTransferred = ItemObject.add(0x811);
		bCanBeTransferred.writeU8(1);
		var bCanBeDropped = ItemObject.add(0x690);
		bCanBeDropped.writeU8(0);
	}
	function resetSpells(SpellManager) {
		var SpellChargeLevel = SpellManager.add(0x284);
		if(SpellChargeLevel.readFloat() + 0.55<= 1.0) { //修改此处和下一句中的数字为骨刀拾取后的充能值
			SpellChargeLevel.writeFloat(SpellChargeLevel.readFloat() + 0.55);
		}
		else {
			SpellChargeLevel.writeFloat(1.0);
		}
		
		var SpellCooldowns = SpellManager.add(0x2A8);
		for(var i = 0; i < getArraySize(SpellCooldowns); i++) {
			var SpellCooldown = getArrayItemAddr(SpellCooldowns, 16, i);
			//var SpellClass = SpellCooldown.readPointer();
			var ServerUsedTime = SpellCooldown.add(8);
			//var ClassDefaultObject = SpellClass.add(0x118).readPointer();
			//var CoolDownTime = ClassDefaultObject.add(0xD4).readFloat();

			if(ServerUsedTime.readFloat() - 30 > 0) {  //修改此处和下一句中的数字为骨刀拾取后技能的冷却时间
				ServerUsedTime.writeFloat(ServerUsedTime.readFloat() - 30/*CoolDownTime*/);
			}
			else {
				ServerUsedTime.writeFloat(0);
			}
		}
	}
	var BoneDaggerName = '/Game/Blueprints/Inventory/Totem/BP_BoneDagger_Inventory.BP_BoneDagger_Inventory_C';
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

	function InitItemState(State, Upgraded, Tainted) {
		State.writeU32(0xffffffff);
		State.add(0x4).writeU8(1);
		State.add(0x8).writeFloat(1.0);
		State.add(0xC).writeU8(0);
		State.add(0xD).writeU8(Upgraded);
		State.add(0xE).writeU8(Tainted);
		State.add(0x10).writePointer(ptr(0));
		State.add(0x18).writePointer(ptr(0));
		State.add(0x20).writePointer(ptr(0));
		State.add(0x28).writePointer(ptr(0));
		State.add(0x30).writePointer(ptr(0));
	}

	function giveInventory(PlayerState, ClassName) {
		var HumanCharacter = PlayerState.add(0x280).readPointer();
		if(HumanCharacter.isNull()) {
			return;
		}
		var ItemClass = findClassByName(ClassName);
		var InventoryComponent = HumanCharacter.add(0x808).readPointer();
		var Array = Memory.alloc(16 + 56);
		Array.writePointer(Array.add(16));
		Array.add(8).writeU32(1);
		Array.add(12).writeU32(1);
		InitItemState(Array.readPointer(), 0, 0);
		var Buffer = Memory.alloc(8);
		Buffer.writeU32(0);
		Buffer.add(4).writeU32(0xffffffff);
		UDH_InventoryManager_AddInventory(InventoryComponent, ItemClass, Array, Buffer, Buffer.add(4), 0, ptr(0));
	}

	Interceptor.attach(UDH_InventoryManager_AddInventory_addr, {
		onEnter : function (args) {
			var Clazz = findClassByName(BoneDaggerName);
			
			if(Clazz.isNull()) {
				return;
			}
			var TargetItem = args[1];
			if(!TargetItem.equals(Clazz)) {
				return;
			}
			var InventoryManager = args[0];
			var Unlock = 1;
			var HumanOwner = InventoryManager.add(0xD8).readPointer();
			
			if(!HumanOwner.isNull()) {
				var IsAlive = ADH_Character_IsAlive(HumanOwner);
				if(IsAlive) {
					var PlayerState = HumanOwner.add(0x240).readPointer();
					if(!PlayerState.isNull()){
						var IsThrall = PlayerState.add(0x572).readU8();
						if(!IsThrall)ADH_PlayerState_SetIsThrall(PlayerState,1);
						if(1) {
							//ADH_PlayerState_SetIsThrall(PlayerState,1);
							//giveInventory(PlayerState, '/Game/Blueprints/Inventory/Totem/BP_BoneDagger_Inventory.BP_BoneDagger_Inventory_C');
							Unlock = 0;
							var BoneDagger = findInventory(InventoryManager, Clazz);
							if(!BoneDagger.isNull()) {
								var SpellManager = PlayerState.add(0x488).readPointer();
								if(!SpellManager.isNull()) {
									resetSpells(SpellManager);
								}
							}
						}
					}
					
				}
			}
			var DefaultObject = Clazz.add(0x118).readPointer();
			
			if(DefaultObject.isNull()) {
				return;
			}
			var bRequiresInventorySlot = DefaultObject.add(0x810);
			bRequiresInventorySlot.writeU8(Unlock);
			unlockItem(DefaultObject);
			
		}
		
	});

	Interceptor.attach(ADH_BoneDagger_Constructor_addr, {
		onEnter : function(args) {
			this.ItemObject = args[0];
		},
		onLeave : function(ret) {
			var ItemObject = this.ItemObject;
			var bRequiresInventorySlot = ItemObject.add(0x810);
			bRequiresInventorySlot.writeU8(1);
			unlockItem(ItemObject);
		}
	});

	
	//允许码头V1
	var openV1 = base.add(0xECAE58);
	Memory.protect(openV1, 6, 'rwx'); // 确保内存可写
	Memory.patchCode(openV1, 6, function (code) {
    var writer = new X86Writer(code, { pc: openV1 });
		writer.putNop(); // 用NOP指令替换原来的指令
		writer.putNop();
		writer.putNop();
		writer.putNop();
		writer.putNop();
		writer.putNop();
		writer.flush();
	});
	Memory.protect(openV1, 6, 'rx'); // 恢复内存保护
	
	//允许码头V2
	var openV2 = base.add(0xECE121);
	Memory.protect(openV2, 6, 'rwx'); // 确保内存可写
	Memory.patchCode(openV2, 6, function (code) {
    var writer = new X86Writer(code, { pc: openV2 });
		writer.putNop(); // 用NOP指令替换原来的指令
		writer.putNop();
		writer.putNop();
		writer.putNop();
		writer.putNop();
		writer.putNop();
		writer.flush();
	});
	Memory.protect(openV2, 6, 'rx'); // 恢复内存保护
	
	
}
