import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { AddWordScreen } from './src/screens/AddWordScreen';
import { ReviewScreen } from './src/screens/ReviewScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { WordsScreen } from './src/screens/WordsScreen';

type RootTabParamList = {
  Today: undefined;
  Words: undefined;
  AddWord: undefined;
  Review: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function App() {
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
        <Tab.Screen name="Today" component={TodayScreen} options={{ title: 'Today' }} />
        <Tab.Screen name="Words" component={WordsScreen} options={{ title: 'Words' }} />
        <Tab.Screen
          name="AddWord"
          component={AddWordScreen}
          options={{ title: 'Add Word', tabBarLabel: 'Add Word' }}
        />
        <Tab.Screen name="Review" component={ReviewScreen} options={{ title: 'Review' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
