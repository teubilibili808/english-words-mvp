import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { WordItem, WordLevel, mockWords, normalizeWordItem } from './src/mock/words';
import { buildOverflowQueue, buildReviewQueue, calculateRememberedInterval } from './src/review/reviewQueue';
import { AddWordScreen } from './src/screens/AddWordScreen';
import { ReviewScreen } from './src/screens/ReviewScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { WordsScreen } from './src/screens/WordsScreen';

type RootTabParamList = {
  Today: undefined;
  Words: undefined;
  AddWord: { editWordId?: string } | undefined;
  Review: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const WORDS_STORAGE_KEY = 'english-words-mvp:words';
const REVIEW_SESSION_STORAGE_KEY = 'english-words-mvp:review-session';
const OVERFLOW_BATCH_SIZE = 5;

type ReviewSession = {
  queueIds: string[];
  overflowQueueIds: string[];
  currentIndex: number;
  rememberedCount: number;
  forgottenCount: number;
  date: string;
};

function getDateText(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(baseDate: Date, days: number) {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + days);
  return next;
}

export default function App() {
  const [words, setWords] = useState<WordItem[]>(mockWords.map((item) => normalizeWordItem(item)));
  const [reviewSession, setReviewSession] = useState<ReviewSession | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const loadDataFromStorage = async () => {
      const today = getDateText(new Date());
      try {
        const rawWords = await AsyncStorage.getItem(WORDS_STORAGE_KEY);
        if (!rawWords) {
          setWords(mockWords.map((item) => normalizeWordItem(item)));
        } else {
          const parsedWords = JSON.parse(rawWords);
          if (Array.isArray(parsedWords)) {
            const migratedWords = parsedWords
              .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
              .map((item) => {
                const normalizedLevel: WordLevel =
                  item.level === 'A' || item.level === 'B' || item.level === 'C' ? item.level : 'B';
                const baseWord = {
                  id: String(item.id ?? ''),
                  word: String(item.word ?? ''),
                  meaning: String(item.meaning ?? ''),
                  level: normalizedLevel,
                  isDifficult: Boolean(item.isDifficult),
                  note: String(item.note ?? ''),
                  nextReviewDate: String(item.nextReviewDate ?? getDateText(new Date())),
                };
                return normalizeWordItem({
                  ...baseWord,
                  memoryLevel: item.memoryLevel as number | undefined,
                  forgetStreak: item.forgetStreak as number | undefined,
                  lastReviewedDate: (item.lastReviewedDate as string | null | undefined) ?? null,
                  reviewCount: item.reviewCount as number | undefined,
                });
              })
              .filter((item) => item.id && item.word);
            setWords(migratedWords.length > 0 ? migratedWords : mockWords.map((item) => normalizeWordItem(item)));
          } else {
            setWords(mockWords.map((item) => normalizeWordItem(item)));
          }
        }

        const rawSession = await AsyncStorage.getItem(REVIEW_SESSION_STORAGE_KEY);
        if (!rawSession) {
          setReviewSession(null);
        } else {
          const parsedSession = JSON.parse(rawSession) as ReviewSession;
          const isValidSession =
            parsedSession &&
            Array.isArray(parsedSession.queueIds) &&
            Array.isArray(parsedSession.overflowQueueIds) &&
            typeof parsedSession.currentIndex === 'number' &&
            typeof parsedSession.rememberedCount === 'number' &&
            typeof parsedSession.forgottenCount === 'number' &&
            typeof parsedSession.date === 'string' &&
            parsedSession.date === today &&
            parsedSession.currentIndex <= parsedSession.queueIds.length;
          setReviewSession(isValidSession ? parsedSession : null);
        }
      } catch {
        setWords(mockWords.map((item) => normalizeWordItem(item)));
        setReviewSession(null);
      } finally {
        setIsDataLoaded(true);
      }
    };

    void loadDataFromStorage();
  }, []);

  useEffect(() => {
    if (!isDataLoaded) {
      return;
    }

    const saveWordsToStorage = async () => {
      try {
        await AsyncStorage.setItem(WORDS_STORAGE_KEY, JSON.stringify(words));
      } catch {
        // Keep UI usable even if local storage write fails.
      }
    };

    void saveWordsToStorage();
  }, [isDataLoaded, words]);

  useEffect(() => {
    if (!isDataLoaded) {
      return;
    }

    const saveSessionToStorage = async () => {
      try {
        if (!reviewSession) {
          await AsyncStorage.removeItem(REVIEW_SESSION_STORAGE_KEY);
          return;
        }

        await AsyncStorage.setItem(REVIEW_SESSION_STORAGE_KEY, JSON.stringify(reviewSession));
      } catch {
        // Keep UI usable even if local storage write fails.
      }
    };

    void saveSessionToStorage();
  }, [isDataLoaded, reviewSession]);

  const handleAddWord = (newWord: WordItem) => {
    setWords((prev) => [newWord, ...prev]);
  };

  const handleUpdateWord = (updatedWord: WordItem) => {
    setWords((prev) => prev.map((item) => (item.id === updatedWord.id ? updatedWord : item)));
  };

  const ensureTodayReviewSession = () => {
    const today = getDateText(new Date());
    setReviewSession((prev) => {
      if (prev && prev.date === today) {
        return prev;
      }

      const queue = buildReviewQueue(words);
      const queueIds = queue.map((item) => item.id);
      const overflowQueueIds = buildOverflowQueue(words, queueIds).map((item) => item.id);
      if (queueIds.length === 0) {
        if (overflowQueueIds.length === 0) {
          return null;
        }
      }

      return {
        queueIds,
        overflowQueueIds,
        currentIndex: 0,
        rememberedCount: 0,
        forgottenCount: 0,
        date: today,
      };
    });
  };

  const appendOverflowBatch = () => {
    setReviewSession((prev) => {
      if (!prev || prev.overflowQueueIds.length === 0) {
        return prev;
      }

      const batchCount = Math.min(OVERFLOW_BATCH_SIZE, prev.overflowQueueIds.length);
      const appendIds = prev.overflowQueueIds.slice(0, batchCount);
      return {
        ...prev,
        queueIds: [...prev.queueIds, ...appendIds],
        overflowQueueIds: prev.overflowQueueIds.slice(batchCount),
      };
    });
  };

  const handleSubmitReviewResult = (wordId: string, remembered: boolean) => {
    const today = getDateText(new Date());

    setWords((prev) =>
      prev.map((item) => {
        if (item.id !== wordId) {
          return item;
        }

        if (!remembered) {
          return {
            ...item,
            memoryLevel: 1,
            forgetStreak: item.forgetStreak + 1,
            reviewCount: item.reviewCount + 1,
            lastReviewedDate: today,
            nextReviewDate: getDateText(addDays(new Date(), 1)),
          };
        }

        const nextMemoryLevel = Math.min(item.memoryLevel + 1, 5);
        const interval = calculateRememberedInterval(nextMemoryLevel, item.level);
        return {
          ...item,
          memoryLevel: nextMemoryLevel,
          forgetStreak: Math.max(item.forgetStreak - 1, 0),
          reviewCount: item.reviewCount + 1,
          lastReviewedDate: today,
          nextReviewDate: getDateText(addDays(new Date(), interval)),
        };
      })
    );

    setReviewSession((prev) => {
      if (!prev) {
        return null;
      }

      const nextIndex = prev.currentIndex + 1;
      const nextRemembered = prev.rememberedCount + (remembered ? 1 : 0);
      const nextForgotten = prev.forgottenCount + (remembered ? 0 : 1);

      if (nextIndex >= prev.queueIds.length && prev.overflowQueueIds.length === 0) {
        return null;
      }

      return {
        ...prev,
        currentIndex: nextIndex,
        rememberedCount: nextRemembered,
        forgottenCount: nextForgotten,
      };
    });
  };

  const today = getDateText(new Date());
  const hasActiveTodaySession =
    reviewSession &&
    reviewSession.date === today &&
    reviewSession.currentIndex < reviewSession.queueIds.length;
  const dueReviewCount = hasActiveTodaySession
    ? reviewSession.queueIds.length - reviewSession.currentIndex
    : buildReviewQueue(words).length;
  const todayRememberedCount = hasActiveTodaySession ? reviewSession.rememberedCount : 0;
  const todayForgottenCount = hasActiveTodaySession ? reviewSession.forgottenCount : 0;

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={{
          headerTitleAlign: 'center',
          tabBarActiveTintColor: '#111827',
          tabBarInactiveTintColor: '#9ca3af',
          tabBarStyle: {
            height: 68,
            paddingTop: 8,
            paddingBottom: 8,
            backgroundColor: '#ffffff',
            borderTopColor: '#e5e7eb',
          },
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerShadowVisible: false,
          headerTitleStyle: {
            color: '#111827',
            fontSize: 20,
            fontWeight: '700',
          },
        }}
      >
        <Tab.Screen name="Today" options={{ title: 'Today' }}>
          {() => (
            <TodayScreen
              words={words}
              dueReviewCount={dueReviewCount}
              rememberedCount={todayRememberedCount}
              forgottenCount={todayForgottenCount}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Words" options={{ title: 'Words' }}>
          {() => <WordsScreen words={words} />}
        </Tab.Screen>
        <Tab.Screen
          name="AddWord"
          options={{ title: 'Add Word', tabBarLabel: 'Add Word' }}
        >
          {({ route }) => (
            <AddWordScreen
              words={words}
              editWordId={route.params?.editWordId}
              onAddWord={handleAddWord}
              onUpdateWord={handleUpdateWord}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Review" options={{ title: 'Review' }}>
          {() => (
            <ReviewScreen
              words={words}
              reviewSession={reviewSession}
              overflowBatchSize={OVERFLOW_BATCH_SIZE}
              onEnsureSession={ensureTodayReviewSession}
              onAppendOverflowBatch={appendOverflowBatch}
              onSubmitReviewResult={handleSubmitReviewResult}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
