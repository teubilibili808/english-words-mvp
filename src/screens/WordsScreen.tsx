import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMemo, useState } from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { WordItem } from '../mock/words';

type WordsScreenProps = {
  words: WordItem[];
};
type LevelFilter = 'All' | 'A' | 'B' | 'C';
const levelFilters: LevelFilter[] = ['All', 'A', 'B', 'C'];

export function WordsScreen({ words }: WordsScreenProps) {
  const navigation = useNavigation<NavigationProp<{ AddWord: { editWordId?: string } | undefined }>>();
  const [keyword, setKeyword] = useState('');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('All');
  const filteredWords = useMemo(() => {
    const levelFilteredWords =
      levelFilter === 'All' ? words : words.filter((item) => item.level === levelFilter);
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) {
      return levelFilteredWords;
    }

    return levelFilteredWords.filter((item) => {
      const wordText = item.word.toLowerCase();
      const meaningText = item.meaning.toLowerCase();
      return wordText.includes(normalizedKeyword) || meaningText.includes(normalizedKeyword);
    });
  }, [keyword, levelFilter, words]);

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="搜索单词"
        placeholderTextColor="#9ca3af"
        style={styles.searchInput}
        value={keyword}
        onChangeText={setKeyword}
      />

      <View style={styles.filterRow}>
        {levelFilters.map((level) => {
          const isSelected = levelFilter === level;
          return (
            <Pressable
              key={level}
              style={[styles.filterButton, isSelected ? styles.filterButtonSelected : null]}
              onPress={() => setLevelFilter(level)}
            >
              <Text style={[styles.filterButtonText, isSelected ? styles.filterButtonTextSelected : null]}>
                {level}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filteredWords.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>没有匹配的单词</Text>
          </View>
        ) : null}
        {filteredWords.map((item) => (
          <Pressable
            key={item.id}
            style={styles.card}
            onPress={() => navigation.navigate('AddWord', { editWordId: item.id })}
          >
            <View style={styles.topRow}>
              <Text style={styles.word}>{item.word}</Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{item.level}</Text>
              </View>
            </View>
            <Text style={styles.meaning}>{item.meaning}</Text>
          </Pressable>
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
  filterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  filterButtonSelected: {
    borderColor: '#111827',
    backgroundColor: '#f9fafb',
  },
  filterButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterButtonTextSelected: {
    color: '#111827',
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
  emptyState: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 20,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: '#6b7280',
  },
});
