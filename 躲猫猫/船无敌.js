var base = Module.findBaseAddress('DreadHungerServer-Win64-Shipping.exe');

var ADH_Warship_BeginPlay_addr =  base.add(0xe60cc0)
Interceptor.attach(ADH_Warship_BeginPlay_addr, {
    onEnter: function(args) {
        this.ADH_Warship = args[0];
        
    },onLeave : function() {
        var ADH_Warship = this.ADH_Warship;
        ADH_Warship.add(0x274).writeU32(0);
    }
});