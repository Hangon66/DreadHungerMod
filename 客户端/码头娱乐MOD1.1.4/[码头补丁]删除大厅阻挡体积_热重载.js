// [码头补丁]删除大厅阻挡体积_热重载.js
// 在 MenuLobby 加载时（ADH_LobbyGameMode::InitGame 之后），删除 PersistentLevel 中所有 BlockingVolume。
// MenuLobby 中这些 BlockingVolume 的碰撞配置均为 LobbyPlayerBlockingVolumes（共 15 个）。
//
// 说明：这是客户端本地删除，只影响本客户端的碰撞；服务器端这些体积仍然存在，
//       若服务器校验移动，角色仍可能被拉回，需要服务端同步处理。
//
// 偏移均为客户端 RVA（与 [码头补丁]地图修改&踏空步.js 一致）：
//   ADH_LobbyGameMode::InitGame 0xE7B140
//   UObject::GetWorld 0x1380FD0
//   UClass::GetPrivateStaticClass 0x1269CE0
//   StaticFindObject 0x13F44D0 / StaticLoadObject 0x13F4CC0
//   AActor::SetLifeSpan 0x26707C0
// 字段（两端一致，IDA 确认）：
//   UWorld::PersistentLevel 0x30 / ULevel::Actors 0x98 / UObject::ClassPrivate 0x10

var ENABLE = 1;

var base = Module.findBaseAddress('DreadHunger-Win64-Shipping.exe');
if (base === null) {
    console.log('[BlockingVolume] 未找到 DreadHunger-Win64-Shipping.exe，脚本退出');
} else {
    var OFF = {
        InitGame: 0xE7B140,
        GetWorld: 0x1380FD0,
        StaticFindObject: 0x13F44D0,
        StaticLoadObject: 0x13F4CC0,
        UClassStaticClass: 0x1269CE0,
        SetLifeSpan: 0x26707C0,
        World_PersistentLevel: 0x30,
        Level_Actors: 0x98,
        UObject_ClassPrivate: 0x10
    };

    var UObject_GetWorld = new NativeFunction(base.add(OFF.GetWorld), 'pointer', ['pointer'], 'win64');
    var StaticFindObject = new NativeFunction(base.add(OFF.StaticFindObject), 'pointer', ['pointer', 'pointer', 'pointer', 'int8'], 'win64');
    var StaticLoadObject = new NativeFunction(base.add(OFF.StaticLoadObject), 'pointer', ['pointer', 'pointer', 'pointer', 'pointer', 'int32', 'pointer', 'int8', 'pointer'], 'win64');
    var UClass_GetPrivateStaticClass = new NativeFunction(base.add(OFF.UClassStaticClass), 'pointer', [], 'win64');
    var AActor_SetLifeSpan = new NativeFunction(base.add(OFF.SetLifeSpan), 'void', ['pointer', 'float'], 'win64');

    var blockingVolumeClass = null;

    function logInfo(msg) {
        try {
            var f = new File('output.log', 'a');
            f.write('[Patches] [BlockingVolume] ' + msg + '\n');
            f.close();
        } catch (e) {
        }
    }

    function resolveBlockingVolumeClass() {
        var name = 'BlockingVolume';
        var buf = Memory.alloc((name.length + 1) * 2);
        buf.writeUtf16String(name);
        var cls = StaticFindObject(UClass_GetPrivateStaticClass(), ptr('0xFFFFFFFFFFFFFFFF'), buf, 0);
        if (cls !== null && !cls.isNull()) {
            return cls;
        }
        var path = '/Script/Engine.BlockingVolume';
        var buf2 = Memory.alloc((path.length + 1) * 2);
        buf2.writeUtf16String(path);
        return StaticLoadObject(UClass_GetPrivateStaticClass(), ptr(0), buf2, ptr(0), 0, ptr(0), 1, ptr(0));
    }

    function removeBlockingVolumes(gameMode) {
        if (blockingVolumeClass === null || blockingVolumeClass.isNull()) {
            blockingVolumeClass = resolveBlockingVolumeClass();
        }
        if (blockingVolumeClass === null || blockingVolumeClass.isNull()) {
            logInfo('加载 BlockingVolume 类失败');
            return;
        }
        var world = UObject_GetWorld(gameMode);
        if (world.isNull()) {
            logInfo('GetWorld 为空');
            return;
        }
        var level = world.add(OFF.World_PersistentLevel).readPointer();
        if (level.isNull()) {
            logInfo('PersistentLevel 为空');
            return;
        }
        var arr = level.add(OFF.Level_Actors);
        var data = arr.readPointer();
        var num = arr.add(8).readU32();
        if (data.isNull() || num <= 0) {
            logInfo('Actors 为空');
            return;
        }
        var removed = 0;
        for (var i = 0; i < num; i++) {
            var actor = data.add(8 * i).readPointer();
            if (actor.isNull()) {
                continue;
            }
            var cls = actor.add(OFF.UObject_ClassPrivate).readPointer();
            if (cls.isNull() || !cls.equals(blockingVolumeClass)) {
                continue;
            }
            AActor_SetLifeSpan(actor, 0.01);
            removed += 1;
        }
        logInfo('InitGame 删除 BlockingVolume ' + removed + ' / Actors ' + num);
    }

    if (ENABLE) {
        Interceptor.attach(base.add(OFF.InitGame), {
            onEnter: function (args) {
                this.gameMode = args[0];
            },
            onLeave: function (ret) {
                try {
                    removeBlockingVolumes(this.gameMode);
                } catch (e) {
                    logInfo('异常 ' + e);
                }
            }
        });
        logInfo('已加载');
    }
}
