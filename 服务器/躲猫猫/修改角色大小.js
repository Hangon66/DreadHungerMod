var base = Module.findBaseAddress('DreadHungerServer-Win64-Shipping.exe');

var ADH_GameMode_SpawnDefaultPawnAtTransform_Implementation =  base.add(0xDAB090)
Interceptor.attach(ADH_GameMode_SpawnDefaultPawnAtTransform_Implementation, {
    onEnter: function(args) {
        var Transform = args[2]
        Transform.add(32).writeFloat(0.3);
        Transform.add(36).writeFloat(0.3);
        Transform.add(40).writeFloat(0.3);
    },
});