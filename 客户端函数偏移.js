'use strict';
// 客户端函数偏移登记表（RVA：相对 DreadHunger-Win64-Shipping.exe 模块基址，非绝对地址）
// 约定：脚本内一律用 base.add(OFFSET) 使用；base = Module.findBaseAddress('DreadHunger-Win64-Shipping.exe')
// 规则：结构体/属性字段偏移客户端与服务端一致（可用服务端 IDB 核对）；函数偏移两端不同，必须用客户端值。
// 本文件为客户端权威函数偏移来源，新增 Hook 点请先在此登记再引用。

var CLIENT_FN = {
    // ===== 角色 / 生命周期 =====
    'ADH_PlayerState::BeginPlay':                     0xEA3410,
    'ADH_HumanCharacter::BeginPlay':                  0xDF21F0, // 客户端不执行
    'ADH_HumanCharacter::ADH_HumanCharacter':         0xDBDA10, // 构造函数
    'ADH_HumanCharacter::Jump':                       0xDD7710,
    'ADH_HumanCharacter::InitAppearance':             0xDD4E40,
    'ADH_HumanCharacter::SetClimbingState':           0xDE7EA0,
    'ADH_Character::SetClimbingState':                0xDE7BB0,
    'ADH_HumanCharacter::PawnClientRestart':          0xDDF8D0,
    'ADH_HumanCharacter::UpdateSpiritWalking':        0xDF33B0,
    'ADH_HumanCharacter::SetSpiritWalkAppearance':    0xDEB490,
    'ADH_HumanCharacter::PlayVomitEffects':           0xDE3290, // 播放呕吐动画
    'ADH_HumanCharacter::AddStartingInventory':       0xDC1630,
    'ADH_HumanCharacter::SetDeathState':              0xDE8D40,
    'ADH_HumanCharacter::TakeDamage':                 0xDEDD40,
    'ADH_HumanCharacter::SetIsSpiritWalking':         0xDEA100,
    'ADH_HumanCharacter::Died':                       0xDCB0A0, // 子类覆写；与 ADH_Character::Died=0xDCA660 不同（骨刀脚本用此）
    'ADH_HumanCharacter::ModifyStamina':              0xDD83B0, // 无限体力脚本用值（冲突：取消船伤脚本用 0xEE3490，待核）
    'ADH_Character::Died':                            0xDCA660,
    'ADH_Character::IsAlive':                         0xDD6B30,
    'ADH_Character::ConvertToCarcass':                0xDC8900,
    'ADH_BoneDagger::Constructor':                    0xECFC60,

    // ===== 控制器 =====
    'ADH_PlayerController::Jump':                     0xEB5FB0,
    'ADH_PlayerController::HolsterInventory_Simulated': 0xEB2F50, // 收手键输入动作（触发式，仅本地玩家调用）
    'ADH_PlayerController::SetEquippedCosmetics':  0xF5F930, // 客户端RVA（发Server RPC的thunk；帽子轮播脚本用；服务端RVA 0xEE7BC0）

    // ===== PlayerState =====
    'ADH_PlayerState::SetDeathCount':                 0xEC4BA0, // 自定义位置复活脚本曾写 0xEC4BA9（疑似笔误，待核）
    'ADH_PlayerState::SetIsDead':                     0xEC61C0,
    'ADH_PlayerState::SetIsThrall':                   0xEC6300,
    'ADH_PlayerState::SetPlayerRole':                 0xEC6F20,

    // ===== 物品 / 背包 =====
    'ADH_Inventory::GetUseCooldown':                  0xF43270, // 获取使用冷却时间
    'ADH_Inventory::DecreaseItemStack':               0xE3A310,
    'ADH_InventoryPickup::PickUp':                    0xE4EE70,
    'ADH_InventoryPickup::OnPickupMovementStopped':   0xE4C460,
    'UDH_InventoryManager::UseInventory_Simulated':   0xE60180, // 使用普通物品
    'UDH_InventoryManager::AimInventory_Simulated':   0xE32190,
    'UDH_InventoryManager::AddInventory':             0xE30700,
    'UDH_InventoryManager::FindRangedWeapon':         0xE3D520,

    // ===== 武器 =====
    'ADH_Weapon_Melee::BeginSwing':                   0xE6DB40, // 执行近战武器攻击
    'ADH_Weapon_Melee::BeginTrace':                   0xE6DD70, // 挥击存在时间判断

    // ===== 移动 / 网络上报 =====
    'UCharacterMovementComponent::CallServerMovePacked':     0x27A3480, // 上传角色角度（陀螺改写点）
    'UCharacterMovementComponent::ReplicateMoveToServer':    0x27B8190,
    'UCharacterMovementComponent::ControlledCharacterMove':  0x27A8EF0,

    // ===== 相机 =====
    'APlayerController::ServerUpdateCamera':                   0x2EA5B00,
    'APlayerController::ServerUpdateCamera_Implementation':    0x2B73480,

    // ===== 碰撞 =====
    'UPrimitiveComponent::SetCollisionProfileName':   0x2BA77A0,
    'UPrimitiveComponent::GetCollisionProfileName':   0x2B99D60,
    'UMRMeshComponent::SetCollisionProfileName':      0x2BA77A0, // 与 UPrimitiveComponent 同名同址

    // ===== 制作 =====
    'UDH_CraftingComponent::CanCraft':                0xDFED40,
    'UDH_CraftingComponent::Craft':                   0xE02A90,
    'UDH_CraftingRecipeWidget::OnCraftableChanged':   0xFA9450,
    'UDH_CraftingRecipeWidget::Craft':                0xF8F390,

    // ===== UI / 大厅 =====
    'UDH_PlayerContextMenuWidget::UpdateButtonsVisibility': 0x10313A0,
    'UDH_PlayerContextMenuWidget::OnReportButtonClicked':   0x10259F0,
    'UDH_LobbySlotWidget::UpdateAvatarImage':               0x1031060,
    'UDH_LobbySlotWidget::OnPlayerUpdated':                 0x1023C40,
    'UDH_LobbySlotWidget::OnLobbyButtonClicked':            0x10219E0,
    'FDH_RoleIconPreset::ThrallInverted':                   0xFEFE30,
    'UDH_ScoreboardUtility::GetRoleIcon':                   0xFC90C0,
    'UImage::SetBrushResourceObject':                       0x2457F10,
    'UDH_RadialMenuEmotesWidget::CanUseRadial':             0xF8DC10,
    'UDH_GameplayStatics::OpenLobbyMap':                    0xF0CD40,

    // ===== GameMode =====
    'ADH_LobbyGameMode::InitGame':                    0xE7B140,
    'ADH_GameMode::SpawnDefaultPawnAtTransform_Implementation': 0x291C640,
    'AGameModeBase::RestartPlayerAtTransform':        0x2919130,
    'AGameModeBase::RestartPlayerAtPlayerStart':      0x2918DF0,
    'AGameModeBase::FindPlayerStart':                 0x2DE6B00,

    // ===== 引擎基础 =====
    'APawn::SetPlayerState':                          0x2B1FB60,
    'UNetDriver::GetNetMode':                         0x2A5B0E0,
    'FName::GetPlainNameString':                      0x11D7830,
    'FWeakObjectPtr::Get':                            0x13E6CF0,
    'UObject::Serialize':                             0x138C490,
    'UObject::GetWorld':                              0x1380FD0,
    'UClass::GetPrivateStaticClass':                  0x1269CE0,
    'UClass::SerializeDefaultObject':                 0x123CDC0,
    'UClass::CreateDefaultObject':                    0x11EC670, // 骨刀脚本中为注释引用
    'FMemory::Realloc':                               0x10E3990,
    'FName::FName':                                   0x11D04D0,
    'FText::FromName':                                0x110DC20,
    'StaticLoadObject':                               0x13F4CC0,
    'StaticFindObject':                               0x13F44D0,
    'FActorSpawnParameters::FActorSpawnParameters':   0x2D51F50,
    'UWorld::SpawnActor':                             0x29D7340,
    'AActor::SetLifeSpan':                            0x26707C0,
    'UGameplayStatics::GetPlayerController':          0x2906300,
    'APlayerController::TickActor':                   0x2B78A50, // 客户端RVA（本地每帧/游戏线程，帽子轮播节拍源；服务端RVA 0x27AAF20）
};

// ===== 待补偏移（用户标注用途，尚未给客户端地址）=====
// 'ADH_GameState::IsAnyExplorerAlive'        // 判断是否还有探险家存活
// 'UDH_CharacterMovementComponent::SetMovementMode' // 设置移动状态

// ===== 冲突/待核对（同名函数在不同脚本用了不同地址，需以实际为准取一）=====
// ADH_HumanCharacter::ModifyStamina: 0xDD83B0(无限体力) vs 0xEE3490(取消船伤)
// ADH_PlayerState::SetDeathCount:    0xEC4BA0(登记表/多数脚本) vs 0xEC4BA9(自定义位置复活, 疑笔误)

// ===== 未命名 Hook 点（脚本直接 attach/patch 的地址，符号名未确认，故不入 CLIENT_FN 主表）=====
// 0xEBE980  connect_client_win64.js 的 Tick 钩子（游戏线程命令队列执行器）
//           已排除 ADH_PlayerController::Tick（服务端 0x140E52AF0，在 Jump 后 +0x112E0；
//           客户端该地址在 Jump 后仅 +0x89D0，差距过大）；具体符号待客户端 IDA 确认
// 0xE44490  码头无限物资 OFF.craftFunc（制造判定函数, Interceptor.attach）
// 0xEB6002  地图踏空 ADH_IsSwim（允许水中跳跃, attach/patch）
// 0x2DBD4DF 地图踏空 IsFloat（Interceptor.attach, 踏空判定）

// ===== 纯代码 patch / NOP 点位（非函数入口，不入表）=====
// 码头无限物资: diuqi 0xE3B675, zidan 0xE3A3C3, zhizaoConsume 0xE5855C, NoMakeTime 0xE221D6
// 码头拉扯伤害: openDamage 0xDEDDB4, down 0xDCB38A, isCloneedDied 0xDCB556, toDied 0xDCB538
// 举报键标记狼人: targetAddress 0x1031465（UpdateButtonsVisibility 内补丁点）

// ===== 数据/全局偏移（非函数，不入表）=====
// GWorld=0x4C7DB50; 本地玩家链起点=0x4C70908; 默认缩放=0x45003E0;
// FTransform_Identity=0x4559220(注释); 灵体FName=0x4A86FA8 / 默认FName=0x4A86F58(注释)

// ===== 数据偏移（非函数）=====
// 默认 HumanCharacter 缩放比例数据：base + 0x45003E0

module.exports = CLIENT_FN;
