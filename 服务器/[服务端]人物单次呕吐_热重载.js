// [服务端]人物单次呕吐_热重载.js
// 每个真人玩家角色开局 1 秒后自动开始呕吐，默认每 1 秒一次，持续循环。
// 客户端通过 VomitCount(0xDAC) 的 RepNotify（就是 PlayVomitEffects）收到通知并本地播放。
// 自动呕吐期间无体力/预留血量惩罚；检测到正常中毒（ApplyPoisonTimer 或外部 bPoisoned）时
// 立即退出并恢复字段，之后完全走原生中毒流程。
//
// 偏移均经 IDA 确认（DreadHungerServer-Win64-Shipping.exe）

var ENABLE = 1;                 // 总开关
var START_DELAY_MS = 1000;      // 角色出现后多久开始（开局后 1 秒）
var VOMIT_INTERVAL_MS = 1000;   // 两次呕吐开始的间隔
var PULSE_HOLD_FRAMES = 6;      // 每次呕吐 bPoisoned/VomitCount=1 保持帧数
var LOOP_VOMIT = 1;             // 1=每秒循环；0=只吐一次

function logInfo(Info) {
    var f = new File('output.log', 'a');
    f.write('[Patches] [自动呕吐] ' + Info + '\n');
    f.close();
}

var base = Module.findBaseAddress('DreadHungerServer-Win64-Shipping.exe');
if (base === null) {
    logInfo('未找到 DreadHungerServer-Win64-Shipping.exe，脚本退出');
} else {
    var OFF_ROLE = 0xF0;
    var OFF_PLAYER_STATE = 0x240;
    var OFF_B_POISONED = 0x1250;
    var OFF_VOMIT_COUNT = 0xDAC;
    var OFF_LAST_VOMIT_TIME = 0xCAC;
    var OFF_VOMIT_INTERVAL = 0xCB0;
    var OFF_POISON_RESERVE = 0xC10;
    var OFF_VOMIT_SLOW_DURATION = 0x9E0;
    var OFF_APPLY_POISON_TIMER = 0x1248;
    var OFF_CURRENT_REVIVER = 0xE28;

    var ADH_HumanCharacter_UpdateSickness = base.add(0xD79320);

    var states = {};

    // 清理旧脚本热重载时脉冲窗口内残留的字段
    function restoreResidual(ch) {
        var def = ch.add(0x9A8).readPointer();
        var defSlow = 0.0;
        var defReserve = ptr(0);
        if (!def.isNull()) {
            defSlow = def.add(OFF_VOMIT_SLOW_DURATION).readFloat();
            defReserve = def.add(OFF_POISON_RESERVE).readPointer();
        }
        ch.add(OFF_B_POISONED).writeU8(0);
        ch.add(OFF_VOMIT_COUNT).writeU8(0);
        ch.add(OFF_LAST_VOMIT_TIME).writeFloat(0.0);
        ch.add(OFF_VOMIT_INTERVAL).writeFloat(10.0);
        ch.add(OFF_VOMIT_SLOW_DURATION).writeFloat(defSlow);
        ch.add(OFF_POISON_RESERVE).writePointer(defReserve);
    }

    // 退出自动呕吐，恢复被改过的字段，交还原生中毒流程
    function stopAuto(ch, st, reason) {
        if (st.pulseStage === 1 || st.pulseStage === 2) {
            ch.add(OFF_VOMIT_COUNT).writeU8(0);
            ch.add(OFF_B_POISONED).writeU8(0);
            ch.add(OFF_POISON_RESERVE).writePointer(st.oldReserve);
        }
        if (st.oldSlowDur !== null) {
            ch.add(OFF_VOMIT_SLOW_DURATION).writeFloat(st.oldSlowDur);
        }
        ch.add(OFF_LAST_VOMIT_TIME).writeFloat(0.0);
        ch.add(OFF_VOMIT_INTERVAL).writeFloat(10.0);
        st.pulseStage = 0;
        st.phase = 3;
        logInfo('退出 ' + ch + '：' + reason);
    }

    // phase 0 等待开局 / 1 自动呕吐中 / 3 退出
    // pulseStage 0 等待下一拍 / 1 已置 bPoisoned / 2 呕吐保持中
    function tickCharacter(ch) {
        var key = ch.toString();
        var st = states[key];
        if (!st) {
            st = states[key] = {
                t0: Date.now(), phase: 0, pulseStage: 0, pulseFrames: 0,
                lastPulseAt: 0, oldReserve: null, oldSlowDur: null, failLogged: false
            };
        }
        if (st.phase >= 3) {
            return;
        }

        if (st.phase === 0) {
            if (Date.now() - st.t0 < START_DELAY_MS) {
                return;
            }
            if (ch.add(OFF_ROLE).readU8() !== 3) {
                st.phase = 3;
                return;
            }
            if (ch.add(OFF_PLAYER_STATE).readPointer().isNull()) {
                if (Date.now() - st.t0 >= 15000) {
                    st.phase = 3;
                }
                return;
            }
            if (!ch.add(OFF_CURRENT_REVIVER).readPointer().isNull()) {
                return;
            }

            // 已在中毒流程的角色不接管；仅热重载脉冲残留才清理
            var poisoned = ch.add(OFF_B_POISONED).readU8();
            var vomitCount = ch.add(OFF_VOMIT_COUNT).readU8();
            var timerPending = !ch.add(OFF_APPLY_POISON_TIMER).readPointer().isNull();
            if (poisoned !== 0 || vomitCount !== 0 || timerPending) {
                var residual = (poisoned !== 0) && !timerPending &&
                               (ch.add(OFF_VOMIT_SLOW_DURATION).readFloat() === 0) &&
                               ch.add(OFF_POISON_RESERVE).readPointer().isNull();
                if (residual) {
                    restoreResidual(ch);
                    logInfo('清理热重载残留 ' + key);
                } else {
                    st.phase = 3;
                    return;
                }
            }

            st.oldSlowDur = ch.add(OFF_VOMIT_SLOW_DURATION).readFloat();
            st.phase = 1;
            st.pulseStage = 0;
            st.lastPulseAt = 0;
            logInfo('开始 ' + key);
        }

        // 与正常中毒流程隔离
        if (!ch.add(OFF_APPLY_POISON_TIMER).readPointer().isNull()) {
            stopAuto(ch, st, '检测到下毒');
            return;
        }
        if (st.pulseStage === 0 && ch.add(OFF_B_POISONED).readU8() !== 0) {
            stopAuto(ch, st, '检测到外部中毒');
            return;
        }

        if (st.pulseStage === 1) {
            ch.add(OFF_VOMIT_SLOW_DURATION).writeFloat(0.0);
            ch.add(OFF_VOMIT_INTERVAL).writeFloat(0.0);
            st.pulseStage = 2;
            st.pulseFrames = PULSE_HOLD_FRAMES;
            return;
        }

        if (st.pulseStage === 2) {
            ch.add(OFF_VOMIT_SLOW_DURATION).writeFloat(0.0);
            st.pulseFrames -= 1;
            if (st.pulseFrames <= 0) {
                ch.add(OFF_VOMIT_COUNT).writeU8(0);
                ch.add(OFF_POISON_RESERVE).writePointer(st.oldReserve);
                ch.add(OFF_VOMIT_SLOW_DURATION).writeFloat(st.oldSlowDur);
                ch.add(OFF_LAST_VOMIT_TIME).writeFloat(0.0);
                ch.add(OFF_B_POISONED).writeU8(0);
                st.pulseStage = 0;
                if (!LOOP_VOMIT) {
                    st.phase = 3;
                }
            }
            return;
        }

        // pulseStage === 0：等待下一拍
        if (st.lastPulseAt !== 0 && Date.now() - st.lastPulseAt < VOMIT_INTERVAL_MS) {
            return;
        }

        st.oldReserve = ch.add(OFF_POISON_RESERVE).readPointer();
        ch.add(OFF_POISON_RESERVE).writePointer(ptr(0));
        ch.add(OFF_VOMIT_SLOW_DURATION).writeFloat(0.0);
        ch.add(OFF_VOMIT_INTERVAL).writeFloat(999999.0);
        ch.add(OFF_B_POISONED).writeU8(1);
        st.pulseStage = 1;
        st.lastPulseAt = Date.now();
    }

    Interceptor.attach(ADH_HumanCharacter_UpdateSickness, {
        onEnter: function (args) {
            var ch = args[0];
            if (ch.isNull()) {
                return;
            }
            try {
                tickCharacter(ch);
            } catch (e) {
                logInfo('异常 ' + e);
            }
        }
    });

    logInfo('已加载，开局 ' + START_DELAY_MS + 'ms 后开始，间隔 ' + VOMIT_INTERVAL_MS + 'ms' +
            (LOOP_VOMIT ? '' : '，单次'));
}
