import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { WordItem, mockWords } from './src/mock/words';
import { buildReviewQueue } from './src/review/reviewQueue';
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

type ReviewSession = {
  queueIds: string[];
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
  const [words, setWords] = useState<WordItem[]>(mockWords);
  const [reviewSession, setReviewSession] = useState<ReviewSession | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const loadDataFromStorage = async () => {
      const today = getDateText(new Date());
      try {
        const rawWords = await AsyncStorage.getItem(WORDS_STORAGE_KEY);
        if (!rawWords) {
          setWords(mockWords);
        } else {
          const parsedWords = JSON.parse(rawWords);
          if (Array.isArray(parsedWords)) {
            setWords(parsedWords as WordItem[]);
          } else {
            setWords(mockWords);
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
            typeof parsedSession.currentIndex === 'number' &&
            typeof parsedSession.rememberedCount === 'number' &&
            typeof parsedSession.forgottenCount === 'number' &&
            typeof parsedSession.date === 'string' &&
            parsedSession.date === today &&
            parsedSession.currentIndex < parsedSession.queueIds.length;
          setReviewSession(isValidSession ? parsedSession : null);
        }
      } catch {
        setWords(mockWords);
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
      if (prev && prev.date === today && prev.currentIndex < prev.queueIds.length) {
        return prev;
      }

      const queueIds = buildReviewQueue(words).map((item) => item.id);
      if (queueIds.length === 0) {
        return null;
      }

      return {
        queueIds,
        currentIndex: 0,
        rememberedCount: 0,
        forgottenCount: 0,
        date: today,
      };
    });
  };

  const handleSubmitReviewResult = (wordId: string, remembered: boolean) => {
    const daysToAdd = remembered ? 3 : 1;
    const nextReviewDate = getDateText(addDays(new Date(), daysToAdd));

    setWords((prev) =>
      prev.map((item) => (item.id === wordId ? { ...item, nextReviewDate } : item))
    );

    setReviewSession((prev) => {
      if (!prev) {
        return null;
      }

      const nextIndex = prev.currentIndex + 1;
      const nextRemembered = prev.rememberedCount + (remembered ? 1 : 0);
      const nextForgotten = prev.forgottenCount + (remembered ? 0 : 1);

      if (nextIndex >= prev.queueIds.length) {
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
          {() => <TodayScreen words={words} dueReviewCount={dueReviewCount} />}
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
              onEnsureSession={ensureTodayReviewSession}
              onSubmitReviewResult={handleSubmitReviewResult}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
