import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { WordItem, WordLevel, normalizeWordItem } from './src/mock/words';
import { buildOverflowQueue, buildReviewQueue, calculateRememberedInterval } from './src/review/reviewQueue';
import { AddWordScreen } from './src/screens/AddWordScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { ReviewScreen } from './src/screens/ReviewScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { WordsScreen } from './src/screens/WordsScreen';
import { apiGet, apiPatch, apiPost } from './src/utils/apiClient';

type RootTabParamList = {
  Today: undefined;
  Words: undefined;
  History: undefined;
  AddWord: { editWordId?: string } | undefined;
  Review: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const WORDS_STORAGE_KEY = 'english-words-mvp:words';
const REVIEW_SESSION_STORAGE_KEY = 'english-words-mvp:review-session';
const REVIEW_HISTORY_STORAGE_KEY = 'english-words-mvp:review-history';
const OVERFLOW_BATCH_SIZE = 5;
const WORDS_RELATED_STORAGE_KEYS = [
  WORDS_STORAGE_KEY,
  REVIEW_SESSION_STORAGE_KEY,
  REVIEW_HISTORY_STORAGE_KEY,
];

type ReviewSession = {
  queueIds: string[];
  overflowQueueIds: string[];
  currentIndex: number;
  rememberedCount: number;
  forgottenCount: number;
  date: string;
};

type ReviewHistoryItem = {
  date: string;
  rememberedCount: number;
  forgottenCount: number;
};

type ApiWordItem = {
  id: number | string;
  word: string;
  meaning: string;
  level: WordLevel;
  isDifficult: boolean | number;
  note: string;
  nextReviewDate: string;
  memoryLevel?: number;
  forgetStreak?: number;
  lastReviewedDate?: string | null;
  reviewCount?: number;
};

type ReviewUpdatePayload = Pick<
  WordItem,
  'memoryLevel' | 'forgetStreak' | 'reviewCount' | 'lastReviewedDate' | 'nextReviewDate' | 'isDifficult'
> & {
  wordId: number;
};

type WordUpdatePayload = {
  word?: string;
  meaning?: string;
  level?: WordLevel;
  note?: string;
  isDifficult?: boolean;
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

function MainApp() {
  const { user, isAuthLoaded } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const [words, setWords] = useState<WordItem[]>([]);
  const [reviewSession, setReviewSession] = useState<ReviewSession | null>(null);
  const [reviewHistory, setReviewHistory] = useState<ReviewHistoryItem[]>([]);
  const [isLocalStateLoaded, setIsLocalStateLoaded] = useState(false);
  const [isWordsLoaded, setIsWordsLoaded] = useState(false);
  const previousUsernameRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      setAuthMode('login');
    }
  }, [user]);

  useEffect(() => {
    const loadDataFromStorage = async () => {
      const today = getDateText(new Date());
      try {
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

        const rawHistory = await AsyncStorage.getItem(REVIEW_HISTORY_STORAGE_KEY);
        if (!rawHistory) {
          setReviewHistory([]);
        } else {
          const parsedHistory = JSON.parse(rawHistory);
          if (Array.isArray(parsedHistory)) {
            const normalizedHistory = parsedHistory
              .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
              .map((item) => ({
                date: String(item.date ?? ''),
                rememberedCount: Math.max(Number(item.rememberedCount ?? 0), 0),
                forgottenCount: Math.max(Number(item.forgottenCount ?? 0), 0),
              }))
              .filter((item) => item.date);
            setReviewHistory(normalizedHistory);
          } else {
            setReviewHistory([]);
          }
        }
      } catch {
        setReviewSession(null);
        setReviewHistory([]);
      } finally {
        setIsLocalStateLoaded(true);
      }
    };

    void loadDataFromStorage();
  }, []);

  useEffect(() => {
    if (!isLocalStateLoaded) {
      return;
    }

    const saveSessionToStorage = async () => {
      try {
        if (!user) {
          await AsyncStorage.removeItem(REVIEW_SESSION_STORAGE_KEY);
          return;
        }

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
  }, [isLocalStateLoaded, reviewSession, user]);

  useEffect(() => {
    if (!isLocalStateLoaded) {
      return;
    }

    const saveHistoryToStorage = async () => {
      try {
        if (!user) {
          await AsyncStorage.removeItem(REVIEW_HISTORY_STORAGE_KEY);
          return;
        }

        await AsyncStorage.setItem(REVIEW_HISTORY_STORAGE_KEY, JSON.stringify(reviewHistory));
      } catch {
        // Keep UI usable even if local storage write fails.
      }
    };

    void saveHistoryToStorage();
  }, [isLocalStateLoaded, reviewHistory, user]);

  const handleClearLocalWordState = useCallback(async () => {
    setWords([]);
    setReviewSession(null);
    setReviewHistory([]);

    try {
      await AsyncStorage.multiRemove(WORDS_RELATED_STORAGE_KEYS);
    } catch {
      // Ignore local cleanup errors and keep auth state usable.
    }
  }, []);

  const handleSyncWordsFromApi = useCallback(async () => {
    const result = await apiGet<{ success: boolean; words: ApiWordItem[] }>('/words');
    const fetchedWords = Array.isArray(result.words)
      ? result.words.map((item) =>
          normalizeWordItem({
            id: String(item.id),
            word: item.word,
            meaning: item.meaning,
            level: item.level,
            isDifficult: Boolean(item.isDifficult),
            note: item.note ?? '',
            nextReviewDate: item.nextReviewDate,
            memoryLevel: item.memoryLevel,
            forgetStreak: item.forgetStreak,
            lastReviewedDate: item.lastReviewedDate ?? null,
            reviewCount: item.reviewCount,
          })
        )
      : [];
    setWords(fetchedWords);
    setReviewSession((prev) => {
      if (!prev) {
        return null;
      }

      const validIds = new Set(fetchedWords.map((item) => item.id));
      const queueIds = prev.queueIds.filter((id) => validIds.has(id));
      const overflowQueueIds = prev.overflowQueueIds.filter((id) => validIds.has(id));
      const nextIndex = Math.min(prev.currentIndex, queueIds.length);

      if (queueIds.length === 0 && overflowQueueIds.length === 0) {
        return null;
      }

      return {
        ...prev,
        queueIds,
        overflowQueueIds,
        currentIndex: nextIndex,
      };
    });
  }, []);

  const handleCreateWordFromApi = useCallback(
    async (payload: { word: string; meaning: string; level: WordLevel; note: string; isDifficult: boolean }) => {
      await apiPost(
        '/words',
        {
          word: payload.word,
          meaning: payload.meaning,
          level: payload.level,
          note: payload.note,
          isDifficult: payload.isDifficult,
        },
        true
      );
    },
    []
  );

  const handleUpdateWordFromApi = useCallback(
    async (wordId: string, payload: WordUpdatePayload) => {
      await apiPatch(`/words/${wordId}`, payload, true);
      await handleSyncWordsFromApi();
    },
    [handleSyncWordsFromApi]
  );

  const handleToggleWordDifficultFromApi = useCallback(
    async (wordId: string, isDifficult: boolean) => {
      await apiPatch(
        `/words/${wordId}`,
        {
          isDifficult,
        },
        true
      );
      await handleSyncWordsFromApi();
    },
    [handleSyncWordsFromApi]
  );

  const handleSubmitReviewToApi = useCallback(async (payload: ReviewUpdatePayload) => {
    const result = await apiPost<{ success: boolean; word: ApiWordItem }>('/review', payload, true);
    return normalizeWordItem({
      id: String(result.word.id),
      word: result.word.word,
      meaning: result.word.meaning,
      level: result.word.level,
      isDifficult: Boolean(result.word.isDifficult),
      note: result.word.note ?? '',
      nextReviewDate: result.word.nextReviewDate,
      memoryLevel: result.word.memoryLevel,
      forgetStreak: result.word.forgetStreak,
      lastReviewedDate: result.word.lastReviewedDate ?? null,
      reviewCount: result.word.reviewCount,
    });
  }, []);

  useEffect(() => {
    if (!isAuthLoaded || !isLocalStateLoaded) {
      return;
    }

    if (!user) {
      previousUsernameRef.current = null;
      setIsWordsLoaded(true);
      void handleClearLocalWordState();
      return;
    }

    const shouldResetLocalState =
      previousUsernameRef.current !== null && previousUsernameRef.current !== user.username;
    previousUsernameRef.current = user.username;
    setIsWordsLoaded(false);

    void (async () => {
      try {
        await AsyncStorage.removeItem(WORDS_STORAGE_KEY);
      } catch {
        // Ignore legacy cache cleanup errors and continue syncing from backend.
      }

      if (shouldResetLocalState) {
        setWords([]);
        setReviewSession(null);
        setReviewHistory([]);
        try {
          await AsyncStorage.multiRemove([REVIEW_SESSION_STORAGE_KEY, REVIEW_HISTORY_STORAGE_KEY]);
        } catch {
          // Ignore cache cleanup errors and keep syncing from backend.
        }
      }

      try {
        await handleSyncWordsFromApi();
      } finally {
        setIsWordsLoaded(true);
      }
    })();
  }, [handleClearLocalWordState, handleSyncWordsFromApi, isAuthLoaded, isLocalStateLoaded, user]);

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

  const handleSubmitReviewResult = async (wordId: string, remembered: boolean) => {
    const today = getDateText(new Date());
    const targetWord = words.find((item) => item.id === wordId);

    if (!targetWord) {
      return;
    }

    const nextWord = !remembered
      ? {
          ...targetWord,
          memoryLevel: 1,
          forgetStreak: targetWord.forgetStreak + 1,
          reviewCount: targetWord.reviewCount + 1,
          lastReviewedDate: today,
          nextReviewDate: getDateText(addDays(new Date(), 1)),
        }
      : (() => {
          const nextMemoryLevel = Math.min(targetWord.memoryLevel + 1, 5);
          const interval = calculateRememberedInterval(nextMemoryLevel, targetWord.level);
          return {
            ...targetWord,
            memoryLevel: nextMemoryLevel,
            forgetStreak: Math.max(targetWord.forgetStreak - 1, 0),
            reviewCount: targetWord.reviewCount + 1,
            lastReviewedDate: today,
            nextReviewDate: getDateText(addDays(new Date(), interval)),
          };
        })();

    const persistedWord = await handleSubmitReviewToApi({
      wordId: Number(targetWord.id),
      memoryLevel: nextWord.memoryLevel,
      forgetStreak: nextWord.forgetStreak,
      reviewCount: nextWord.reviewCount,
      lastReviewedDate: nextWord.lastReviewedDate,
      nextReviewDate: nextWord.nextReviewDate,
      isDifficult: nextWord.isDifficult,
    });

    setWords((prev) =>
      prev.map((item) => (item.id === wordId ? persistedWord : item))
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

    setReviewHistory((prev) => {
      const existingIndex = prev.findIndex((item) => item.date === today);
      if (existingIndex === -1) {
        return [
          ...prev,
          {
            date: today,
            rememberedCount: remembered ? 1 : 0,
            forgottenCount: remembered ? 0 : 1,
          },
        ];
      }

      return prev.map((item, index) => {
        if (index !== existingIndex) {
          return item;
        }
        return {
          ...item,
          rememberedCount: item.rememberedCount + (remembered ? 1 : 0),
          forgottenCount: item.forgottenCount + (remembered ? 0 : 1),
        };
      });
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

  if (!isAuthLoaded || !isLocalStateLoaded || !isWordsLoaded) {
    return null;
  }

  if (!user) {
    return authMode === 'login' ? (
      <LoginScreen onGoRegister={() => setAuthMode('register')} />
    ) : (
      <RegisterScreen onGoLogin={() => setAuthMode('login')} />
    );
  }

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
          {() => (
            <WordsScreen
              words={words}
              onToggleWordDifficult={handleToggleWordDifficultFromApi}
              onSyncWordsFromApi={handleSyncWordsFromApi}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="History" options={{ title: 'History' }}>
          {() => <HistoryScreen reviewHistory={reviewHistory} />}
        </Tab.Screen>
        <Tab.Screen
          name="AddWord"
          options={{ title: 'Add Word', tabBarLabel: 'Add Word' }}
        >
          {({ route }) => (
            <AddWordScreen
              words={words}
              editWordId={route.params?.editWordId}
              onUpdateWord={handleUpdateWordFromApi}
              onCreateWordFromApi={handleCreateWordFromApi}
              onSyncWordsFromApi={handleSyncWordsFromApi}
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

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
