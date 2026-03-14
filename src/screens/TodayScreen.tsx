import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { WordItem } from '../mock/words';

type TodayScreenProps = {
  words: WordItem[];
  dueReviewCount: number;
  rememberedCount: number;
  forgottenCount: number;
};

export function TodayScreen({ words, dueReviewCount, rememberedCount, forgottenCount }: TodayScreenProps) {
  const { logout } = useAuth();
  const navigation = useNavigation<NavigationProp<{ Review: undefined; Words: undefined }>>();
  const difficultCount = words.filter((item) => item.isDifficult).length;
  const learnedCount = words.length;
  const stats = [
    { label: '今日待复习', value: dueReviewCount },
    { label: '难词', value: difficultCount },
    { label: '已学习', value: learnedCount },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.panel}>
        <View style={styles.card}>
          {stats.map((item) => (
            <View key={item.label} style={styles.row}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.value}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>今日已完成小计</Text>
            <Text style={styles.subValue}>记得 {rememberedCount} / 不记得 {forgottenCount}</Text>
          </View>
        </View>

        <View style={styles.buttonGroup}>
          <Pressable style={styles.button} onPress={() => navigation.navigate('Review')}>
            <Text style={styles.buttonText}>开始复习</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={() => navigation.navigate('Words')}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>进入单词库</Text>
          </Pressable>

          <Pressable style={[styles.button, styles.secondaryButton]} onPress={() => void logout()}>
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Logout</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  panel: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    gap: 18,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 18,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    color: '#4b5563',
    flex: 1,
    paddingRight: 12,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  buttonGroup: {
    gap: 12,
    paddingTop: 4,
  },
  button: {
    minHeight: 56,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#111827',
  },
  secondaryButtonText: {
    color: '#111827',
  },
});
