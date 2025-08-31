var ADH_HumanCharacter = {
    // --- 音频组件 ---
    'VoiceAudioComponent' : ['int64', 0x09A0], // 语音音频组件
    'StatusAudioComponent' : ['int64', 0x0AE8], // 状态提示音组件
    'PhonographComponent' : ['int64', 0x1260], // 留声机音频组件
    'CurrentDialogue' : ['int64', 0x0D9C], // 当前播放的对话音频组件（弱引用）

    // --- 角色引用与控制器 ---
    'DefaultHuman' : ['int64', 0x09A8], // 默认人类角色模板
    'DHPlayerController' : ['int64', 0x0A08], // 关联的玩家控制器
    'LastDHPlayerState' : ['int64', 0x0C40], // 上一个 PlayerState
    'LastPoisoner' : ['int64', 0x0C48], // 导致中毒的控制器
    'AvatarOverride' : ['int64', 0x0C50], // 头像覆盖 PlayerState
    'PreviousAvatarOverride' : ['int64', 0x0C58], // 上一个头像覆盖
    'LastCarrier' : ['int64', 0x0CF0], // 上一个携带者
    'LastCarrierController' : ['int64', 0x0CF8], // 上一个携带者的控制器
    'LastReviver' : ['int64', 0x0D00], // 上一个复活者

    // --- 角色数据与行为 ---
    'AIRole' : ['int64', 0x09B0], // 玩家角色数据（AI 行为/身份配置）
    'AudienceVoiceData' : ['int64', 0x09B8], // 观众语音数据（用于广播或剧情）

    // --- 粒子与特效 ---
    'VomitParticleImpactEffect' : ['int64', 0x09C0], // 呕吐命中特效类
    'VomitParticle' : ['int64', 0x09C8], // 第三人称呕吐粒子
    'VomitParticle_FP' : ['int64', 0x09D0], // 第一人称呕吐粒子
    'MarkedParticle' : ['int64', 0x09E0], // 标记粒子系统
    'SpiritWalkTrailParticle' : ['int64', 0x0BD8], // 灵体行走轨迹粒子
    'ProjectileSpawnFlash' : ['int64', 0x0ED8], // 投掷物生成闪光效果
    'MeleeHitFlash' : ['int64', 0x0F00], // 近战命中闪光效果

    // --- 声音 ---
    'VomitSound' : ['int64', 0x09D8], // 呕吐音效
    'JumpSound' : ['int64', 0x0A98], // 跳跃音效
    'IntoWaterSound' : ['int64', 0x0AA0], // 入水音效
    'StartClimbingSound' : ['int64', 0x0AA8], // 开始攀爬音效
    'StatusAudioSound' : ['int64', 0x0AB0], // 状态提示音
    'EnterIncapacitationSoundVox' : ['int64', 0x0AB8], // 进入倒地状态语音
    'EnterIncapacitationSoundSFX' : ['int64', 0x0AC0], // 进入倒地状态音效
    'IncapacitatedLandSoundSFX' : ['int64', 0x0AC8], // 倒地着地音效
    'LeaveIncapacitationSoundVox' : ['int64', 0x0AD0], // 离开倒地状态语音
    'LeaveIncapacitationSoundSFX' : ['int64', 0x0AD8], // 离开倒地状态音效
    'FailedDropPawnSound' : ['int64', 0x0B38], // 投掷角色失败音效
    'FallingScreamSound' : ['int64', 0x0B40], // 坠落尖叫音效
    'SpiritWalkBeginSound' : ['int64', 0x0C20], // 灵体行走开始音效
    'SpiritWalkAmbience' : ['int64', 0x0C28], // 灵体行走环境音（弱引用）
    'SpiritWalkEndSound' : ['int64', 0x0C30], // 灵体行走结束音效（TP）
    'SpiritWalkEndSoundFP' : ['int64', 0x0C38], // 灵体行走结束音效（FP）

    // --- 材质与后期处理 ---
    'PostProcessSilhouetteMaterial' : ['int64', 0x0A10], // 轮廓后期材质
    'ThrallPostProcessSilhouetteMaterial' : ['int64', 0x0A18], // 傀儡轮廓材质
    'PostProcessInteractMaterial' : ['int64', 0x0A20], // 交互后期材质
    'CurrentAimingPostProcessMaterial' : ['int64', 0x0C78], // 当前瞄准后期材质
    'AimingPostProcessMID' : ['int64', 0x0C80], // 瞄准材质实例（弱引用）
    'PostProcessMID' : ['int64', 0x0CD8], // 后期处理材质实例（动态）
    'MarkerMaterial' : ['int64', 0x0BD0], // 标记材质

    // --- 摄像机与视角 ---
    'PlayerCamera' : ['int64', 0x0A28], // 玩家摄像机组件
    'FirstPersonShadowMesh' : ['int64', 0x0C90], // 第一人称阴影网格
    'LastCameraLoc' : ['int32', 0x0CC8], // 上次摄像机位置（FVector）
    'LastCameraUpdateTime' : ['float', 0x0CC4], // 上次摄像机更新时间

    // --- 手部与交互 ---
    'HandSocketNames' : ['int64', 0x0A30], // 手部插槽名称数组（TArray<FName>）
    'GrabbedPickup' : ['int64', 0x0E08], // 当前抓取的物品
    'GrabbedPickupRelativeTransform' : ['int32', 0x0B80], // 抓取物相对变换（FTransform）
    'LastInteractTargetLocation' : ['int32', 0x0BB0], // 上次交互目标位置
    'GrabHand' : ['int8', 0x0B79], // 抓取手（主导手）
    'bEmptyHandedGrab' : ['int8', 0x0BBC], // 是否空手抓取
    'bFindCarriedPawnDropLocation' : ['int8', 0x0CB4], // 是否寻找投掷落点
    'CarriedPawnDropVelocity' : ['int32', 0x0CB8], // 被携带者投掷初速度
    'HiddenView' : ['int64', 0x0D3C], // 隐藏的物品视图（弱引用）
    'GrabbedPickupPendingShowView' : ['int64', 0x0D3C], // 待显示的抓取视图（弱引用）
    'GrabAlpha' : ['float', 0x0D44], // 抓取动画透明度
    'RestoreViewVisibilityTimer' : ['int64', 0x0D48], // 恢复视图可见性定时器

    // --- 船只系统 ---
    'ShipBase' : ['int64', 0x09F8], // 所属战舰
    'ControlledShip' : ['int64', 0x0C18], // 控制的战舰
    'bIsOutdoors' : ['int8', 0x0A00], // 是否在室外
    'bWasOnShip' : ['int8', 0x11D6], // 上一帧是否在船上
    'bInsideShip' : ['int8', 0x0E44], // 是否在船内

    // --- 调试与开发 ---
    'bDebugAnimations' : ['int8', 0x0A01], // 是否启用动画调试

    // --- 生存状态开关 ---
    'bUpdateHunger' : ['int8', 0x0A40], // 是否更新饥饿
    'bUpdateWarmth' : ['int8', 0x0A41], // 是否更新体温

    // --- 数值配置 ---
    'CriticalWarmthThreshold' : ['float', 0x0A44], // 危险低温阈值
    'MaximumStamina' : ['float', 0x0A48], // 最大耐力
    'MinimumStamina' : ['float', 0x0A4C], // 最小耐力
    'CurrentStamina' : ['float', 0x0A50], // 当前耐力
    'HealthBoostRegenRate' : ['float', 0x0A58], // 健康增益恢复速率
    'SanityRegenRate' : ['float', 0x0A5C], // 理智恢复速率
    'HallucinationSanityThreshold' : ['float', 0x0A78], // 幻觉理智阈值
    'LastTotemStartedDrainingSanityTime' : ['float', 0x0A7C], // 上次图腾开始吸理智时间
    'WarmthRegenRate' : ['float', 0x0A80], // 体温恢复速率
    'HungerRegenRate' : ['float', 0x0A84], // 饥饿恢复速率
    'HungerIncreasePerSecond' : ['float', 0x0A88], // 饥饿每秒增长
    'JumpStaminaConsumption' : ['float', 0x0A8C], // 跳跃耐力消耗
    'BodyTossStaminaConsumption' : ['float', 0x0A90], // 投掷角色耐力消耗
    'HeightAboveWaterToScream' : ['float', 0x0AE0], // 水面以上高度触发尖叫
    'ExtraPawnThrowLift' : ['float', 0x0B04], // 投掷额外抬升力
    'BleedoutDPS' : ['float', 0x0B18], // 倒地后每秒掉血
    'TossPawnVelocity' : ['float', 0x0B1C], // 投掷速度标量
    'ReviveHealthPercentage' : ['float', 0x0B28], // 复活生命百分比
    'ReviveWarmthPct' : ['float', 0x0B2C], // 复活体温百分比
    'DBNOStartingHealth' : ['float', 0x0B30], // 倒地起始生命值
    'SpiritWalkSpeedModifier' : ['float', 0x0BC0], // 灵体行走速度加成
    'SpiritAppearanceAlpha' : ['float', 0x0BC4], // 灵体外观透明度
    'DoppelReservedHealth' : ['float', 0x0BCC], // 分身保留生命值
    'PoisonReserveHealth' : ['int64', 0x0C10], // 中毒生命保留曲线
    'HungerHealthReserveSpeed' : ['float', 0x0CA0], // 饥饿生命保留恢复速度
    'MaxHealthRegenSpeed' : ['float', 0x0CA4], // 最大生命恢复速度
    'LastVomitParticleTime' : ['float', 0x0CAC], // 上次呕吐粒子时间
    'VomitParticleSpawnInterval' : ['float', 0x0CB0], // 呕吐粒子生成间隔
    'SleepingPPAlpha' : ['float', 0x0CE0], // 睡眠后期透明度
    'ColdPPAlpha' : ['float', 0x0CE4], // 寒冷后期透明度
    'SickPPAlpha' : ['float', 0x0CE8], // 生病后期透明度
    'AimingPPAlpha' : ['float', 0x0C88], // 瞄准后期透明度
    'WetnessAlpha' : ['float', 0x0D88], // 潮湿程度
    'FeetSnowAlpha' : ['float', 0x0D84], // 脚下积雪效果
    'HealthBoostDelay' : ['float', 0x0D8C], // 健康增益延迟
    'WaterColdScalar' : ['float', 0x0D90], // 水中寒冷系数
    'WaterColdScalarDecay' : ['float', 0x0D94], // 水中寒冷衰减
    'ExplosiveSpilloverDamage' : ['float', 0x0D98], // 爆炸溅射伤害
    'HealthBoostDelayThreshold' : ['float', 0x0DA4], // 健康延迟触发阈值
    'HealthBoostDelayTime' : ['float', 0x0DA8], // 健康延迟计时
    'RealHealth' : ['float', 0x0DB0], // 实际生命值
    'PerceivedHealth' : ['float', 0x0DB4], // 感知生命值
    'RealWarmth' : ['float', 0x0DB8], // 实际体温
    'PerceivedWarmth' : ['float', 0x0DBC], // 感知体温
    'RealHunger' : ['float', 0x0DC0], // 实际饥饿
    'PerceivedHunger' : ['float', 0x0DC4], // 感知饥饿
    'NextSanityHealthRandomizationDelay' : ['float', 0x0DC8], // 下次健康随机延迟
    'LastSanityHealthRandomization' : ['float', 0x0DCC], // 上次健康随机值
    'NextSanityWarmthRandomizationDelay' : ['float', 0x0DD0], // 下次体温随机延迟
    'LastSanityWarmthRandomization' : ['float', 0x0DD4], // 上次体温随机值
    'NextSanityHungerRandomizationDelay' : ['float', 0x0DD8], // 下次饥饿随机延迟
    'LastSanityHungerRandomization' : ['float', 0x0DDC], // 上次饥饿随机值
    'LastScoredWarmthTime' : ['float', 0x0D80], // 上次得分体温时间
    'CurrentSprintFOV' : ['float', 0x0D18], // 当前冲刺FOV
    'CurrentAimFOV' : ['float', 0x0D1C], // 当前瞄准FOV
    'LastGrabbedPickupTime' : ['float', 0x0D20], // 上次抓取物品时间
    'LastCoalProximityUpdateTime' : ['float', 0x0D24], // 上次煤炭接近更新
    'TargetGain' : ['int32', 0x0D74], // 目标增益（FVector）
    'CorpseFadeAlpha' : ['float', 0x12A8], // 尸体淡出透明度
    'CorpseFadeTime' : ['float', 0x12AC], // 尸体淡出时间
    'MaxSpiritWalkAlpha' : ['float', 0x12A4], // 最大灵体透明度
    'DistanceTraveledLastSecond' : ['float', 0x1278], // 上一秒移动距离
    'DistanceCheckTimeRemaining' : ['float', 0x127C], // 距离检测剩余时间
    'DistanceCheckInterval' : ['float', 0x1280], // 距离检测间隔
    'ExpectedMaxMoveSpeed' : ['float', 0x1284], // 预期最大移动速度
    'LastExpectedMaxMoveSpeed' : ['float', 0x1288], // 上一帧预期速度
    'ClosestToMaxPct' : ['float', 0x128C], // 最接近最大速度百分比
    'FallTime' : ['float', 0x1294], // 坠落时间
    'LastFallingZ' : ['float', 0x1258], // 上次坠落Z坐标
    'FallDistance' : ['float', 0x1254], // 坠落距离
    'CurrentTemperature' : ['float', 0x11C0], // 当前环境温度

    // --- 布尔状态 ---
    'bIsSprinting' : ['int8', 0x0A54], // 是否正在冲刺
    'bWasSprinting' : ['int8', 0x0A55], // 上一帧是否冲刺
    'bIsIncapacitated' : ['int8', 0x0E10], // 是否倒地
    'bAllowDBNO' : ['int8', 0x0B00], // 是否允许DBNO
    'bNeverRevive' : ['int8', 0x0B24], // 是否禁止复活
    'bMarkedForWendigoAttack' : ['int8', 0x0B78], // 是否被 Wendigo 标记
    'bShowSpiritAppearance' : ['int8', 0x0BC8], // 是否显示灵体外观
    'bHideGhost' : ['int8', 0x0BC9], // 是否隐藏幽灵
    'bPlaySpiritWalkEnd' : ['int8', 0x0C70], // 是否播放灵体结束动画
    'bSpiritWalking' : ['int8', 0x0C71], // 是否处于灵体行走
    'bIsAiming' : ['int8', 0x0C72], // 是否正在瞄准
    'bWasSick' : ['int8', 0x0CA8], // 是否曾生病
    'bFadingToBlack' : ['int8', 0x0D70], // 是否正在淡入黑屏
    'bWasOnShipWhenHealthy' : ['int8', 0x0DEC], // 健康时是否在船上
    'bInsideShip' : ['int8', 0x0E44], // 是否在船内
    'bIsLobbyPawn' : ['int8', 0x11D0], // 是否为大厅角色
    'bSetLobbyPawn' : ['int8', 0x11D1], // 是否已设置大厅角色
    'bIsDoppelganger' : ['int8', 0x11D2], // 是否为分身
    'bThrall' : ['int8', 0x11D3], // 是否为傀儡
    'bInitializedMesh' : ['int8', 0x11D4], // 是否已初始化网格
    'bTotemWasDrainingSanity' : ['int8', 0x11D5], // 图腾是否曾吸理智
    'bHungerIncreasing' : ['int8', 0x11C4], // 饥饿是否正在增加
    'bSetInitialHunger' : ['int8', 0x1024], // 是否已设置初始饥饿
    'bPoisoned' : ['int8', 0x1250], // 是否中毒
    'bFallingToDeath' : ['int8', 0x1251], // 是否正在坠落致死

    // --- 整数与枚举 ---
    'ReviveSlot' : ['int32', 0x0B20], // 复活槽位
    'CurrentHallucinationIndex' : ['int32', 0x11E8], // 当前幻觉索引
    'MaxLocationFrames' : ['int32', 0x1290], // 最大位置帧数
    'VomitCount' : ['uint8', 0x0DAC], // 呕吐次数
    'JumpCount' : ['uint8', 0x0AF0], // 跳跃计数

    // --- 变换与向量 ---
    'ReplicatedLookDir' : ['int32', 0x0AF4], // 复制的视角方向（FVector）
    'GrabCameraOffset' : ['int32', 0x0D28], // 抓取摄像机偏移（FVector）
    'FallingRagdollPosition' : ['int32', 0x0D08], // 倒地布娃娃位置
    'ReviveLoc' : ['int32', 0x0FA0], // 复活位置
    'ReviveRot' : ['int32', 0x0FAC], // 复活旋转（FRotator）
    'RelativeRestTransform' : ['int32', 0x0FC0], // 相对静止变换（FTransform）
    'LastFrameLocation' : ['int32', 0x1298], // 上一帧位置

    // --- 定时器句柄 ---
    'EndSprintWalkTimerHandle' : ['int64', 0x0D50], // 结束冲刺定时器
    'ScoreStayingAliveTimerHandle' : ['int64', 0x0D58], // 记分存活定时器
    'SpawnHallucinationTimerHandle' : ['int64', 0x0D60], // 生成幻觉定时器
    'ReviveTimerHandle' : ['int64', 0x0D68], // 复活定时器
    'UpdateStatusAudioTimerHandle' : ['int64', 0x11C8], // 更新状态音频定时器
    'ApplyPoisonTimer' : ['int64', 0x1248], // 应用中毒定时器
    'StopServerAnimationTimerHandle' : ['int64', 0x12B0], // 停止服务器动画定时器

    // --- 容器与集合 ---
    'HandSocketNames' : ['int64', 0x0A30], // 手部插槽名数组
    'HallucinationTypes' : ['int64', 0x0A68], // 幻觉类型数组
    'MarkedParticleComponent' : ['int64', 0x09F0], // 标记粒子组件
    'BodyInventoryClass' : ['int64', 0x0B08], // 身体物品栏类
    'IncapacitatedLandingEffects' : ['int64', 0x0B10], // 倒地着陆特效类
    'DoppelgangerAnimInstanceClass' : ['int64', 0x0C98], // 分身动画实例类
    'RestingSoundMix' : ['int64', 0x0B48], // 休息音效混合
    'NormalSoundMix' : ['int64', 0x0B50], // 正常音效混合
    'HallucinationSpawnQueryTemplate' : ['int64', 0x0A60], // 幻觉生成查询模板
    'LastHealthyLocation' : ['int32', 0x0DE0], // 上次健康位置
    'AuthorityBoneLocations' : ['int64', 0x0DF0], // 权威骨骼位置数组
    'CurrentInteractTarget' : ['int64', 0x0E00], // 当前交互目标
    'CarryingPawn' : ['int64', 0x0E18], // 正在携带的角色
    'CarriedPawnInv' : ['int64', 0x0E20], // 被携带者的物品栏
    'CurrentReviver' : ['int64', 0x0E28], // 当前复活者
    'CachedPhysicsVolume' : ['int64', 0x0E30], // 缓存的物理体积
    'LastConsumedStaminaTime' : ['float', 0x0E38], // 上次消耗耐力时间
    'LastFrameStamina' : ['float', 0x0E3C], // 上一帧耐力
    'StaminaRecoveryAlpha' : ['float', 0x0E40], // 耐力恢复插值
    'LastSwimmingTime' : ['float', 0x0E48], // 上次游泳时间
    'LastWalkableFloor' : ['int32', 0x0E4C], // 上次可行走地面（FHitResult）
    'ProjectileSpawnFlash' : ['int32', 0x0ED8], // 投掷物生成闪光
    'MeleeHitFlash' : ['int32', 0x0F00], // 近战命中闪光
    'RelativeRestTransform' : ['int32', 0x0FC0], // 相对静止变换
    'SanityBoostRemaining' : ['float', 0x0FF0], // 剩余理智增益
    'WarmthBoostRemaining' : ['float', 0x0FF4], // 剩余体温增益
    'HungerBoostRemaining' : ['float', 0x0FF8], // 剩余饥饿增益
    'HealthBoostRemaining' : ['float', 0x0FFC], // 剩余健康增益
    'MinHealth' : ['float', 0x1000], // 最小生命值
    'MinIncapacitatedHealth' : ['float', 0x1004], // 最小倒地生命值
    'CurrentHunger' : ['float', 0x1008], // 当前饥饿
    'InitialHunger' : ['float', 0x100C], // 初始饥饿
    'MaxHunger' : ['float', 0x1010], // 最大饥饿
    'CurrentWarmth' : ['float', 0x1014], // 当前体温
    'MinWarmth' : ['float', 0x1018], // 最小体温
    'InitialWarmth' : ['float', 0x101C], // 初始体温
    'CurrentSanity' : ['float', 0x1020], // 当前理智
    'LastSpiritWalkStartTime' : ['float', 0x1028], // 上次灵体开始时间
    'LastSpiritWalkEndTime' : ['float', 0x102C], // 上次灵体结束时间
    'PostProcessTaskStack' : ['int64', 0x1030], // 后期处理任务堆栈
    'PostProcessFriendlyStack' : ['int64', 0x1080], // 友方后期堆栈
    'PostProcessEnemyStack' : ['int64', 0x10D0], // 敌方后期堆栈
    'PostProcessInteractStack' : ['int64', 0x1120], // 交互后期堆栈
    'PostProcessTargetStack' : ['int64', 0x1170], // 目标后期堆栈
    'CurrentTemperature' : ['float', 0x11C0], // 当前温度
    'bHungerIncreasing' : ['int8', 0x11C4], // 饥饿是否增加
    'Hallucinations' : ['int64', 0x11D8], // 当前幻觉数组
    'CurrentHallucinationIndex' : ['int32', 0x11E8], // 当前幻觉索引
    'RemainingHallucinationsToSpawn' : ['int64', 0x11F0], // 剩余待生成幻觉
    'LastHallucinationEndTime' : ['float', 0x1240], // 上次幻觉结束时间
    'NextHallucinationDelay' : ['float', 0x1244], // 下次幻觉延迟
    'ApplyPoisonTimer' : ['int64', 0x1248], // 中毒应用定时器
    'LastKnownLocations' : ['int64', 0x1268], // 最后已知位置数组
    'DistanceTraveledLastSecond' : ['float', 0x1278], // 上一秒移动距离
    'DistanceCheckTimeRemaining' : ['float', 0x127C], // 距离检测剩余时间
    'DistanceCheckInterval' : ['float', 0x1280], // 距离检测间隔
    'ExpectedMaxMoveSpeed' : ['float', 0x1284], // 预期最大速度
    'LastExpectedMaxMoveSpeed' : ['float', 0x1288], // 上一帧预期速度
    'ClosestToMaxPct' : ['float', 0x128C], // 最接近最大速度百分比
    'MaxLocationFrames' : ['int32', 0x1290], // 最大位置帧数
    'FallTime' : ['float', 0x1294], // 坠落时间
    'LastFrameLocation' : ['int32', 0x1298], // 上一帧位置
    'MaxSpiritWalkAlpha' : ['float', 0x12A4], // 最大灵体透明度
    'CorpseFadeAlpha' : ['float', 0x12A8], // 尸体淡出透明度
    'CorpseFadeTime' : ['float', 0x12AC], // 尸体淡出时间
    'StopServerAnimationTimerHandle' : ['int64', 0x12B0], // 停止动画定时器

        // --- 基础引用与组件 ---
    'DefaultCharacter' : ['int64', 0x04D8], // 默认角色模板
    'ColorMaskComponent' : ['int64', 0x04E0], // 颜色遮罩组件（用于阵营/身份标识）
    'FootstepEffects' : ['int64', 0x04E8], // 脚步特效类（TSubclassOf）
    'LandingEffects' : ['int64', 0x04F0], // 着陆特效类
    'ArmBoneNames' : ['int64', 0x04F8], // 手臂骨骼名数组（TArray<FName>）
    'LegBoneNames' : ['int64', 0x0508], // 腿部骨骼名数组
    'FootBoneNames' : ['int64', 0x0518], // 脚部骨骼名数组
    'SnareSocket' : ['int32', 0x0528], // 捕兽夹插槽名称（FName）

    // --- 音频与反馈 ---
    'PainSounds' : ['int64', 0x0530], // 不同伤害类型的疼痛音效映射（TMap<DamageType, Sound>）
    'DeathSound' : ['int64', 0x0580], // 死亡音效
    'HallucinationDissipateSound' : ['int64', 0x0588], // 幻觉消散音效

    // --- 数值配置 ---
    'DeathUnpossessDelay' : ['float', 0x0590], // 死亡后解除控制延迟
    'MaxPhysicalHitReactionBlendWeight' : ['float', 0x0594], // 最大物理受击反应混合权重
    'bCorpseReceivesDecals' : ['int8', 0x05A0], // 尸体是否接收贴花（Decal）
    'CarcassStaticMesh' : ['int64', 0x0598], // 尸体静态网格体
    'CarcassMesh' : ['int64', 0x05A8], // 尸体网格组件
    'HeadBoneName' : ['int32', 0x05B0], // 头部骨骼名称（FName）

    // --- 事件与委托 ---
    'OnDiedDelegate' : ['int64', 0x05B8], // 角色死亡事件（FCharacterDiedEvent）
    'DeathStat' : ['int8', 0x05C8], // 死亡统计类型（EPlayerMatchStatType）
    'DeathTime' : ['float', 0x05CC], // 死亡时间戳
    'LastReceivedDamageTime' : ['float', 0x05D0], // 上次受伤害时间
    'FallingDamageThreshold' : ['float', 0x05D4], // 坠落伤害触发阈值

    // --- 伤害与抗性 ---
    'DamageResistances' : ['int64', 0x05D8], // 伤害抗性表（TMap<DamageType, float>）
    'PerceptionStimuli' : ['int64', 0x0628], // AI 感知刺激源组件
    'bAllowDismemberment' : ['int8', 0x0650], // 是否允许肢解
    'bPendingObliteration' : ['int8', 0x0651], // 是否即将被彻底毁灭
    'MaxAllowedWounds' : ['int32', 0x0654], // 最大允许伤口数
    'BodyParts' : ['int64', 0x0658], // 可掉落的身体部件类数组
    'BodyPartBonePositions' : ['int64', 0x0668], // 身体部件骨骼位置映射（TMap<FName, FVector>）

    // --- 事件委托（健康相关）---
    'OnReservedHealthChangedDelegate' : ['int64', 0x06B8], // 保留生命值变化事件
    'OnMaximumHealthChangedDelegate' : ['int64', 0x06C8], // 最大生命值变化事件
    'OnDeathStateChanged' : ['int64', 0x06D8], // 死亡状态变化事件

    // --- 移动与行为 ---
    'AttackCooldown' : ['float', 0x06E8], // 攻击冷却时间
    'bAIIgnore' : ['int8', 0x06EC], // AI 是否忽略此角色
    'IdleSpeed' : ['float', 0x06F0], // 闲置移动速度
    'RunSpeed' : ['float', 0x06F4], // 奔跑速度
    'TargetCharacter' : ['int64', 0x06F8], // 当前目标角色（AI 使用）

    // --- 幻觉与状态 ---
    'bIsHallucination' : ['int8', 0x0700], // 是否为幻觉实体
    'LastLanding' : ['int32', 0x0704], // 上次着陆信息（FHitResult）
    'LastDamageInstigator' : ['int64', 0x0790], // 最后造成伤害的控制器
    'LastDamageCauser' : ['int64', 0x0798], // 最后伤害来源 Actor
    'Snare' : ['int32', 0x07A0], // 捕兽夹闪光效果结构体（FSnareFlash）
    'LastDamageReceived' : ['int32', 0x07B0], // 上次收到的伤害实例（FDamageInstance）
    'MaximumHealth' : ['float', 0x07E0], // 最大生命值
    'MeshMIDs' : ['int64', 0x07E8], // 网格材质实例数组（UMaterialInstanceDynamic*）
    'BackupPlayerName' : ['int64', 0x07F8], // 备份玩家名称（FString）
    'InventoryComponent' : ['int64', 0x0808], // 物品栏管理组件
    'CorpseCraftingComponent' : ['int64', 0x0810], // 尸体可制作组件
    'DeathState' : ['int8', 0x0818], // 当前死亡状态（ECharacterDeathState）

    // --- 客户端伤害验证 ---
    'UnValidatedClientDamageEffects' : ['int64', 0x0820], // 未验证的客户端伤害效果（FDamageInstance 数组）
    'LastDamageImpulse' : ['int32', 0x0830], // 上次伤害冲量（FVector）
    'HitReactionBlendOutTime' : ['float', 0x083C], // 受击反应混合退出时间
    'LastClimbingActor' : ['int64', 0x0840], // 上一个攀爬的 Actor
    'CorpseBuoyancy' : ['int64', 0x0848], // 尸体浮力组件
    'bHasDied' : ['int8', 0x0850], // 是否已经死亡
    'bTurnedOffRagdoll' : ['int8', 0x0851], // 是否已关闭布娃娃
    'LastPainSoundTime' : ['float', 0x0854], // 上次播放疼痛音效时间
    'WoundCount' : ['int32', 0x0858], // 当前伤口数量

    // --- 定时器句柄 ---
    'CarcassTearOffTimer' : ['int64', 0x0860], // 尸体撕裂定时器
    'bCorpseWasHarvested' : ['int8', 0x0868], // 尸体是否已被收获
    'RemainingCorpseByproducts' : ['int64', 0x0870], // 剩余尸体副产品（TMap<Inventory, Count>）
    'DeathUnpossessTimer' : ['int64', 0x08C0], // 死亡后解除控制定时器
    'DeathInventoryToAdd' : ['int64', 0x08C8], // 死亡时需添加的物品（TMap<Inventory, Count>）
    'ClearLastDamageInstigatorTimeHandle' : ['int64', 0x0918], // 清除伤害来源定时器
    'HallucinationLifespanTimerHandle' : ['int64', 0x0920], // 幻觉生命周期定时器
    'SnareOpenTimerHandle' : ['int64', 0x0928], // 捕兽夹开启定时器
    'UpdateCorpseTimerHandle' : ['int64', 0x0930], // 更新尸体状态定时器

    // --- 弱引用与状态 ---
    'LastSnareActor' : ['int64', 0x0938], // 最后触发的捕兽夹（TWeakObjectPtr）
    'bShouldRun' : ['int8', 0x0940], // 是否应奔跑（AI 控制）
    'bInterpolateFaceRotation' : ['int8', 0x0941], // 是否插值面部旋转
    'FaceRotationInterpSpeed' : ['float', 0x0944], // 面部旋转插值速度
    'bCorpseWasInWater' : ['int8', 0x0948], // 尸体是否曾在水中
    'CurrentHealthState' : ['int8', 0x0949], // 当前健康状态（ECharacterHealthState）
    'CurrentHealth' : ['float', 0x094C], // 当前生命值
    'CurrentReservedHealth' : ['float', 0x0950], // 当前保留生命值（如中毒保留）
    'SpawnTeam' : ['int8', 0x0954], // 生成阵营（EDHTeam::Type）
    'TeamID' : ['int8', 0x0955], // 通用团队 ID（FGenericTeamId）

        'Mesh' : ['int64', 0x0280], // USkeletalMeshComponent* 主网格体
    'CharacterMovement' : ['int64', 0x0288], // UCharacterMovementComponent* 移动组件
    'CapsuleComponent' : ['int64', 0x0290], // UCapsuleComponent* 碰撞胶囊体

    'BasedMovement' : ['int32', 0x0298], // FBasedMovementInfo 当前移动基础信息
    'ReplicatedBasedMovement' : ['int32', 0x02C8], // FBasedMovementInfo 网络复制的移动信息

    'AnimRootMotionTranslationScale' : ['float', 0x02F8], // 动画根运动缩放
    'BaseTranslationOffset' : ['int32', 0x02FC], // 基础位置偏移（FVector）
    'BaseRotationOffset' : ['int32', 0x0310], // 基础旋转偏移（FQuat）

    'ReplicatedServerLastTransformUpdateTimeStamp' : ['float', 0x0320], // 服务器变换更新时间戳
    'ReplayLastTransformUpdateTimeStamp' : ['float', 0x0324], // 回放时间戳
    'ReplicatedMovementMode' : ['int8', 0x0328], // 复制的移动模式（enum EMovementMode）
    'bInBaseReplication' : ['int8', 0x0329], // 是否在基础复制中

    'CrouchedEyeHeight' : ['float', 0x032C], // 蹲下时眼睛高度

    // --- 位域标志（位于 0x0330，32位 uint）---
    'bIsCrouched' : ['bitfield', 0x0330, 0],           // 是否蹲下
    'bProxyIsJumpForceApplied' : ['bitfield', 0x0330, 1], // 代理跳跃力是否应用
    'bPressedJump' : ['bitfield', 0x0330, 2],          // 是否按下跳跃
    'bClientUpdating' : ['bitfield', 0x0330, 3],       // 客户端是否正在更新
    'bClientWasFalling' : ['bitfield', 0x0330, 4],     // 客户端之前是否在下落
    'bClientResimulateRootMotion' : ['bitfield', 0x0330, 5], // 客户端重模拟根运动
    'bClientResimulateRootMotionSources' : ['bitfield', 0x0330, 6], // 重模拟根运动源
    'bSimGravityDisabled' : ['bitfield', 0x0330, 7],   // 是否禁用模拟重力
    'bClientCheckEncroachmentOnNetUpdate' : ['bitfield', 0x0330, 8], // 网络更新时检查侵占
    'bServerMoveIgnoreRootMotion' : ['bitfield', 0x0330, 9], // 服务器移动忽略根运动
    'bWasJumping' : ['bitfield', 0x0330, 10],          // 是否正在跳跃

    'JumpKeyHoldTime' : ['float', 0x0334], // 跳跃按键按下时间
    'JumpForceTimeRemaining' : ['float', 0x0338], // 剩余跳跃力时间
    'ProxyJumpForceStartedTime' : ['float', 0x033C], // 代理跳跃开始时间
    'JumpMaxHoldTime' : ['float', 0x0340], // 最大跳跃按住时间
    'JumpMaxCount' : ['int32', 0x0344], // 最大跳跃次数（如二段跳）
    'JumpCurrentCount' : ['int32', 0x0348], // 当前跳跃计数
    'JumpCurrentCountPreJump' : ['int32', 0x034C], // 跳跃前的计数

    'NumActorOverlapEventsCounter' : ['int32', 0x0350], // 重叠事件计数器

    // --- 委托事件 ---
    'OnReachedJumpApex' : ['int64', 0x0358], // 到达跳跃顶点事件
    'LandedDelegate' : ['int64', 0x0368], // 着陆事件
    'MovementModeChangedDelegate' : ['int64', 0x0378], // 移动模式变更事件
    'OnCharacterMovementUpdated' : ['int64', 0x0388], // 角色移动更新事件

    // --- 根运动（Root Motion）---
    'SavedRootMotion' : ['int32', 0x0398], // 保存的根运动数据（FRootMotionSourceGroup）
    'ClientRootMotionParams' : ['int32', 0x03D0], // 客户端根运动参数
    'RootMotionRepMoves' : ['int64', 0x0410], // 模拟根运动的复制移动（TArray）
    'RepRootMotion' : ['int32', 0x0420], // 复制的根运动蒙太奇（FRepRootMotionMontage）
};



var ADH_PlayerState = {
    // ==================================================================
    // === ADH_PlayerState (0x0000 -> 0x06C8) 继承自 APlayerState
    // ==================================================================

    'GhostTime' : ['float', 0x0320], // 幽灵状态持续时间
    'BrigTime' : ['float', 0x0324],   // 监狱时间
    'InactiveTime' : ['float', 0x0328], // 不活跃时间

    'MatchStats' : ['int64', 0x0330], // TArray<FPlayerMatchStat> 比赛统计
    'ScoreboardDataAsset' : ['int64', 0x0340], // UDH_ScoreboardDataAsset* 记分板数据
    'VictimIDs' : ['int64', 0x0348], // 受害者ID列表（FUniqueNetIdRepl）
    'KillerID' : ['int32', 0x0358],   // 凶手ID（FUniqueNetIdRepl 结构起始）
    'CauseOfDeath' : ['int64', 0x0380], // 死亡原因伤害类型
    'MaxConcurrentTotems' : ['int32', 0x0388], // 最大同时图腾数

    'SpellTierLevels' : ['int64', 0x0390], // TMap<ETotemSpellTiers, float> 法术等级

    'bForceThrall' : ['int8', 0x03E0], // 是否强制为奴隶
    'bForceSurvivor' : ['int8', 0x03E1], // 是否强制为幸存者

    'ActiveCraftingProject' : ['int64', 0x03E8], // 当前制作项目
    'bHasDied' : ['int8', 0x03F0], // 是否已死亡
    'bAddedStartingInventory' : ['int8', 0x03F1], // 是否已添加初始物品

    'OnThrallChangedDelegate' : ['int64', 0x03F8], // 奴隶状态变更事件
    'OnDeadChangedDelegate' : ['int64', 0x0408], // 死亡状态变更事件
    'OnDeathCountChangedDelegate' : ['int64', 0x0418], // 死亡计数变更事件
    'OnSelectedRoleChangedDelegate' : ['int64', 0x0428], // 角色选择变更事件

    'HungerValueOnDeath' : ['float', 0x0438], // 死亡时的饥饿值

    'Trinkets' : ['int64', 0x0440], // 小饰品列表 TArray<FTrinket>
    'bEatsMeat' : ['int8', 0x0450], // 是否吃肉

    'QuestNoteClass' : ['int64', 0x0458], // 任务笔记类引用
    'bSpawnedQuestNote' : ['int8', 0x0460], // 是否已生成任务笔记

    'TrinketChanceIncrease' : ['float', 0x0464], // 小饰品掉落几率增长
    'TrinketChanceInitial' : ['float', 0x0468], // 初始小饰品几率

    'ArmoryCodeClass' : ['int64', 0x0470], // 武器库代码类
    'QuestState' : ['int64', 0x0478], // 当前任务状态
    'SpellManagerClass' : ['int64', 0x0480], // 法术管理器类
    'SpellManager' : ['int64', 0x0488], // 法术管理器实例
    'KnownArmoryCodes' : ['int64', 0x0490], // 已知武器库代码
    'ReceivedArmoryCodeSound' : ['int64', 0x04A0], // 收到代码音效
    'ReceivedArmoryCodeImage' : ['int64', 0x04A8], // 收到代码图像
    'ProgressData' : ['int32', 0x04B0], // FDH_XPProgressData 起始偏移

    'HushedSoundMix' : ['int64', 0x04C0], // TMap<EPlayerTeam, USoundMix*> 被静音时的混响
    'HushedReverbEffect' : ['int64', 0x0510], // TMap<EPlayerTeam, UReverbEffect*> 回声效果

    'CraftedRecipes' : ['int64', 0x0560], // 已制作的配方记录
    'bIsDead' : ['int8', 0x0570], // 是否已死亡（状态）
    'bIsDisconnected' : ['int8', 0x0571], // 是否断开连接
    'bIsThrall' : ['int8', 0x0572], // 是否为奴隶

    'OtherThralls' : ['int64', 0x0578], // 其他奴隶列表
    'CannibalLevel' : ['float', 0x0588], // 食人族等级
    'PreviousCannibalLevel' : ['float', 0x058C], // 上一次食人族等级

    'SelectedRole' : ['int64', 0x0590], // 当前选择的角色数据
    'PrestigeLevel' : ['int32', 0x0598], // 威望等级
    'PrestigeLevels' : ['int64', 0x05A0], // TMap<EPlayerTeamRole, int> 各角色威望等级

    'EquippedCosmeticItems' : ['int64', 0x05F0], // 装备的外观物品
    'EquippedTalismans' : ['int64', 0x0600], // 装备的护身符
    'Auth_Experience' : ['int32', 0x0610], // 认证经验
    'Auth_Rank' : ['int32', 0x0614], // 认证等级
    'CurrentTrinketChance' : ['float', 0x0618], // 当前小饰品几率

    'OwnedTotems' : ['int64', 0x0620], // 拥有的图腾
    'DeathCount' : ['int32', 0x0630], // 死亡次数

    'RealPawn' : ['int64', 0x0638], // 真实的 Pawn（用于幽灵/复活等）
    'bEligibleForQuests' : ['int8', 0x0640], // 是否有资格接任务
    'bWonPokerGame' : ['int8', 0x0641], // 是否赢过扑克游戏
    'bLocallyMuted' : ['int8', 0x0642], // 是否本地静音
    'bIsHushed' : ['int8', 0x0643], // 是否被静音（Hushed）
    'bIsTutorialPlayer' : ['int8', 0x0644], // 是否为教程玩家
    'bIsLobbyPlayer' : ['int8', 0x0645], // 是否为大厅玩家
    'bMutedGhost' : ['int8', 0x0646], // 幽灵是否被静音
    'bJoinedGhostVoiceChat' : ['int8', 0x0647], // 是否加入幽灵语音
    'bGloballyMuted' : ['int8', 0x0648], // 是否全局静音
    'bSpawnedTrinket' : ['int8', 0x0649], // 是否已生成小饰品

    'PoisonedItemUIDs' : ['int64', 0x0650], // 被下毒的物品UID列表

    'bReceivedOtherThralls' : ['int8', 0x0660], // 是否已接收其他奴隶列表

    'SuspectedCheats' : ['int64', 0x0668], // TMap<FString, int> 疑似作弊行为计数
    'bAssumedCheater' : ['int8', 0x06B8], // 是否被认定为作弊者
    'CheaterCertaintyPct' : ['float', 0x06BC], // 作弊确定性百分比
    'SaveInventorySlots' : ['int32', 0x06C0], // 背包容量
    'bEligibleForSurvivalist' : ['int8', 0x06C4], // 是否有资格获得“生存者”成就
    'bEligibleForPassiveAggressive' : ['int8', 0x06C5], // 是否有资格获得“被动攻击”成就

    // ==================================================================
    // === APlayerState (0x0000 -> 0x0320) 继承自 AInfo
    // ==================================================================

    'Score' : ['float', 0x0220], // 玩家分数
    'PlayerId' : ['int32', 0x0224], // 玩家ID
    'Ping' : ['int8', 0x0228], // 当前Ping值（压缩）
    'CurPingBucket' : ['int8', 0x0229], // 当前Ping区间
    'bShouldUpdateReplicatedPing' : ['bitfield', 0x022A, 0], // 是否需更新Ping
    'bIsSpectator' : ['bitfield', 0x022A, 1], // 是否为观察者
    'bOnlySpectator' : ['bitfield', 0x022A, 2], // 是否仅为观察者
    'bIsABot' : ['bitfield', 0x022A, 3], // 是否为机器人
    'bHasBeenWelcomed' : ['bitfield', 0x022A, 4], // 是否已欢迎
    'bIsInactive' : ['bitfield', 0x022A, 5], // 是否不活跃
    'bFromPreviousLevel' : ['bitfield', 0x022A, 6], // 是否来自上一关卡
    'bUseCustomPlayerNames' : ['bitfield', 0x022A, 7], // 是否使用自定义名字

    'StartTime' : ['int32', 0x022C], // 开始时间（秒）
    'EngineMessageClass' : ['int64', 0x0230], // 消息类（ULocalMessage）
    'ExactPing' : ['float', 0x0238], // 精确Ping
    'ExactPingV2' : ['float', 0x023C], // 精确Ping V2

    'SavedNetworkAddress' : ['int32', 0x0240], // FString 保存的网络地址
    'UniqueId' : ['int32', 0x0250], // FUniqueNetIdRepl 唯一ID（结构体）
    'SessionName' : ['int32', 0x0278], // FName 会话名

    'PawnPrivate' : ['int64', 0x0280], // APawn* 当前控制的Pawn（关键！）
    'PingBucket' : ['int32', 0x0288], // PingAvgData[4] Ping区间数据
    'PingBucketV2' : ['int32', 0x0298], // PingAvgDataV2[4] 新版Ping数据
    'CurPingBucketTimestamp' : ['float', 0x02F8], // 当前Ping区间时间戳

    'PlayerNamePrivate' : ['int32', 0x0300], // FString 玩家名称（私有）
    'OldNamePrivate' : ['int32', 0x0310], // FString 旧名称
};


var ADH_PlayerController = {
    // ==================================================================
    // === ADH_PlayerController (0x0000 -> 0x07E0) 继承自 ADH_PlayerControllerBase
    // ==================================================================

    'LastCorpse' : ['int64', 0x0580], // TWeakObjectPtr<APawn> 最后一具尸体
    'ControlledHuman' : ['int64', 0x0588], // ADH_HumanCharacter* 当前控制的人类角色
    'CraftingPlacementRange' : ['float', 0x0590], // 制作放置范围

    'OnHotbarSelectedIndexChangedDelegate' : ['int64', 0x0598], // 热键栏选择变更事件
    'OnControlledHumanChangedDelegate' : ['int64', 0x05A8], // 控制角色变更事件
    'OnDHPlayerStateChangedDelegate' : ['int64', 0x05B8], // 玩家状态变更事件
    'OnDHGameStateChangedDelegate' : ['int64', 0x05C8], // 游戏状态变更事件
    'OnWinningHandReceivedDelegate' : ['int64', 0x05D8], // 赢牌事件
    'OnHoldDelegate' : ['int64', 0x05E8], // 持有事件
    'OnCheatManagerChanged' : ['int64', 0x05F8], // 外挂管理器变更事件

    'SpellTargetChangedSound' : ['int64', 0x0608], // 法术目标变更音效
    'SpellTargetingParticle' : ['int64', 0x0610], // 法术瞄准粒子
    'ThrallVisionEnterSound' : ['int64', 0x0618], // 奴隶视觉进入音效
    'ThrallVisionExitSound' : ['int64', 0x0620], // 退出音效
    'ThrallVisionFailedSound' : ['int64', 0x0628], // 失败音效
    'PostProcessMaterial' : ['int64', 0x0630], // 后处理材质
    'PostProcessMID' : ['int64', 0x0638], // 动态材质实例
    'BufferTransferComponent' : ['int64', 0x0640], // 缓冲传输组件

    'ThrallVisionAlpha' : ['float', 0x0648], // 奴隶视觉透明度
    'LastThrallVisionTime' : ['float', 0x064C], // 上次使用奴隶视觉时间

    'bForceAllowAchievements' : ['int8', 0x0650], // 强制允许成就
    'bAllowAllCosmetics' : ['int8', 0x0651], // 允许所有外观

    'DHPlayerState' : ['int64', 0x0658], // ADH_PlayerState* 玩家状态（关键！）
    'DHGameState' : ['int64', 0x0660], // ADH_GameState* 游戏全局状态

    'MouseDragModifiersComponent' : ['int64', 0x0668], // 鼠标拖拽修饰组件
    'GroundCraftingProjectComponent' : ['int64', 0x0670], // 地面制作组件
    'SuicideComponent' : ['int64', 0x0678], // 自杀组件
    'InteractComponent' : ['int64', 0x0680], // 交互组件
    'LootInterfaceComponent' : ['int64', 0x0688], // 拾取交易组件

    'TutorialManager' : ['int64', 0x0690], // TWeakObjectPtr<ADH_TutorialManager>
    'CurrentSpellCasting' : ['int64', 0x0698], // 当前施放的法术类
    'bShowUI' : ['int8', 0x06A0], // 是否显示UI
    'HotbarSelectedIndex' : ['int32', 0x06A4], // 热键栏选中索引
    'bCursorWasVisible' : ['int8', 0x06A8], // 光标之前是否可见

    'CurrentSpiritWalkPPAlpha' : ['float', 0x06AC], // 灵体行走后处理透明度
    'CurrentSpiritWalkBlurAlpha' : ['float', 0x06B0], // 灵体行走模糊透明度
    'bShowEnemySilhouettes' : ['int8', 0x06B4], // 是否显示敌人轮廓
    'LastShipYawDirection' : ['int8', 0x06B5], // 上次船体偏航方向
    'bLastWantedToSprint' : ['int8', 0x06B6], // 上次是否想冲刺

    'CurrentCraftingComponent' : ['int64', 0x06B8], // 当前制作组件
    'CurrentCastingTarget' : ['int64', 0x06C0], // 当前法术施放目标
    'RestartPlayerTimerHandle' : ['int64', 0x06C8], // 重启玩家计时器句柄

    'IgnoreLookInputSuppressors' : ['int64', 0x06D0], // 忽略视角输入抑制器列表
    'bShowHotbar' : ['int8', 0x06E0], // 是否显示热键栏
    'bSelectingSpell' : ['int8', 0x06E1], // 是否正在选择法术
    'ShipThrottle' : ['float', 0x06E4], // 船只油门
    'bShipBoosting' : ['int8', 0x06E8], // 是否正在加速
    'bUsingThrallVision' : ['int8', 0x06E9], // 是否正在使用奴隶视觉
    'bDesiresThrallVision' : ['int8', 0x06EA], // 是否想要使用奴隶视觉
    'LastUsedThrallVisionTime' : ['float', 0x06EC], // 上次使用时间
    'ThrallVisionAmbience' : ['int64', 0x06F0], // 奴隶视觉环境音
    'SpellTargetingParticleComponent' : ['int64', 0x06F8], // 法术瞄准粒子组件
    'RevealedActors' : ['int64', 0x0700], // 被揭示的Actor列表（TArray）

    'PendingAchievements' : ['int64', 0x0710], // 待提交成就 TMap<FName, FAchievementProgress>
    'bInitializedAchievements' : ['int8', 0x0760], // 成就是否已初始化

    'ShowOnlyComponentIDs' : ['int64', 0x0768], // TSet<FPrimitiveComponentId> 仅显示组件

    'bCosmeticsEquippedFromSave' : ['int8', 0x07B8], // 外观是否从存档加载
    'bSpellsEquippedFromSave' : ['int8', 0x07B9], // 法术是否从存档加载
    'bTalismansEquippedFromSave' : ['int8', 0x07BA], // 护身符是否从存档加载

    'PlayerAvatarClass' : ['int64', 0x07C0], // 玩家头像类
    'PlayerAvatar' : ['int64', 0x07C8], // 玩家头像实例
    'ShipAvatarClass' : ['int64', 0x07D0], // 船只头像类
    'ShipAvatar' : ['int64', 0x07D8], // 船只头像实例

    // ==================================================================
    // APlayerController字段（0x0000 -> 0x06C8）
    // ==================================================================
    // （已包含在之前的定义中，此处可合并或保持独立）
    'Player' : ['int64', 0x0298], // UPlayer* 指向关联的 UPlayer 对象，包含输入设备、玩家设置等
    'AcknowledgedPawn' : ['int64', 0x02A0], // APawn* 当前已确认控制的 Pawn（服务器同步状态）
    'ControllingDirTrackInst' : ['int64', 0x02A8], // void* UInterpTrackInstDirector* 过场动画导演轨道实例
    'MyHUD' : ['int64', 0x02B0], // AHUD* 当前 HUD 界面，用于渲染 UI 元素
    'PlayerCameraManager' : ['int64', 0x02B8], // APlayerCameraManager* 摄像机管理器，控制视角与镜头效果
    'PlayerCameraManagerClass' : ['int64', 0x02C0], // TSubclassOf<APlayerCameraManager> 摄像机类（蓝图类），用于初始化
    'bAutoManageActiveCameraTarget' : ['bool', 0x02C8], // bool 是否自动管理摄像机目标（如自动跟随 Pawn）
    'TargetViewRotation' : ['FRotator', 0x02CC], // FRotator 目标视角旋转（用于平滑插值）
    'BlendedTargetViewRotation' : ['FRotator', 0x02D8], // FRotator 当前混合后的视角旋转
    'SmoothTargetViewRotationSpeed' : ['float', 0x02E4], // float 平滑旋转到目标视角的速度
    'LocalPlayerCachedLODDistanceFactor' : ['float', 0x02E8], // float 本地玩家 LOD 距离因子缓存
    'HiddenActors' : ['TArray', 0x02F0], // TArray<AActor*> 被此控制器隐藏的 Actor 列表
    'HiddenPrimitiveComponents' : ['TArray', 0x0300], // TArray<UPrimitiveComponent*> 被隐藏的 Primitive 组件列表
    'bRenderPrimitiveComponents' : ['bool', 0x0310], // bool 是否渲染 Primitive 组件（调试用途）
    'LastSpectatorStateSynchTime' : ['float', 0x0314], // float 上次旁观者状态同步时间
    'LastSpectatorSyncLocation' : ['FVector', 0x0318], // FVector 上次同步的旁观者位置
    'LastSpectatorSyncRotation' : ['FRotator', 0x0324], // FRotator 上次同步的旁观者旋转
    'ClientCap' : ['int', 0x0330], // int 客户端能力标志
    'CheatManager' : ['int64', 0x0338], // UCheatManager* 作弊管理器实例
    'CheatClass' : ['int64', 0x0340], // TSubclassOf<UCheatManager> 作弊管理器类（蓝图类）
    'PlayerInput' : ['int64', 0x0348], // UPlayerInput* 玩家输入对象，处理按键、鼠标、手柄绑定
    'ActiveForceFeedbackEffects' : ['TArray', 0x0350], // TArray<FActiveForceFeedbackEffect> 激活的力反馈效果
    'DynamicForceFeedbacks' : ['TSortedMap', 0x0360], // TSortedMap<uint64, FDynamicForceFeedbackAction> 动态力反馈映射
    'LatentDynamicForceFeedbacks' : ['TSortedMap', 0x0370], // TSortedMap<int, FDynamicForceFeedbackDetails*> 延迟动态力反馈
    'ActiveHapticEffect_Left' : ['TSharedPtr', 0x0380], // TSharedPtr<FActiveHapticFeedbackEffect> 左手触觉反馈
    'ActiveHapticEffect_Right' : ['TSharedPtr', 0x0390], // TSharedPtr<FActiveHapticFeedbackEffect> 右手触觉反馈
    'ActiveHapticEffect_Gun' : ['TSharedPtr', 0x03A0], // TSharedPtr<FActiveHapticFeedbackEffect> 枪械触觉反馈
    'ForceFeedbackValues' : ['FForceFeedbackValues', 0x03B0], // FForceFeedbackValues 当前力反馈值集合
    'PendingMapChangeLevelNames' : ['TArray', 0x03C0], // TArray<FName> 待切换的地图关卡名称列表
    'bShortConnectTimeOut' : ['bool', 0x03D0], // bool :1 是否使用短连接超时
    'bCinematicMode' : ['bool', 0x03D0], // bool :1 是否处于过场动画模式
    'bHidePawnInCinematicMode' : ['bool', 0x03D0], // bool :1 过场动画模式下是否隐藏 Pawn
    'bIsUsingStreamingVolumes' : ['bool', 0x03D0], // bool :1 是否使用流送体积
    'bPlayerIsWaiting' : ['bool', 0x03D0], // bool :1 玩家是否处于等待状态
    'NetPlayerIndex' : ['byte', 0x03D4], // uint8 网络玩家索引
    'MuteList' : ['FPlayerMuteList', 0x03D8], // FPlayerMuteList 玩家静音列表
    'PendingSwapConnection' : ['int64', 0x0410], // UNetConnection* 待交换的网络连接
    'NetConnection' : ['int64', 0x0418], // UNetConnection* 当前网络连接
    'RotationInput' : ['FRotator', 0x0420], // FRotator 旋转输入（来自鼠标/手柄）
    'InputYawScale' : ['float', 0x042C], // float Yaw（偏航）输入缩放系数
    'InputPitchScale' : ['float', 0x0430], // float Pitch（俯仰）输入缩放系数
    'InputRollScale' : ['float', 0x0434], // float Roll（翻滚）输入缩放系数
    'bShowMouseCursor' : ['bool', 0x0438], // bool :1 是否显示鼠标光标
    'bEnableClickEvents' : ['bool', 0x0438], // bool :1 是否启用点击事件
    'bEnableTouchEvents' : ['bool', 0x0438], // bool :1 是否启用触摸事件
    'bEnableMouseOverEvents' : ['bool', 0x0438], // bool :1 是否启用鼠标悬停事件
    'bEnableTouchOverEvents' : ['bool', 0x0438], // bool :1 是否启用触摸悬停事件
    'bForceFeedbackEnabled' : ['bool', 0x0438], // bool :1 是否启用力反馈
    'ForceFeedbackScale' : ['float', 0x043C], // float 力反馈整体缩放
    'ClickEventKeys' : ['TArray', 0x0440], // TArray<FKey> 触发点击事件的按键列表
    'DefaultMouseCursor' : ['byte', 0x0450], // EMouseCursor::Type 默认鼠标光标样式
    'CurrentMouseCursor' : ['byte', 0x0451], // EMouseCursor::Type 当前鼠标光标样式
    'DefaultClickTraceChannel' : ['byte', 0x0452], // ECollisionChannel 默认点击射线检测通道
    'CurrentClickTraceChannel' : ['byte', 0x0453], // ECollisionChannel 当前点击射线检测通道
    'HitResultTraceDistance' : ['float', 0x0454], // float 点击事件射线检测距离
    'SeamlessTravelCount' : ['word', 0x0458], // uint16 无缝旅行计数
    'LastCompletedSeamlessTravelCount' : ['word', 0x045A], // uint16 上次完成的无缝旅行计数
    'CurrentClickablePrimitive' : ['int64', 0x045C], // TWeakObjectPtr<UPrimitiveComponent> 当前可点击的组件
    'CurrentTouchablePrimitives' : ['int64[11]', 0x0464], // TWeakObjectPtr<UPrimitiveComponent>[11] 当前可触摸的组件数组
    'CurrentInputStack' : ['TArray', 0x04C0], // TArray<UInputComponent*> 当前输入栈（用于输入优先级）
    'InactiveStateInputComponent' : ['int64', 0x04D0], // UInputComponent* 非激活状态输入组件
    'bCinemaDisableInputMove' : ['bool', 0x04D8], // bool :1 过场动画中禁用移动输入
    'bCinemaDisableInputLook' : ['bool', 0x04D8], // bool :1 过场动画中禁用视角输入
    'bShouldPerformFullTickWhenPaused' : ['bool', 0x04D8], // bool :1 暂停时是否应完整 Tick
    'bInputEnabled' : ['bool', 0x04D8], // bool :1 输入是否启用
    'VirtualJoystick' : ['TSharedPtr', 0x04E0], // TSharedPtr<SVirtualJoystick> 虚拟摇杆（移动端）
    'CurrentTouchInterface' : ['int64', 0x04F0], // UTouchInterface* 当前触摸接口
    'TimerHandle_UnFreeze' : ['FTimerHandle', 0x04F8], // FTimerHandle 解冻定时器句柄
    'TimerHandle_DelayedPrepareMapChange' : ['FTimerHandle', 0x0500], // FTimerHandle 延迟准备地图切换定时器
    'TimerHandle_ClientCommitMapChange' : ['FTimerHandle', 0x0508], // FTimerHandle 客户端提交地图切换定时器
    'bOverrideAudioListener' : ['bool', 0x0510], // bool :1 是否覆盖音频监听器位置
    'bOverrideAudioAttenuationListener' : ['bool', 0x0510], // bool :1 是否覆盖音频衰减监听器
    'AudioListenerComponent' : ['int64', 0x0514], // TWeakObjectPtr<USceneComponent> 音频监听器组件
    'AudioListenerAttenuationComponent' : ['int64', 0x051C], // TWeakObjectPtr<USceneComponent> 音频衰减监听器组件
    'AudioListenerLocationOverride' : ['FVector', 0x0524], // FVector 音频监听器位置覆盖
    'AudioListenerRotationOverride' : ['FRotator', 0x0530], // FRotator 音频监听器旋转覆盖
    'AudioListenerAttenuationOverride' : ['FVector', 0x053C], // FVector 音频监听器衰减覆盖
    'SpectatorPawn' : ['int64', 0x0548], // ASpectatorPawn* 旁观者 Pawn（用于自由视角）
    'LastRetryPlayerTime' : ['float', 0x0550], // float 上次重试加入游戏时间
    'bIsLocalPlayerController' : ['bool', 0x0554], // bool 是否为本地玩家控制器
    'SpawnLocation' : ['FVector', 0x0558], // FVector 玩家生成位置
    'LastMovementUpdateTime' : ['float', 0x0564], // float 上次移动更新时间
    'LastMovementHitch' : ['float', 0x0568], // float 上次移动卡顿时间
    'bDisableHaptics' : ['bool', 0x056C]  // bool :1 是否禁用触觉反馈   
};

var ADH_Warship = {
// ==================================================================
// === ADH_Warship (0x0000 -> 0x0550) 战舰核心逻辑类
// 继承自 AActor
// 功能：管理大型可交互船只的完整行为，包括物理、结构、音频、推进、内部系统和游戏进度。
// ==================================================================
    // --- 船体结构与分区 ---
    'Sections' : ['TMap', 0x0220], // TMap<EShipSpacePartition, FShipSectionData> 定义战舰不同区域（如船头、船尾、内部）的数据
    'CurrentViewSection' : ['byte', 0x0490], // EShipSpacePartition 当前玩家视角所在的船体分区

    // --- 船体完整性与损伤 ---
    'CurrentHullIntegrity' : ['float', 0x02A0], // float 当前船体完整度 (0.0 - 1.0)
    'InitialHullIntegrityPct' : ['float', 0x02A4], // float 初始船体完整度百分比
    'MaximumHullIntegrity' : ['float', 0x02A8], // float 船体完整度最大值
    'MinimumHullIntegrity' : ['float', 0x02AC], // float 船体完整度最小值（可能为0）
    'MaxHullBreaches' : ['int', 0x0274], // int 允许存在的最大船体破洞数量
    'HullBreachesFromLastDamage' : ['int', 0x0278], // int 上次受到伤害后新增的破洞数
    'HullBreachPerDamage' : ['float', 0x027C], // float 每单位伤害产生破洞的概率或数量
    'HullDamagePerBreach' : ['float', 0x047C], // float 每个破洞持续造成的伤害值
    'HullBreachPerDamage' : ['float', 0x027C], // float 每单位伤害产生破洞的概率或数量
    'HullBreaches' : ['TArray', 0x0280], // TArray<FHullBreachData> 当前所有船体破洞的数据列表
    'TotalBreachCount' : ['int', 0x03D4], // int 历史累计破洞总数
    'LastHullDamageTime' : ['float', 0x0474], // float 上次受到船体伤害的时间（游戏时间）
    'LastHullIntegrity' : ['float', 0x0478], // float 上次记录的船体完整度

    // --- 帆索与物理 ---
    'Rigging' : ['TArray', 0x0290], // TArray<FRiggingData> 帆索系统数据列表
    'bSailsOut' : ['bool', 0x0272], // bool 帆是否已扬起
    'BuoyancyComponent' : ['int64', 0x02C8], // UDH_BuoyancyComponent* 浮力组件，管理船只在水中的浮沉
    'MinimumBuoyancy' : ['float', 0x02D0], // float 最小浮力值
    'TestPointBuoyancyModifiers' : ['TMap', 0x0498], // TMap<int, float> 测试点浮力修正系数映射

    // --- 推进与移动 ---
    'Thruster' : ['int64', 0x03E8], // UPhysicsThrusterComponent* 主推进器组件
    'BowThruster' : ['int64', 0x03F0], // UPhysicsThrusterComponent* 船首侧推器组件
    'CurrentThrusterStrength' : ['float', 0x03B4], // float 当前推进器推力强度
    'MaxThrusterStrength' : ['float', 0x0404], // float 最大推进器推力
    'BowThrusterStrengthScale' : ['float', 0x0408], // float 船首侧推器推力缩放系数
    'DecelerationSpeed' : ['float', 0x040C], // float 减速速率
    'AccelerationSpeed' : ['float', 0x0410], // float 加速速率
    'MaxThrusterAngle' : ['float', 0x0414], // float 推进器最大偏转角度
    'MaxThrusterRotationSpeed' : ['float', 0x0418], // float 推进器最大旋转速度
    'ThrusterReturnRotationSpeed' : ['float', 0x041C], // float 推进器回正速度
    'MaxReverseThrottle' : ['float', 0x0420], // float 最大倒车推力
    'MaxSpeed' : ['float', 0x0424], // float 最大航行速度
    'bForceAutoMove' : ['bool', 0x0271], // bool 强制自动移动（忽略玩家输入）
    'bAutoMove' : ['bool', 0x0493], // bool 是否处于自动移动模式
    'bForceAllowThrust' : ['bool', 0x03E4], // bool 强制允许推进（绕过某些限制）
    'bOverrideThrusterYaw' : ['bool', 0x0400], // bool 是否覆盖推进器偏航
    'ThrusterYawOverride' : ['float', 0x03FC], // float 推进器偏航覆盖角度
    'YawDirection' : ['char', 0x03F8], // char 偏航方向 (-1=左, 0=中, 1=右)

    // --- 内部系统与组件 ---
    'InteriorVolume' : ['int64', 0x02C0], // TWeakObjectPtr<ADH_WarshipInteriorVolume> 战舰内部体积（弱引用），用于定义内部空间和规则
    'Helm' : ['int64', 0x02D8], // UChildActorComponent* 船舵组件（子Actor）
    'Boiler' : ['int64', 0x02E0], // ADH_WarshipBoiler* 锅炉实例
    'ArmoryDoor' : ['int64', 0x0338], // ADH_ArmoryDoor* 武器库门实例
    'BoilerClass' : ['int64', 0x0340], // TSubclassOf<ADH_WarshipBoiler> 锅炉蓝图类
    'BoilerSocketName' : ['FName', 0x0348], // FName 锅炉挂载的骨骼插槽名称
    'BoilerVentClass' : ['int64', 0x0350], // TSubclassOf<ADH_WarshipBoiler_Vent> 锅炉排气口蓝图类
    'BoilerVentSocketName' : ['FName', 0x0358], // FName 锅炉排气口挂载的骨骼插槽名称
    'ArmoryLootSpawns' : ['TMap', 0x02E8], // TMap<FName, TSubclassOf<AActor>> 武器库 loot 生成点映射

    // --- 网格体与视觉 ---
    'PokerTableMesh' : ['int64', 0x0360], // UStaticMeshComponent* 扑克桌静态网格体
    'ShipMesh' : ['int64', 0x0368], // UStaticMeshComponent* 战舰主体网格体
    'PhysicsMesh' : ['int64', 0x0370], // UStaticMeshComponent* 物理碰撞网格体
    'FloodMesh' : ['int64', 0x0378], // UDH_FluidSurfaceComponent* 洪水/液体表面组件
    'MaxFloodMeshZ' : ['float', 0x0380], // float 洪水网格体允许的最大Z高度
    'EquippedCosmeticItems' : ['TArray', 0x0440], // TArray<FEquippedShipCosmetics> 当前装备的船体装饰物品
    'PreviouslyEquippedCosmeticItems' : ['TArray', 0x0450], // TArray<FEquippedShipCosmetics> 上次装备的船体装饰物品（用于切换）
    'ApplyCosmeticsTimerHandle' : ['FTimerHandle', 0x0460], // FTimerHandle 应用装饰物品的定时器句柄

    // --- 音频组件 ---
    'MovementAudioComponent' : ['int64', 0x0388], // UAudioComponent* 移动音效组件（引擎声、水流声）
    'AmbienceAudioComponent' : ['int64', 0x0390], // UAudioComponent* 环境音效组件
    'HullDamageAudioComponent' : ['int64', 0x0398], // UAudioComponent* 船体损伤音效组件
    'PartyAmbientSound' : ['int64', 0x03A0], // UAudioComponent* 派对环境音效
    'FloodWaterDrainSound' : ['int64', 0x0430], // USoundBase* 排水音效资源
    'FloodWaterDrainSoundComponent' : ['int64', 0x0468], // TWeakObjectPtr<UAudioComponent> 排水音效组件（弱引用）
    'NewPrisonerSound' : ['int64', 0x03A8], // USoundBase* 新囚犯加入音效
    'AmbienceExteriorBlendDistance' : ['float', 0x03B0], // float 环境外部混合距离
    'AmbienceExteriorBlendDistanceSq' : ['float', 0x0470], // float 环境外部混合距离的平方（用于优化计算）

    // --- 伤害与碰撞 ---
    'MaximumImpactDamage' : ['float', 0x02B0], // float 最大撞击伤害
    'ImpactDamageAngle' : ['float', 0x02B4], // float 造成撞击伤害的角度阈值
    'ImpactDamageType' : ['int64', 0x02B8], // TSubclassOf<UDamageType> 撞击伤害类型
    'LastImpactDamageTime' : ['float', 0x0480], // float 上次造成撞击伤害的时间
    'bHasHitIceberg' : ['bool', 0x03E5], // bool 是否已撞击过冰山
    'AlreadyDamagedIcebergs' : ['TSet', 0x04E8], // TSet<ADH_Iceberg*> 已经对其造成过伤害的冰山集合（防重复伤害）

    // --- 位置与运动记录 ---
    'SpawnLocation' : ['FVector', 0x03BC], // FVector 战舰生成时的位置
    'LastLocation' : ['FVector', 0x03C8], // FVector 上一帧的位置，用于计算移动
    'DistSinceLastMeter' : ['float', 0x03DC], // float 自上次计费/计分以来行驶的距离
    'DistanceHelmed' : ['float', 0x03E0], // float 总共驾驶的距离
    'LocationSmoothRate' : ['float', 0x0428], // float 位置平滑插值速率
    'RotationSmoothRate' : ['float', 0x042C], // float 旋转平滑插值速率

    // --- 游戏状态与进度 ---
    'bArrived' : ['bool', 0x03B8], // bool 是否已到达目的地
    'bSpawnedAllChildActors' : ['bool', 0x03B9], // bool 是否已生成所有子Actor
    'bDetachedGangways' : ['bool', 0x03BA], // bool 是否已断开舷梯
    'LowestHealthPct' : ['float', 0x03D8], // float 游戏过程中记录的最低船体完整度百分比
    'DefaultWarship' : ['int64', 0x0488], // ADH_Warship* 默认战舰实例（可能用于数据参考）
    'bHasSunk' : ['bool', 0x0491], // bool 战舰是否已沉没
    'bIsEscaping' : ['bool', 0x0492], // bool 是否处于逃离模式
    'CachedShipProgress' : ['float', 0x0538], // float 缓存的船只进度（0.0-1.0）
    'DistanceFromStart' : ['float', 0x053C], // float 从起点出发的距离
    'LastScoredDrivingTime' : ['float', 0x0540], // float 上次计算驾驶得分的时间
    'MovementSpeedModifier' : ['float', 0x0544], // float 移动速度修正系数
    'LastBrokePackIceTime' : ['float', 0x0548], // float 上次破开浮冰的时间
    'bEscapeVolumeHit' : ['bool', 0x054C], // bool 是否已进入逃离区域
    'bIsLobbyWarship' : ['bool', 0x054D], // bool 是否是大厅战舰
    'bIsTutorialWarship' : ['bool', 0x054E], // bool 是否是教程战舰

    // --- 调试与特殊 ---
    'bDebugLighting' : ['bool', 0x0270], // bool 调试光照模式
    'FloodDrainRate' : ['float', 0x0438], // float 洪水排出速率
    'TemperatureWhenFlooded' : ['float', 0x043C] // float 洪水涌入时的环境温度
}