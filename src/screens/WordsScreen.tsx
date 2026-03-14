import { GestureResponderEvent, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { WordItem } from '../mock/words';

type WordsScreenProps = {
  words: WordItem[];
  onToggleWordDifficult: (wordId: string, isDifficult: boolean) => Promise<void>;
  onSyncWordsFromApi: () => Promise<void>;
};
type LevelFilter = 'All' | 'A' | 'B' | 'C';
const levelFilters: LevelFilter[] = ['All', 'A', 'B', 'C'];

export function WordsScreen({ words, onToggleWordDifficult, onSyncWordsFromApi }: WordsScreenProps) {
  const navigation = useNavigation<NavigationProp<{ AddWord: { editWordId?: string } | undefined }>>();
  const [keyword, setKeyword] = useState('');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('All');
  const [onlyDifficult, setOnlyDifficult] = useState(false);
  const [toggleError, setToggleError] = useState('');
  const [togglingWordId, setTogglingWordId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        await onSyncWordsFromApi();
      } catch {
        // Keep current local state when API fetch fails.
      }
    })();
  }, [onSyncWordsFromApi]);

  const filteredWords = useMemo(() => {
    const difficultFilteredWords = onlyDifficult ? words.filter((item) => item.isDifficult) : words;
    const levelFilteredWords =
      levelFilter === 'All'
        ? difficultFilteredWords
        : difficultFilteredWords.filter((item) => item.level === levelFilter);
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) {
      return levelFilteredWords;
    }

    return levelFilteredWords.filter((item) => {
      const wordText = item.word.toLowerCase();
      const meaningText = item.meaning.toLowerCase();
      return wordText.includes(normalizedKeyword) || meaningText.includes(normalizedKeyword);
    });
  }, [keyword, levelFilter, onlyDifficult, words]);

  const handleToggleDifficult = async (
    event: GestureResponderEvent,
    wordId: string,
    isDifficult: boolean
  ) => {
    event.stopPropagation();
    setToggleError('');
    setTogglingWordId(wordId);

    try {
      await onToggleWordDifficult(wordId, isDifficult);
    } catch (error) {
      setToggleError(error instanceof Error ? error.message : '难词状态更新失败，请重试');
    } finally {
      setTogglingWordId(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.panel}>
        <TextInput
          placeholder="搜索单词"
          placeholderTextColor="#9ca3af"
          style={styles.searchInput}
          value={keyword}
          onChangeText={setKeyword}
        />

        <Text style={styles.hintText}>点击词条可查看详情并编辑</Text>
        {toggleError ? <Text style={styles.errorText}>{toggleError}</Text> : null}

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

        <Pressable
          style={[styles.difficultFilterButton, onlyDifficult ? styles.difficultFilterButtonActive : null]}
          onPress={() => setOnlyDifficult((prev) => !prev)}
        >
          <Text
            style={[
              styles.difficultFilterButtonText,
              onlyDifficult ? styles.difficultFilterButtonTextActive : null,
            ]}
          >
            仅看难词
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} style={styles.listScroll}>
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
            <Text style={styles.metaText}>
              ML {item.memoryLevel} · FS {item.forgetStreak} · RC {item.reviewCount} · LR{' '}
              {item.lastReviewedDate ?? '--'}
            </Text>
            <Pressable
              style={[styles.difficultToggle, item.isDifficult ? styles.difficultToggleActive : null]}
              onPress={(event) => void handleToggleDifficult(event, item.id, !item.isDifficult)}
              disabled={togglingWordId === item.id}
            >
              <Text
                style={[
                  styles.difficultToggleText,
                  item.isDifficult ? styles.difficultToggleTextActive : null,
                ]}
              >
                {togglingWordId === item.id ? '更新中...' : item.isDifficult ? '取消难词' : '标记难词'}
              </Text>
            </Pressable>
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
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  panel: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    gap: 14,
  },
  searchInput: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
    fontSize: 16,
    color: '#111827',
  },
  hintText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  errorText: {
    fontSize: 13,
    color: '#b91c1c',
    lineHeight: 18,
  },
  listScroll: {
    flex: 1,
    width: '100%',
  },
  list: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    gap: 14,
    paddingTop: 14,
    paddingBottom: 28,
  },
  filterRow: {
    flexDirection: 'column',
    gap: 10,
  },
  filterButton: {
    minHeight: 48,
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
  difficultFilterButton: {
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  difficultFilterButtonActive: {
    borderColor: '#111827',
    backgroundColor: '#f9fafb',
  },
  difficultFilterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  difficultFilterButtonTextActive: {
    color: '#111827',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    gap: 10,
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
    lineHeight: 22,
  },
  metaText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  difficultToggle: {
    alignSelf: 'flex-start',
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  difficultToggleActive: {
    borderColor: '#111827',
    backgroundColor: '#f9fafb',
  },
  difficultToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  difficultToggleTextActive: {
    color: '#111827',
  },
  emptyState: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: '#6b7280',
  },
});
