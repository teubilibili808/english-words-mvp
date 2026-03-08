import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMemo, useState } from 'react';
import { mockWords } from '../mock/words';

export function WordsScreen() {
  const [keyword, setKeyword] = useState('');
  const filteredWords = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) {
      return mockWords;
    }

    return mockWords.filter((item) => {
      const wordText = item.word.toLowerCase();
      const meaningText = item.meaning.toLowerCase();
      return wordText.includes(normalizedKeyword) || meaningText.includes(normalizedKeyword);
    });
  }, [keyword]);

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="搜索单词"
        placeholderTextColor="#9ca3af"
        style={styles.searchInput}
        value={keyword}
        onChangeText={setKeyword}
      />

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filteredWords.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.topRow}>
              <Text style={styles.word}>{item.word}</Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{item.level}</Text>
              </View>
            </View>
            <Text style={styles.meaning}>{item.meaning}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    gap: 12,
  },
  searchInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
    fontSize: 16,
    color: '#111827',
  },
  list: {
    gap: 10,
    paddingBottom: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  word: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  levelBadge: {
    minWidth: 34,
    height: 28,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  levelText: {
    color: '#111827',
    fontWeight: '600',
  },
  meaning: {
    fontSize: 16,
    color: '#4b5563',
  },
});
