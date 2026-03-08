# English Words MVP

## 1. 项目介绍
这是一个英语学习 app 的 MVP 原型，用于帮助用户记录单词并进行复习。

## 2. 技术栈
- React Native
- Expo
- TypeScript

## 3. 当前功能
- 首页（Today）显示今日复习统计
- 单词库页面（Words）
- 添加单词页面（Add Word）
- 复习页面（Review）

## 4. 单词分级标准（简明版）
- A级：需要深度掌握并能够主动、稳定输出的词汇
- B级：需要较熟练理解，并具备一定主动使用能力的词汇
- C级：以识别和基础理解为主，暂不要求高频主动输出的词汇

## 5. 如何运行项目
```bash
npm run start
npm run web
```

## 6. 项目目录结构说明
```text
english-words-mvp/
├─ App.tsx
├─ package.json
├─ README.md
├─ PROJECT_RULES.md
├─ src/
│  ├─ mock/
│  │  └─ words.ts
│  └─ screens/
│     ├─ TodayScreen.tsx
│     ├─ WordsScreen.tsx
│     ├─ AddWordScreen.tsx
│     └─ ReviewScreen.tsx
└─ assets/
```
