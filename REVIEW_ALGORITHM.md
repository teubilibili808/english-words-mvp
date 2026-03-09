# REVIEW_ALGORITHM

## 1. 项目目标
- 当前项目是一个英语学习 app MVP。
- 当前已经具备可用的词库管理和基础 Review 功能。
- 下一阶段目标是将 Review 升级为更合理的第一代正式复习算法。
- 现阶段不追求一次性实现 FSRS 或复杂 Anki 算法。
- 优先实现“简单、可解释、有效、可升级”的算法。

## 2. 算法核心思想
- 主动回忆：复习时先只展示英文单词，用户先判断“记得/不记得”，再展示词义。
- 间隔重复（SRS）：根据复习反馈调整下次复习时间间隔。
- `memoryLevel` 作为主轴：用于表达单词当前掌握程度，并决定主间隔。
- 单词 `level`（A/B/C）只做微调，不替代掌握度主轴。
- `forgetStreak` 表示近期遗忘风险，不因为一次“记得”就直接归零。

## 3. 新增字段
- `memoryLevel`
  - 表示当前记忆掌握层级，作为间隔计算的主要依据。
- `forgetStreak`
  - 表示近期遗忘风险累计，用于体现“连续忘记”带来的不稳定性。
- `lastReviewedDate`
  - 记录最近一次复习日期。
- `reviewCount`
  - 记录累计复习次数。

## 4. 字段定义
- `memoryLevel`
  - 取值范围：`1 ~ 5`。
- `forgetStreak`
  - 含义：近期遗忘风险。
  - 更新建议：
    - 不记得：`forgetStreak += 1`
    - 记得：`forgetStreak = max(forgetStreak - 1, 0)`
- `lastReviewedDate`
  - 记录最近一次复习日期（如 `YYYY-MM-DD`）。
- `reviewCount`
  - 记录该词累计复习次数。

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
- `nextReviewDate` 根据“基础间隔表 × level 系数”计算

### 6.2 用户点击“不记得”
- `memoryLevel = 1`
- `forgetStreak += 1`
- `reviewCount += 1`
- `lastReviewedDate = today`
- `nextReviewDate = tomorrow`

## 7. 基础间隔表（baseInterval）
- `memoryLevel = 1 -> 1天`
- `memoryLevel = 2 -> 3天`
- `memoryLevel = 3 -> 7天`
- `memoryLevel = 4 -> 14天`
- `memoryLevel = 5 -> 30天`

## 8. level 系数（levelFactor）
- `A -> 0.8`
- `B -> 1.0`
- `C -> 1.2`

说明：
- `memoryLevel` 决定主间隔。
- `level` 只做微调。
- A级词虽然更重要，但当 `memoryLevel` 很高时，间隔仍应明显拉长。
- 不应因为是 A 级词，就始终高频推送已经熟练掌握的词。

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

## 11. 当前项目中的 Session 机制
当前已有复习会话机制，包括：
- `reviewSession`
- `queueIds`
- `currentIndex`
- `rememberedCount`
- `forgottenCount`
- `date`

当前 session 设计目标：
- 稳定：复习中途离开可恢复。
- 不插队：会话开始后队列固定。
- 不混乱：中途新增单词不会打断当前会话，下轮再进入。

## 12. 设计原则总结
- 简单：先用小而清晰的规则保证可落地。
- 可解释：每个字段和每次调度都能说明原因。
- 可扩展：后续可继续细化权重、分层、遗忘模型。
- 第一代目标是“有效而不复杂”。
- 未来可逐步升级，不需要一开始做到 FSRS。
