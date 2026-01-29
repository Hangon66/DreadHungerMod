//功能开关
var MSwitch = 1;//总开关，1为开，0为关

var MapMod = 1;//地图修改开关，1为开，0为关
var OnlyJump = 0;//踏空跳开关，1为开，0为关




/////////////初始化
var base = Module.findBaseAddress("DreadHunger-Win64-Shipping.exe");


/////////////////////////////////////////////////////////////////////////////地图预设
//说明：每执行5次选角色函数执行一次地图生成
if(MSwitch && MapMod){
	//var FTransform_Identity = base.add(0x4559220);	
	var FActorSpawnParameters_FActorSpawnParameters = new NativeFunction(base.add(0x2D51F50), 'void', ['pointer'], 'win64');	
	var UWorld_SpawnActor = new NativeFunction(base.add(0x29D7340), 'pointer', ['pointer', 'pointer', 'pointer', 'pointer'], 'win64');	
	var UObject_GetWorld = new NativeFunction(base.add(0x1380FD0), 'pointer', ['pointer'], 'win64');

	var UClass_GetPrivateStaticClass = new NativeFunction(base.add(0x1269CE0), 'pointer', [], 'win64');

	var StaticLoadObject = new NativeFunction(base.add(0x13F4CC0), 'pointer', ['pointer', 'pointer', 'pointer', 'pointer', 'int32', 'pointer', 'int8', 'pointer'], 'win64');
	var StaticFindObject = new NativeFunction(base.add(0x13F44D0), 'pointer', ['pointer', 'pointer', 'pointer', 'int8'], 'win64');
	var ADH_LobbyGameMode_InitGame_addr = base.add(0xE7B140);

	var GWorld1;

	function logInfo(Info) {
		var f = new File('output.log', 'a');
		f.write('[Patches] ' + Info + '\n');
		f.close();
	}

	function findClassByName(ClassName) {
		return findObjectByName(ClassName, UClass_GetPrivateStaticClass());
	}
	function findObjectByName(ObjectName, Clazz) {
		var Buffer = Memory.alloc((ObjectName.length + 1) * 2);
		Buffer.writeUtf16String(ObjectName);
		return StaticFindObject(Clazz, ptr(0xFFFFFFFFFFFFFFFF), Buffer, 0);
	}
	function loadClassByName(ClassName) {
		return loadObjectByName(ClassName, UClass_GetPrivateStaticClass());
	}
	function loadObjectByName(ObjectName, Clazz) {
		var Buffer = Memory.alloc((ObjectName.length + 1) * 2);
		Buffer.writeUtf16String(ObjectName);
		return StaticLoadObject(Clazz, ptr(0), Buffer, ptr(0), 0, ptr(0), 1, ptr(0));
	}

	function spawnActor(World, Clazz, Position, Owner) {
		var Parameters = Memory.alloc(0x30);
		FActorSpawnParameters_FActorSpawnParameters(Parameters);
		Parameters.add(0x10).writePointer(Owner);
		return UWorld_SpawnActor(World, Clazz, Position, Parameters);
	}
	function getClass(ClassName) {
		var Clazz = findClassByName(ClassName);
		if(!Clazz.isNull()) {
			return Clazz; 
		}
		return loadClassByName(ClassName);
	}
	function makeTransform(Pos, Rot, Scale) {
		var TransformBuffer = Memory.alloc(16*3);
		TransformBuffer.add(0).writeFloat(Pos[0]);
		TransformBuffer.add(4).writeFloat(Pos[1]);
		TransformBuffer.add(8).writeFloat(Pos[2]);

		TransformBuffer.add(16).writeFloat(Rot[0]);
		TransformBuffer.add(20).writeFloat(Rot[1]);
		TransformBuffer.add(24).writeFloat(Rot[2]);

		TransformBuffer.add(32).writeFloat(Scale[0]);
		TransformBuffer.add(36).writeFloat(Scale[1]);
		TransformBuffer.add(40).writeFloat(Scale[2]);
		return TransformBuffer;
	}


	function getGameState()
	{
		var AuthorityGameMode = GWorld1.add(0x118).readPointer();
		var GameState = AuthorityGameMode.add(0x280).readPointer();
		return GameState;
	}
	/*
	码头坐标：
	[-4654,4878,270],//码头工作台：
	[-5141,4456,435],//技能更换点：
	[-6219,5312,268],//黑帽男：
	[-6498,4491,116],//小男孩：
	[-7726,5173,261],//老水手：
	[-8121,4954,261],//卷毛：
	[-7549,6036,261],//保险箱_靠近船：
	[-4401,3228,113],//保险箱_土里的：
	[-4313,2024,289],//小船1：
	[-3755,1533,95],//小船2：
	[-4420,4226,576],//房顶1：
	[-3808,4840,270],//阴暗：
	[-8408,7117,138],//岸边_靠近船保险箱：
	[-6515,3324,127],//岸边_水中：
	[-4869, 2948, 200],//岸边_靠近土里保险箱：
	[-4898, 2199, 40],//冰雕位置

	船上：
	[-8383,4452,345],//船舵：
	[-9069,6721,601],//船头：
	[-8756,3026,464],//船上角色载入点：
	[-9265,2955,464],//更换角色：
	[-8883,3517,165],//锅炉房：
	[-9394,5604,169],//厨房：
	[-9315,6628,171],//棋牌室：
	[-9067,3919,2213],//桅杆：
	[-8484,4466,473],//上船木板
	[-8434,5739,-3000],//上船木板2
	*/
	var ActorToSpawn = [
	[
		"/Game/Blueprints/AI/Prey/BP_Prey_Rabbit.BP_Prey_Rabbit_C",
		[0, 0, 0],
		[-4869, 2948, 380],
		[2, 2, 2]
	],
	[
		"/Game/Blueprints/AI/Prey/BP_Prey_Rabbit.BP_Prey_Rabbit_C",
		[0, 0, 0],
		[-4869, 2948, 60],
		[1, 1, 1]
	],

	[
		"/Game/Blueprints/Game/Totems/BP_Totem.BP_Totem_C",
		[0, 0, 0],
		[-9067,3919,2193],//桅杆：
		[1, 1, 1]
	],
	[
		"/Game/Maps/NorthWestPassage/Departure/BP_Totem_Wendigo.BP_Totem_Wendigo_C",
		[0, 0, 0],
		[-4898, 2199, 40],//冰雕位置
		[1, 1, 1]
	],
	[
		"/Game/Blueprints/Environment/FoodStorage/NakedSkeletons/BP_Skeleton_Naked_03_Snow.BP_Skeleton_Naked_03_Snow_C",
		[0, 0, 0],
		[-3795,4666,250],//阴暗：
		[1, 1, 1]
	],
	[
		"/Game/Blueprints/Environment/FoodStorage/NakedSkeletons/BP_Skeleton_Naked_04.BP_Skeleton_Naked_04_C",
		[0, 0, 0],
		[-3808,4840,270],//阴暗：
		[1, 1, 1]
	],
	[
		"/Game/Blueprints/Ship/BP_CrowsNestRigging.BP_CrowsNestRigging_C",
		[0, 0, 0],
		[-8434,5739,-7000],//上船木板2
		[2, 2, 5]
	],];

	Interceptor.attach(base.add(0x29D7340), {
		onEnter: function(args) {
			GWorld1 = args[0];
		},
		onLeave: function(retval) {

		}
	});

	Interceptor.attach(base.add(0x29D7340), {
		onEnter: function(args) {
			GWorld1 = args[0];
		},
		onLeave: function(retval) {

		}
	});



	Interceptor.attach(ADH_LobbyGameMode_InitGame_addr, {
		onEnter : function(args) {},
		onLeave : function(ret) {
			for(var i = 0; i < ActorToSpawn.length; i++) {
			var ActorClass = getClass(ActorToSpawn[i][0]);
			var Transform = makeTransform(ActorToSpawn[i][1], ActorToSpawn[i][2], ActorToSpawn[i][3]);
			spawnActor(GWorld1, ActorClass, Transform, getGameState());
			}
		}
	});
}

/////////////////////////////////////////////踏空跳
if(MSwitch && OnlyJump){
	var IsFloat = base.add(0x2DBD4DF);

	Interceptor.attach(IsFloat, {
		onEnter: function (args) {
			if(base.add(0x4C70908).readPointer().readPointer().add(0x20).readPointer().add(0xF0).readU8() == 3)
			{
				this.context.rax = 1;
			}
		}
	});
	
	//允许水中跳跃
	var ADH_IsSwim_addr = base.add(0xEB6002);
	Memory.protect(ADH_IsSwim_addr, 2, 'rwx'); // 确保内存可写
	Memory.patchCode(ADH_IsSwim_addr, 2, function (code) {
    var writer = new X86Writer(code, { pc: ADH_IsSwim_addr });
		writer.putNop(); // 用NOP指令替换原来的指令
		writer.putNop();
		writer.flush();
	});
	Memory.protect(ADH_IsSwim_addr, 2, 'rx'); // 恢复内存保护
}


