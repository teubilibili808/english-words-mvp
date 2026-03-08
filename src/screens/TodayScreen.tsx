import { Pressable, StyleSheet, Text, View } from 'react-native';
import { mockWords } from '../mock/words';

function getDateText(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function TodayScreen() {
  const today = getDateText(new Date());
  const dueTodayCount = mockWords.filter((item) => item.nextReviewDate <= today).length;
  const difficultCount = mockWords.filter((item) => item.isDifficult).length;
  const learnedCount = mockWords.length;
  const stats = [
    { label: '今日待复习', value: dueTodayCount },
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

      <Pressable style={styles.button}>
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
