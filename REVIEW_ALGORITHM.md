# REVIEW_ALGORITHM

## 1. 算法版本
当前算法版本为：**Review Algorithm v1**。

- v1：当前稳定版本，保持“简单、可解释、有效、可升级”
- v2（未来）：可能加入时间衰减机制
- v3（未来）：可能引入更自适应的复习调度策略

> 当前阶段必须保持 v1 核心逻辑不变。

## 2. 项目目标（算法视角）
- 当前项目已有可用词库管理和基础 Review 功能
- 目标是持续完善 v1 的可用性与稳定性
- 不追求一开始实现 FSRS 或复杂 Anki 算法

## 3. 算法核心思想
- 主动回忆：先展示英文，再判断“记得/不记得”
- 间隔重复（SRS）：根据反馈调整下次复习间隔
- `memoryLevel` 为主轴
- 单词 `level`（A/B/C）只做微调
- `forgetStreak` 表示近期遗忘风险，不因一次记得直接归零

## 4. 字段定义
- `memoryLevel`：范围 `1~5`
- `forgetStreak`：近期遗忘风险
  - 不记得：`+1`
  - 记得：`-1`（最小 `0`）
- `lastReviewedDate`：最近复习日期
- `reviewCount`：总复习次数

## 5. 新单词初始化规则
- `memoryLevel = 1`
- `forgetStreak = 0`
- `reviewCount = 0`
- `lastReviewedDate = null`
- `nextReviewDate = today`

## 6. 复习反馈更新规则
### 6.1 用户点击“记得”
- `memoryLevel = min(memoryLevel + 1, 5)`
- `forgetStreak = max(forgetStreak - 1, 0)`
- `reviewCount += 1`
- `lastReviewedDate = today`
- `nextReviewDate` 根据基础间隔表和 level 系数计算

### 6.2 用户点击“不记得”
- `memoryLevel = 1`
- `forgetStreak += 1`
- `reviewCount += 1`
- `lastReviewedDate = today`
- `nextReviewDate = tomorrow`

## 7. 基础间隔表
- `memoryLevel 1 -> 1天`
- `memoryLevel 2 -> 3天`
- `memoryLevel 3 -> 7天`
- `memoryLevel 4 -> 14天`
- `memoryLevel 5 -> 30天`

## 8. level 系数
- `A -> 0.8`
- `B -> 1.0`
- `C -> 1.2`

说明：
- `memoryLevel` 决定主间隔
- `level` 仅做微调
- A级词不应因“重要”而永久高频推送已熟练词

## 9. 最终间隔计算
- `interval = round(baseInterval × levelFactor)`

## 10. 复习队列生成规则
- 候选池：`nextReviewDate <= today`
- 排序优先级：
  1. `nextReviewDate` 更早优先
  2. `forgetStreak` 更高优先
  3. `level` 优先级 `A > B > C`
  4. 原始顺序
- 每日上限：`20`

## 11. 当前 session 机制
当前已有：
- `reviewSession`
- `queueIds`
- `currentIndex`
- `rememberedCount`
- `forgottenCount`
- `date`

设计目标：稳定、不插队、不混乱。

## 12. 多用户 Web 架构下的数据归属
在 Web 多用户场景下，每个用户拥有独立数据：

```text
User
 ├─ words[]
 ├─ reviewSession
 └─ reviewHistory[]
```

算法计算逻辑保持一致，但计算范围始终限定为“当前用户自己的词库与复习数据”。
即以下字段都基于用户自己的数据计算：
- `memoryLevel`
- `forgetStreak`
- `reviewCount`
- `nextReviewDate`

## 13. 数据结构概念（抽象）
- `User`
- `Words`
- `ReviewSession`
- `ReviewHistory`

## 14. Web 架构概念（抽象）
- `Frontend (React)`
- `Backend API`
- `Database`

## 15. 设计原则总结
- 简单
- 可解释
- 可扩展
- 优先实现有效而不复杂的第一代算法
- 未来可逐步升级，不需要一开始做到 FSRS
