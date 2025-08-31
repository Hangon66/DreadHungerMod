
var base = Module.findBaseAddress('DreadHungerServer-Win64-Shipping.exe');

//var FTransform_Identity = base.add(0x4559220);
var FActorSpawnParameters_FActorSpawnParameters = new NativeFunction(base.add(0x29584A0), 'void', ['pointer'], 'win64');
var UWorld_SpawnActor = new NativeFunction(base.add(0x2624510), 'pointer', ['pointer', 'pointer', 'pointer', 'pointer'], 'win64');
//var UObject_GetWorld = new NativeFunction(base.add(0x13075A0), 'pointer', ['pointer'], 'win64');

var UClass_GetPrivateStaticClass = new NativeFunction(base.add(0x11F02E0), 'pointer', [], 'win64');

var StaticLoadObject = new NativeFunction(base.add(0x137B290), 'pointer', ['pointer', 'pointer', 'pointer', 'pointer', 'int32', 'pointer', 'int8', 'pointer'], 'win64');
var StaticFindObject = new NativeFunction(base.add(0x137AAA0), 'pointer', ['pointer', 'pointer', 'pointer', 'int8'], 'win64');


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

var GWorld = base.add(0x46ED420);//7FF60EEFD420
//var GWorld = base.add(0x45F0710).readPointer().add(0x3A8);
//var GWorld = base.add(0x46ECF70).readPointer().add(0x3A8);
function getGameState()
{
    var AuthorityGameMode = GWorld.readPointer().add(0x118).readPointer();
    var GameState = AuthorityGameMode.add(0x280).readPointer();
    return GameState;
}
var AnimalHelperSpawnArray = [[
    "/Game/Blueprints/Game/Lobby/BP_MapTable.BP_MapTable_C",
    [0, 0, 0],
    [-44000, -27000, 20],
    [2, 2, 2]
],
[
    "/Game/Blueprints/Player/BP_HumanCharacter.BP_HumanCharacter_C",
    [0, 0, 0],
    [-44000, -27000, 420],
    [1, 1, 1]
],
[
    "/Game/Blueprints/Ship/BP_Warship.BP_Warship_C",
    [0, 0, 0],
    [-60193, -29169, 20],
    [2, 2, 2]

],
[
    "/Game/Blueprints/Ship/BP_CrowsNestRigging.BP_CrowsNestRigging_C",
    [0, 0, 0],
    [-57888, -28422, 1000],
    [1, 1, 1]  

],
[
    "/Game/Blueprints/Ship/BP_CrowsNestRigging.BP_CrowsNestRigging_C",
    [0, 0, 0],
    [-57943, -28022, 1000],
    [1, 1, 1]  

]];
var ADH_GameMode_InitGame_addr = base.add(0xd9b220);
Interceptor.attach(ADH_GameMode_InitGame_addr, {
    onEnter : function(args) {},
    onLeave : function(ret) {
        for(var i = 0; i < AnimalHelperSpawnArray.length; i++) {
            var ActorClass = getClass(AnimalHelperSpawnArray[i][0]);
            var Transform = makeTransform(AnimalHelperSpawnArray[i][1], AnimalHelperSpawnArray[i][2], AnimalHelperSpawnArray[i][3]);
            spawnActor(GWorld.readPointer(), ActorClass, Transform, getGameState());
        }
    }
});


