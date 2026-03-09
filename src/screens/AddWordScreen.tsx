import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { WordItem, WordLevel } from '../mock/words';

const levels = ['A', 'B', 'C'] as const;

type AddWordScreenProps = {
  words: WordItem[];
  editWordId?: string;
  onAddWord: (newWord: WordItem) => void;
  onUpdateWord: (updatedWord: WordItem) => void;
};

function getDateText(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function AddWordScreen({ words, editWordId, onAddWord, onUpdateWord }: AddWordScreenProps) {
  const navigation = useNavigation<NavigationProp<{ Words: undefined; AddWord: { editWordId?: string } | undefined }>>();
  const editingWord = useMemo(() => words.find((item) => item.id === editWordId), [editWordId, words]);
  const isEditMode = Boolean(editingWord);
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [note, setNote] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<WordLevel>('B');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!editingWord) {
      setWord('');
      setMeaning('');
      setNote('');
      setSelectedLevel('B');
      setErrorMessage('');
      setSuccessMessage('');
      return;
    }

    setWord(editingWord.word);
    setMeaning(editingWord.meaning);
    setNote(editingWord.note);
    setSelectedLevel(editingWord.level);
    setErrorMessage('');
    setSuccessMessage('');
  }, [editingWord]);

  const handleSave = () => {
    const trimmedWord = word.trim();
    const trimmedMeaning = meaning.trim();
    const normalizedWord = trimmedWord.toLowerCase();

    if (!trimmedWord) {
      setErrorMessage('请输入单词（word）。');
      setSuccessMessage('');
      return;
    }

    if (!trimmedMeaning) {
      setErrorMessage('请输入中文释义（meaning）。');
      setSuccessMessage('');
      return;
    }

    const existedWord = words.some((item) => {
      if (isEditMode && item.id === editingWord?.id) {
        return false;
      }
      return item.word.trim().toLowerCase() === normalizedWord;
    });
    if (existedWord) {
      setErrorMessage('该单词已存在，请先搜索或编辑原词条。');
      setSuccessMessage('');
      return;
    }

    if (isEditMode && editingWord) {
      const updatedWord: WordItem = {
        ...editingWord,
        word: trimmedWord,
        meaning: trimmedMeaning,
        level: selectedLevel,
        note: note.trim(),
      };
      onUpdateWord(updatedWord);
      setErrorMessage('');
      setSuccessMessage('更新成功，已保存修改。');
      navigation.setParams({ editWordId: undefined });
      navigation.navigate('Words');
      return;
    }

    const newWord: WordItem = {
      id: `w-${Date.now()}`,
      word: trimmedWord,
      meaning: trimmedMeaning,
      level: selectedLevel,
      isDifficult: false,
      note: note.trim(),
      nextReviewDate: getDateText(new Date()),
      memoryLevel: 1,
      forgetStreak: 0,
      lastReviewedDate: null,
      reviewCount: 0,
    };

    onAddWord(newWord);
    setWord('');
    setMeaning('');
    setNote('');
    setSelectedLevel('B');
    setErrorMessage('');
    setSuccessMessage('保存成功，已加入单词库。');
    navigation.navigate('Words');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>单词</Text>
          <TextInput
            style={styles.input}
            placeholder="请输入英文单词"
            placeholderTextColor="#9ca3af"
            value={word}
            onChangeText={setWord}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>中文释义</Text>
          <TextInput
            style={styles.input}
            placeholder="请输入中文释义"
            placeholderTextColor="#9ca3af"
            value={meaning}
            onChangeText={setMeaning}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>等级</Text>
          <View style={styles.levelRow}>
            {levels.map((level) => {
              const isSelected = selectedLevel === level;
              return (
                <Pressable
                  key={level}
                  style={[styles.levelButton, isSelected ? styles.levelButtonSelected : null]}
                  onPress={() => setSelectedLevel(level)}
                >
                  <Text style={[styles.levelButtonText, isSelected ? styles.levelButtonTextSelected : null]}>
                    {level}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>备注</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="补充记忆信息（可选）"
            placeholderTextColor="#9ca3af"
            multiline
            textAlignVertical="top"
            value={note}
            onChangeText={setNote}
          />
        </View>

        {isEditMode && editingWord ? (
          <View style={styles.debugCard}>
            <Text style={styles.debugTitle}>复习字段（只读）</Text>
            <Text style={styles.debugText}>memoryLevel: {editingWord.memoryLevel}</Text>
            <Text style={styles.debugText}>forgetStreak: {editingWord.forgetStreak}</Text>
            <Text style={styles.debugText}>reviewCount: {editingWord.reviewCount}</Text>
            <Text style={styles.debugText}>lastReviewedDate: {editingWord.lastReviewedDate ?? '--'}</Text>
          </View>
        ) : null}

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{isEditMode ? '保存修改' : '保存'}</Text>
        </Pressable>
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
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    gap: 14,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  multilineInput: {
    height: 110,
    paddingVertical: 12,
  },
  levelRow: {
    flexDirection: 'row',
    gap: 10,
  },
  levelButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelButtonSelected: {
    borderColor: '#111827',
    backgroundColor: '#f9fafb',
  },
  levelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  levelButtonTextSelected: {
    color: '#111827',
  },
  errorText: {
    fontSize: 14,
    color: '#b91c1c',
  },
  successText: {
    fontSize: 14,
    color: '#166534',
  },
  debugCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    padding: 12,
    gap: 4,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 13,
    color: '#6b7280',
  },
  saveButton: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
