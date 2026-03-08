import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { WordItem, mockWords } from './src/mock/words';
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

export default function App() {
  const [words, setWords] = useState<WordItem[]>(mockWords);
  const [isWordsLoaded, setIsWordsLoaded] = useState(false);

  useEffect(() => {
    const loadWordsFromStorage = async () => {
      try {
        const raw = await AsyncStorage.getItem(WORDS_STORAGE_KEY);
        if (!raw) {
          setWords(mockWords);
          return;
        }

        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setWords(parsed as WordItem[]);
          return;
        }

        setWords(mockWords);
      } catch {
        setWords(mockWords);
      } finally {
        setIsWordsLoaded(true);
      }
    };

    void loadWordsFromStorage();
  }, []);

  useEffect(() => {
    if (!isWordsLoaded) {
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
  }, [isWordsLoaded, words]);

  const handleAddWord = (newWord: WordItem) => {
    setWords((prev) => [newWord, ...prev]);
  };

  const handleUpdateWord = (updatedWord: WordItem) => {
    setWords((prev) => prev.map((item) => (item.id === updatedWord.id ? updatedWord : item)));
  };

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
          {() => <TodayScreen words={words} />}
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
          {() => <ReviewScreen words={words} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
