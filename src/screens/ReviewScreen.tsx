import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WordItem } from '../mock/words';

type ReviewScreenProps = {
  words: WordItem[];
  reviewSession: {
    queueIds: string[];
    currentIndex: number;
    rememberedCount: number;
    forgottenCount: number;
    date: string;
  } | null;
  onEnsureSession: () => void;
  onSubmitReviewResult: (wordId: string, remembered: boolean) => void;
};

type ReviewChoice = 'remembered' | 'forgotten';

export function ReviewScreen({
  words,
  reviewSession,
  onEnsureSession,
  onSubmitReviewResult,
}: ReviewScreenProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentChoice, setCurrentChoice] = useState<ReviewChoice | null>(null);
  const [completedSummary, setCompletedSummary] = useState<{
    total: number;
    remembered: number;
    forgotten: number;
  } | null>(null);

  const clearCurrentChoice = useCallback(() => {
    setShowAnswer(false);
    setCurrentChoice(null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      onEnsureSession();
      clearCurrentChoice();
      setCompletedSummary(null);
    }, [clearCurrentChoice, onEnsureSession])
  );

  const currentWord = useMemo(() => {
    const currentWordId = reviewSession?.queueIds[reviewSession.currentIndex];
    if (!currentWordId) {
      return undefined;
    }
    return words.find((item) => item.id === currentWordId);
  }, [reviewSession, words]);

  const hasQueue = Boolean(reviewSession && reviewSession.queueIds.length > 0);
  const isCompleted = Boolean(completedSummary) && !reviewSession;

  const handlePick = (choice: ReviewChoice) => {
    setCurrentChoice(choice);
    setShowAnswer(true);
  };

  const handleNext = () => {
    if (!currentWord || !currentChoice || !reviewSession) {
      return;
    }

    const remembered = currentChoice === 'remembered';
    const nextRemembered = reviewSession.rememberedCount + (remembered ? 1 : 0);
    const nextForgotten = reviewSession.forgottenCount + (remembered ? 0 : 1);
    const nextIndex = reviewSession.currentIndex + 1;
    const isFinalCard = nextIndex >= reviewSession.queueIds.length;

    if (isFinalCard) {
      setCompletedSummary({
        total: reviewSession.queueIds.length,
        remembered: nextRemembered,
        forgotten: nextForgotten,
      });
    }

    onSubmitReviewResult(currentWord.id, remembered);
    clearCurrentChoice();
  };

  return (
    <View style={styles.container}>
      {!hasQueue ? (
        <View style={styles.card}>
          <Text style={styles.word}>{isCompleted ? '今日复习完成' : '暂无待复习单词'}</Text>
          <Text style={styles.hint}>
            {isCompleted ? '已完成本次队列中的全部单词' : '当前没有 nextReviewDate 到期的词条'}
          </Text>
          {completedSummary ? <Text style={styles.summary}>本次复习总数：{completedSummary.total}</Text> : null}
          {completedSummary ? <Text style={styles.summary}>记得：{completedSummary.remembered}</Text> : null}
          {completedSummary ? <Text style={styles.summary}>不记得：{completedSummary.forgotten}</Text> : null}
        </View>
      ) : null}

      {hasQueue && reviewSession && currentWord ? (
        <>
          <View style={styles.card}>
            <Text style={styles.progress}>
              {reviewSession.currentIndex + 1} / {reviewSession.queueIds.length}
            </Text>
            <Text style={styles.word}>{currentWord.word}</Text>
            {!showAnswer ? <Text style={styles.hint}>先判断你是否记得这个词</Text> : null}
            {showAnswer ? (
              <>
                <Text style={styles.meaning}>{currentWord.meaning}</Text>
                {currentWord.note ? <Text style={styles.note}>Note: {currentWord.note}</Text> : null}
                <Text style={styles.level}>Level: {currentWord.level}</Text>
              </>
            ) : null}
          </View>

          {!showAnswer ? (
            <View style={styles.actionRow}>
              <Pressable style={styles.actionButton} onPress={() => handlePick('remembered')}>
                <Text style={styles.actionText}>记得</Text>
              </Pressable>
              <Pressable style={styles.actionButton} onPress={() => handlePick('forgotten')}>
                <Text style={styles.actionText}>不记得</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>下一张</Text>
            </Pressable>
          )}
        </>
      ) : null}

      {!hasQueue && (
        <View style={styles.footer}>
          <Pressable style={styles.nextButton} onPress={onEnsureSession}>
            <Text style={styles.nextButtonText}>刷新待复习队列</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  word: {
    fontSize: 34,
    fontWeight: '700',
    color: '#111827',
  },
  hint: {
    fontSize: 14,
    color: '#9ca3af',
  },
  meaning: {
    marginTop: 8,
    fontSize: 18,
    color: '#374151',
    textAlign: 'center',
  },
  note: {
    marginTop: 4,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  level: {
    marginTop: 2,
    fontSize: 14,
    color: '#6b7280',
  },
  progress: {
    fontSize: 14,
    color: '#9ca3af',
  },
  summary: {
    fontSize: 15,
    color: '#4b5563',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  nextButton: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  footer: {
    marginBottom: 12,
  },
});
