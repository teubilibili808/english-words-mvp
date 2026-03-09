import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WordItem } from '../mock/words';

type TodayScreenProps = {
  words: WordItem[];
  dueReviewCount: number;
  rememberedCount: number;
  forgottenCount: number;
};

export function TodayScreen({ words, dueReviewCount, rememberedCount, forgottenCount }: TodayScreenProps) {
  const navigation = useNavigation<NavigationProp<{ Review: undefined }>>();
  const difficultCount = words.filter((item) => item.isDifficult).length;
  const learnedCount = words.length;
  const stats = [
    { label: '今日待复习', value: dueReviewCount },
    { label: '难词', value: difficultCount },
    { label: '已学习', value: learnedCount },
  ];

  return (
    <View style={styles.container}>
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

      <Pressable style={styles.button} onPress={() => navigation.navigate('Review')}>
        <Text style={styles.buttonText}>开始复习</Text>
      </Pressable>

      <Pressable style={[styles.button, styles.secondaryButton]}>
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>进入单词库</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    gap: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    color: '#4b5563',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  button: {
    minHeight: 52,
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
