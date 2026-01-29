var Switch = 1;// 总开关
var SpiritSwitch = 1;	//码头灵体开关，0:关闭，1:开启
var VomitSwitch	= 1;	//狂吐开关，0:关闭，1:开启

function logInfo(Info) {
	var f = new File('output.log', 'a');
	f.write('[Patches] ' + Info + '\n');
	f.close();
}

if(Switch){
	var base = Module.findBaseAddress("DreadHunger-Win64-Shipping.exe");
	var ADH_HumanCharacter_AddStartingInventory = base.add(0xDC1630);
	var ADH_HumanCharacter_SetClimbingState = base.add(0xDE7EA0);
	// 替换灵界外观更新函数
	var ADH_HumanCharacter_SetSpiritWalkAppearance_addr = base.add(0xDEB490);
	var ADH_HumanCharacter_SetSpiritWalkAppearance = new NativeFunction(ADH_HumanCharacter_SetSpiritWalkAppearance_addr, 'void', ['pointer', 'bool']);
	//var setCollisionProfileName = new NativeFunction(base.add(0x2BA77A0), 'void', ['pointer', 'uint64', 'bool']);
	var ADH_HumanCharacter_UpdateSpiritWalking = new NativeFunction(base.add(0xDF33B0), 'void', ['pointer']);
	var UPrimitiveComponent_GetCollisionProfileName = new NativeFunction(base.add(0x2B99D60), 'pointer', ['pointer', 'pointer']);
	var UMRMeshComponent_SetCollisionProfileName = new NativeFunction(base.add(0x2BA77A0), 'void', ['pointer', 'uint64', 'bool']);
	//const fnameValue = base.add(0x4A86FA8).readU64(); //灵体FName
	//const Default_fnameValue = base.add(0x4A86F58).readU64(); //默认FName

	if(SpiritSwitch == 1){
		Interceptor.attach(ADH_HumanCharacter_AddStartingInventory, {
			onEnter : function(args) {
				this.ADH_HumanCharacter = args[0];
				//logInfo("ADH_HumanCharacter: " + this.ADH_HumanCharacter.toString(16).padStart(16, '0'));
			},
			onLeave : function(ret) {
				const role = this.ADH_HumanCharacter.add(0xF0).readU8();
				const ADH_HumanCharacter = this.ADH_HumanCharacter;
				//const ADH_HumanCharacter_DefaultCharacter = ADH_HumanCharacter.add(0x4D8).readPointer();
				//const CapsuleComponent = ADH_HumanCharacter.add(0x290).readPointer();
				//const Default_CapsuleComponent = ADH_HumanCharacter_DefaultCharacter.add(0x290).readPointer();
				if( 1 || role == 3){
					try { 
							ADH_HumanCharacter.add(0xC71).writeU8(1);
							ADH_HumanCharacter_UpdateSpiritWalking(ADH_HumanCharacter);
							ADH_HumanCharacter.add(0xC71).writeU8(0);
							ADH_HumanCharacter_SetSpiritWalkAppearance(ADH_HumanCharacter, 0);
							const Mesh = ADH_HumanCharacter.add(0x280).readPointer();
							const DefaultHuman_Mesh = ADH_HumanCharacter.add(0x9A8).readPointer().add(0x280).readPointer();
							var Fname_addr = Memory.alloc(8);
							Fname_addr  = UPrimitiveComponent_GetCollisionProfileName(DefaultHuman_Mesh, Fname_addr);
							UMRMeshComponent_SetCollisionProfileName(Mesh, Fname_addr.readU64(), 1);
							//logInfo("ADH_HumanCharacter_PawnClientRestart:success");
					} catch (error) {
						//logInfo("error: " + error);
					}
				}else if(role == 2){
					// setCollisionProfileName(CapsuleComponent, Default_fnameValue, 1);
					// setCollisionProfileName(Default_CapsuleComponent, Default_fnameValue, 1)
				}

			}
		});

	
		Interceptor.attach(ADH_HumanCharacter_SetClimbingState, {
			onEnter : function(args) {
				//logInfo("into ADH_Character_SetClimbingState")
				this.ADH_HumanCharacter = args[0];
				var temp_rdx = this.context.rdx;
				this.bIsClimbing = temp_rdx & 0xFF;
				//var bIsClimbing = this.bIsClimbing;
				//logInfo("bIsClimbing: " + bIsClimbing);
				//logInfo("ADH_Character: " + this.ADH_Character.toString(16).padStart(16, '0'));
			},
			onLeave : function(ret) {
				if(this.bIsClimbing == 0){
					const role = this.ADH_HumanCharacter.add(0xF0).readU8();
					var ADH_HumanCharacter = this.ADH_HumanCharacter;
					//logInfo("into onleave");
					if(role == 3){
						try {
							ADH_HumanCharacter.add(0xC71).writeU8(1);
							ADH_HumanCharacter_UpdateSpiritWalking(ADH_HumanCharacter);
							ADH_HumanCharacter.add(0xC71).writeU8(0);
							ADH_HumanCharacter_SetSpiritWalkAppearance(ADH_HumanCharacter, 0);
							const Mesh = ADH_HumanCharacter.add(0x280).readPointer();
							const DefaultHuman_Mesh = ADH_HumanCharacter.add(0x9A8).readPointer().add(0x280).readPointer();
							var Fname_addr = Memory.alloc(8);
							Fname_addr  = UPrimitiveComponent_GetCollisionProfileName(DefaultHuman_Mesh, Fname_addr);
							UMRMeshComponent_SetCollisionProfileName(Mesh, Fname_addr.readU64(), 1);
							//logInfo("ADH_Character_SetClimbingState:success");
						} catch (error) {
							//logInfo("error: "+ error);
						}
					}
				}
			}
		})
	}


	if(VomitSwitch == 1){
		//修改呕吐间隔
		const floatValue = 1.0; //呕吐间隔秒
		var target_addr = base.add(0xDF2E9A);
		
		var memorySize = 4;
		Memory.protect(target_addr, memorySize, 'rwx'); // 确保内存可写
		Memory.writeFloat(target_addr, floatValue);
		Memory.protect(target_addr, memorySize, 'rx'); // 恢复内存保护


		//呕吐不停
		var ChangeVomitCount = base.add(0xDF2E83);
		Interceptor.attach(ChangeVomitCount, {
			onEnter : function(args) {
				const ADH_HumanCharacter = this.context.rbx;
				const role = ADH_HumanCharacter.add(0xF0).readU8();
				const VomitCount = ADH_HumanCharacter.add(0xDAC).readU8();
				if(role == 3){
					try  {
						if(VomitCount == 11){
							ADH_HumanCharacter.add(0x1000).writeFloat(1.0);
						}else if(VomitCount == 12){
							ADH_HumanCharacter.add(0x1000).writeFloat(0.0);
						}
					} catch (error) {
						//logInfo("error: " + error);
					}
				}
			},
		})

	}


}



