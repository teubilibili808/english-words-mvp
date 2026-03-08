import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { WordItem } from '../mock/words';

const actions = ['Again', 'Hard', 'Good', 'Easy'];
type ReviewScreenProps = {
  words: WordItem[];
};

export function ReviewScreen({ words }: ReviewScreenProps) {
  const [showMeaning, setShowMeaning] = useState(false);
  const reviewWord = words[0];
  const hasWord = Boolean(reviewWord);

  return (
    <View style={styles.container}>
      <Pressable style={styles.card} onPress={() => setShowMeaning((prev) => !prev)}>
        <Text style={styles.word}>{hasWord ? reviewWord.word : '暂无单词'}</Text>
        <Text style={styles.hint}>{hasWord ? '点击卡片显示释义' : '请先在 Add Word 页面新增单词'}</Text>
        {showMeaning && hasWord ? <Text style={styles.meaning}>{reviewWord.meaning}</Text> : null}
      </Pressable>

      <View style={styles.actionRow}>
        {actions.map((action) => (
          <Pressable key={action} style={styles.actionButton}>
            <Text style={styles.actionText}>{action}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  word: {
    fontSize: 34,
    fontWeight: '700',
    color: '#111827',
  },
  hint: {
    fontSize: 14,
    color: '#9ca3af',
  },
  meaning: {
    marginTop: 8,
    fontSize: 18,
    color: '#374151',
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  actionButton: {
    width: '48%',
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
});
