import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { WordItem, WordLevel } from '../mock/words';

const levels = ['A', 'B', 'C'] as const;

type AddWordScreenProps = {
  words: WordItem[];
  editWordId?: string;
  onUpdateWord: (
    wordId: string,
    payload: {
      word: string;
      meaning: string;
      level: WordLevel;
      note: string;
      isDifficult: boolean;
    }
  ) => Promise<void>;
  onCreateWordFromApi: (payload: {
    word: string;
    meaning: string;
    level: WordLevel;
    note: string;
    isDifficult: boolean;
  }) => Promise<void>;
  onSyncWordsFromApi: () => Promise<void>;
};

export function AddWordScreen({
  words,
  editWordId,
  onUpdateWord,
  onCreateWordFromApi,
  onSyncWordsFromApi,
}: AddWordScreenProps) {
  const navigation = useNavigation<NavigationProp<{ Words: undefined; AddWord: { editWordId?: string } | undefined }>>();
  const editingWord = useMemo(() => words.find((item) => item.id === editWordId), [editWordId, words]);
  const isEditMode = Boolean(editingWord);
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [note, setNote] = useState('');
  const [isDifficult, setIsDifficult] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<WordLevel>('B');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!editingWord) {
      setWord('');
      setMeaning('');
      setNote('');
      setIsDifficult(false);
      setSelectedLevel('B');
      setErrorMessage('');
      setSuccessMessage('');
      return;
    }

    setWord(editingWord.word);
    setMeaning(editingWord.meaning);
    setNote(editingWord.note);
    setIsDifficult(editingWord.isDifficult);
    setSelectedLevel(editingWord.level);
    setErrorMessage('');
    setSuccessMessage('');
  }, [editingWord]);

  const handleSave = async () => {
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
      try {
        await onUpdateWord(editingWord.id, {
          word: trimmedWord,
          meaning: trimmedMeaning,
          level: selectedLevel,
          isDifficult,
          note: note.trim(),
        });
        setErrorMessage('');
        setSuccessMessage('更新成功，已保存修改。');
        navigation.setParams({ editWordId: undefined });
        navigation.navigate('Words');
      } catch (error) {
        const message = error instanceof Error ? error.message : '更新失败，请稍后重试';
        setErrorMessage(message);
        setSuccessMessage('');
      }
      return;
    }

    try {
      await onCreateWordFromApi({
        word: trimmedWord,
        meaning: trimmedMeaning,
        level: selectedLevel,
        isDifficult,
        note: note.trim(),
      });
      await onSyncWordsFromApi();
      setWord('');
      setMeaning('');
      setNote('');
      setSelectedLevel('B');
      setIsDifficult(false);
      setErrorMessage('');
      setSuccessMessage('保存成功，已加入单词库。');
      navigation.navigate('Words');
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存失败，请稍后重试';
      setErrorMessage(message);
      setSuccessMessage('');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.panel}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            navigation.setParams({ editWordId: undefined });
            navigation.navigate('Words');
          }}
        >
          <Text style={styles.backButtonText}>返回 Words</Text>
        </Pressable>

        <View style={styles.card}>
        <Text style={styles.title}>{isEditMode ? 'Edit Word' : 'Add Word'}</Text>
        <Text style={styles.subtitle}>
          {isEditMode ? '修改词条后会同步写回后端词库' : '手动录入单词并加入你的个人词库'}
        </Text>

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

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>难词标记</Text>
          <Pressable
            style={[styles.toggleButton, isDifficult ? styles.toggleButtonActive : null]}
            onPress={() => setIsDifficult((prev) => !prev)}
          >
            <Text style={[styles.toggleButtonText, isDifficult ? styles.toggleButtonTextActive : null]}>
              {isDifficult ? '已标记为难词' : '未标记为难词'}
            </Text>
          </Pressable>
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
    paddingVertical: 18,
  },
  panel: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    gap: 14,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 20,
    gap: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6b7280',
  },
  fieldGroup: {
    gap: 10,
  },
  label: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '600',
  },
  input: {
    width: '100%',
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
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
    lineHeight: 20,
  },
  successText: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
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
  toggleButton: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  toggleButtonActive: {
    borderColor: '#111827',
    backgroundColor: '#f9fafb',
  },
  toggleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  toggleButtonTextActive: {
    color: '#111827',
  },
  saveButton: {
    minHeight: 56,
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
