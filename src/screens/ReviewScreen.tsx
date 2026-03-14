import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WordItem } from '../mock/words';

type ReviewScreenProps = {
  words: WordItem[];
  reviewSession: {
    queueIds: string[];
    overflowQueueIds: string[];
    currentIndex: number;
    rememberedCount: number;
    forgottenCount: number;
    date: string;
  } | null;
  overflowBatchSize: number;
  onEnsureSession: () => void;
  onAppendOverflowBatch: () => void;
  onSubmitReviewResult: (wordId: string, remembered: boolean) => Promise<void>;
};

type ReviewChoice = 'remembered' | 'forgotten';

export function ReviewScreen({
  words,
  reviewSession,
  overflowBatchSize,
  onEnsureSession,
  onAppendOverflowBatch,
  onSubmitReviewResult,
}: ReviewScreenProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentChoice, setCurrentChoice] = useState<ReviewChoice | null>(null);
  const [dismissOverflowPrompt, setDismissOverflowPrompt] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSummary, setCompletedSummary] = useState<{
    total: number;
    remembered: number;
    forgotten: number;
  } | null>(null);

  const clearCurrentChoice = useCallback(() => {
    setShowAnswer(false);
    setCurrentChoice(null);
    setErrorMessage('');
  }, []);

  useFocusEffect(
    useCallback(() => {
      onEnsureSession();
      clearCurrentChoice();
      setDismissOverflowPrompt(false);
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

  const hasQueue = Boolean(
    reviewSession && reviewSession.currentIndex < reviewSession.queueIds.length
  );
  const overflowCount = reviewSession?.overflowQueueIds.length ?? 0;
  const shouldShowOverflowPrompt = overflowCount > 0 && !dismissOverflowPrompt;
  const isCompleted = Boolean(completedSummary) && !hasQueue;

  const handlePick = (choice: ReviewChoice) => {
    setCurrentChoice(choice);
    setShowAnswer(true);
  };

  const handleNext = async () => {
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

    setIsSubmitting(true);

    try {
      await onSubmitReviewResult(currentWord.id, remembered);
      clearCurrentChoice();
    } catch (error) {
      if (isFinalCard) {
        setCompletedSummary(null);
      }
      setErrorMessage(error instanceof Error ? error.message : '复习结果保存失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.panel}>
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

      {shouldShowOverflowPrompt ? (
        <View style={styles.promptCard}>
          <Text style={styles.promptText}>
            你还有 {overflowCount} 个积压单词，是否追加复习？（每次最多 {overflowBatchSize} 个）
          </Text>
          <View style={styles.promptRow}>
            <Pressable
              style={styles.promptPrimaryButton}
              onPress={() => {
                onAppendOverflowBatch();
                setCompletedSummary(null);
                setDismissOverflowPrompt(false);
              }}
            >
              <Text style={styles.promptPrimaryText}>追加复习</Text>
            </Pressable>
            <Pressable
              style={styles.promptSecondaryButton}
              onPress={() => setDismissOverflowPrompt(true)}
            >
              <Text style={styles.promptSecondaryText}>暂不追加</Text>
            </Pressable>
          </View>
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
                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
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
            <Pressable
              style={[styles.nextButton, isSubmitting ? styles.nextButtonDisabled : null]}
              onPress={() => void handleNext()}
              disabled={isSubmitting}
            >
              <Text style={styles.nextButtonText}>{isSubmitting ? '保存中...' : '下一张'}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  panel: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  word: {
    fontSize: 38,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  hint: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
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
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#b91c1c',
    textAlign: 'center',
  },
  progress: {
    fontSize: 14,
    color: '#9ca3af',
  },
  summary: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
  },
  promptCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    padding: 16,
    gap: 12,
  },
  promptText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  promptRow: {
    flexDirection: 'column',
    gap: 10,
  },
  promptPrimaryButton: {
    minHeight: 50,
    borderRadius: 10,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptPrimaryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  promptSecondaryButton: {
    minHeight: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  promptSecondaryText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'column',
    gap: 10,
    marginBottom: 16,
  },
  actionButton: {
    minHeight: 56,
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
    minHeight: 56,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  nextButtonDisabled: {
    opacity: 0.7,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  footer: {
    marginBottom: 8,
  },
});
