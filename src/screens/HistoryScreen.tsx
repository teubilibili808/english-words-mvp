import { ScrollView, StyleSheet, Text, View } from 'react-native';

type ReviewHistoryItem = {
  date: string;
  rememberedCount: number;
  forgottenCount: number;
};

type HistoryScreenProps = {
  reviewHistory: ReviewHistoryItem[];
};

export function HistoryScreen({ reviewHistory }: HistoryScreenProps) {
  const sortedHistory = [...reviewHistory].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <View style={styles.container}>
      <View style={styles.panel}>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {sortedHistory.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>暂无复习历史记录</Text>
          </View>
        ) : null}

        {sortedHistory.map((item) => {
          const completedCount = item.rememberedCount + item.forgottenCount;
          return (
            <View key={item.date} style={styles.card}>
              <Text style={styles.date}>{item.date}</Text>
              <Text style={styles.meta}>完成量：{completedCount}</Text>
              <Text style={styles.meta}>记得：{item.rememberedCount}</Text>
              <Text style={styles.meta}>不记得：{item.forgottenCount}</Text>
            </View>
          );
        })}
      </ScrollView>
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
  },
  list: {
    gap: 14,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    gap: 8,
  },
  date: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  meta: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563',
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#6b7280',
  },
});
