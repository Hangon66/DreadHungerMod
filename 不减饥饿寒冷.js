var base = Module.findBaseAddress('DreadHungerServer-Win64-Shipping.exe');
/**
 * 全员不减饥饿寒冷值，同时不会自然回血
 */
var UDH_GameplayStatics_IgnoreSurvivalStats_addr =  base.add(0xe92a30)
Interceptor.attach(UDH_GameplayStatics_IgnoreSurvivalStats_addr, {
    onEnter: function(args) {
    },onLeave : function(retval) {
        this.context.rax = 1;
    }
});