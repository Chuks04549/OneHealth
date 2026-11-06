import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

export default function QuickReplies({ options, onSelect }) {
  if (!options || options.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.row}
      contentContainerStyle={styles.rowContent}
      keyboardShouldPersistTaps="handled"
    >
      {options.map((opt) => (
        <Pressable key={opt} style={styles.chip} onPress={() => onSelect(opt)}>
          <Text style={styles.chipText}>{opt}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexGrow: 0, maxHeight: 46, marginBottom: 10 },
  rowContent: { paddingHorizontal: 20, alignItems: 'center' },
  chip: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: colors.surface,
  },
  chipText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
});
