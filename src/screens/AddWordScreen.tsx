import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const fields = [
  { label: '单词', placeholder: '请输入英文单词' },
  { label: '中文释义', placeholder: '请输入中文释义' },
  { label: '等级', placeholder: 'A / B / C' },
  { label: '备注', placeholder: '补充记忆信息（可选）', multiline: true },
];

export function AddWordScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        {fields.map((field) => (
          <View key={field.label} style={styles.fieldGroup}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              style={[styles.input, field.multiline ? styles.multilineInput : undefined]}
              placeholder={field.placeholder}
              placeholderTextColor="#9ca3af"
              multiline={field.multiline}
              textAlignVertical={field.multiline ? 'top' : 'center'}
            />
          </View>
        ))}
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
});
