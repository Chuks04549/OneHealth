import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  EXERCISE_EQUIPMENT_FILTERS,
  EXERCISES, searchExercises,
} from '../data/exercises';
import { BorderRadius, Colors, Spacing, Typography } from '../theme';
import { getExerciseEquipmentIcon } from '../utils/exerciseIcons';
import useFloatingTabBarClearance from '../hooks/useFloatingTabBarClearance';
import ScreenHeader from '../components/ScreenHeader';
import GlassCard from '../components/GlassCard';
import { getFavoriteExerciseIds, toggleFavoriteExercise } from '../eugene/services/storage';

const MUSCLE_FILTER_GROUPS = [
  { label: 'Upper body', items: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms'] },
  { label: 'Lower body', items: ['Quadriceps', 'Hamstrings', 'Calves', 'Glutes'] },
  { label: 'General', items: ['All', 'Core', 'Cardio', 'Mobility'] },
];

export default function WorkoutScreen() {
  const navigation = useNavigation();
  const tabBarClearance = useFloatingTabBarClearance();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [equipment, setEquipment] = useState('All equipment');
  const [filterVisible, setFilterVisible] = useState(false);
  const [draftCategory, setDraftCategory] = useState('All');
  const [draftEquipment, setDraftEquipment] = useState('All equipment');
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [showPlaylist, setShowPlaylist] = useState(false);

  useFocusEffect(useCallback(() => {
    getFavoriteExerciseIds().then(setFavoriteIds);
  }, []));

  const filtersActive = category !== 'All' || equipment !== 'All equipment';

  const openFilters = () => {
    Keyboard.dismiss();
    setDraftCategory(category);
    setDraftEquipment(equipment);
    setFilterVisible(true);
  };

  const applyFilters = () => {
    setCategory(draftCategory);
    setEquipment(draftEquipment);
    setFilterVisible(false);
  };

  const exercises = useMemo(() => {
    const library = searchExercises(query, category, equipment);
    return showPlaylist ? library.filter((item) => favoriteIds.includes(item.id)) : library;
  }, [query, category, equipment, showPlaylist, favoriteIds]);

  const toggleFavorite = async (exerciseId) => setFavoriteIds(await toggleFavoriteExercise(exerciseId));

  const renderExercise = ({ item }) => (
      <TouchableOpacity
        style={styles.exerciseCard}
        onPress={() => navigation.navigate('WorkoutDetail', { exerciseId: item.id })}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={`View instructions for ${item.name}`}
      >
        <View style={styles.exerciseIcon}>
          <MaterialCommunityIcons name={getExerciseEquipmentIcon(item)} size={22} color={Colors.primary} />
        </View>
        <View style={styles.exerciseContent}>
          <Text style={styles.exerciseName}>{item.name}</Text>
          <Text style={styles.exerciseMuscles} numberOfLines={1}>{item.muscles.join(' · ')}</Text>
          <View style={styles.exerciseMeta}>
            <Text style={styles.equipment} numberOfLines={1}>{item.equipment}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.likeButton} onPress={() => toggleFavorite(item.id)} accessibilityLabel={favoriteIds.includes(item.id) ? `Remove ${item.name} from saved workouts` : `Save ${item.name} to workouts playlist`}>
          <Feather name="heart" size={20} color={favoriteIds.includes(item.id) ? Colors.error : Colors.primary} fill={favoriteIds.includes(item.id) ? Colors.error : Colors.primaryLight} />
        </TouchableOpacity>
        <Feather name="chevron-right" size={20} color={Colors.textLight} />
      </TouchableOpacity>
  );

  return (
    <View style={styles.safeArea}>
      <ScreenHeader
        title="Workouts"
        actions={[
          { icon: 'message-circle', onPress: () => navigation.navigate('Chat'), accessibilityLabel: 'Open Eugene' },
          { icon: 'settings', onPress: () => navigation.navigate('Settings'), accessibilityLabel: 'Open settings' },
        ]}
      />

      <View style={styles.searchRow}>
        <GlassCard noPadding style={styles.searchCard} contentStyle={styles.searchContainer}>
          <Feather name="search" size={20} color={Colors.textLight} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search exercise, muscle, or equipment"
            placeholderTextColor={Colors.textLight}
            returnKeyType="search"
            clearButtonMode="while-editing"
            accessibilityLabel="Search exercise library"
          />
          {!!query && (
            <TouchableOpacity onPress={() => setQuery('')} accessibilityLabel="Clear workout search">
              <Feather name="x-circle" size={19} color={Colors.textLight} />
            </TouchableOpacity>
          )}
        </GlassCard>
        <TouchableOpacity
          style={[styles.filterButton, filtersActive && styles.filterButtonActive]}
          onPress={openFilters}
          accessibilityLabel="Filter exercises"
        >
          <Feather name="sliders" size={21} color={filtersActive ? Colors.textWhite : Colors.text} />
          {filtersActive ? <View style={styles.filterActiveDot} /> : null}
        </TouchableOpacity>
      </View>

      <View style={styles.listHeading}>
        <Text style={styles.listTitle}>{showPlaylist ? 'Saved workouts' : category === 'All' ? 'All exercises' : category}</Text>
        <TouchableOpacity style={[styles.playlistButton, showPlaylist && styles.playlistButtonActive]} onPress={() => setShowPlaylist((value) => !value)}><Feather name="heart" size={15} color={showPlaylist ? Colors.textWhite : Colors.primary} fill={showPlaylist ? Colors.textWhite : Colors.primaryLight} /><Text style={[styles.playlistText, showPlaylist && styles.playlistTextActive]}>{favoriteIds.length} saved</Text></TouchableOpacity>
      </View>

      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        renderItem={renderExercise}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarClearance },
          exercises.length === 0 && styles.emptyListContent,
        ]}
        ItemSeparatorComponent={() => <View style={styles.rowDivider} />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScrollBeginDrag={Keyboard.dismiss}
        ListEmptyComponent={(
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Feather name={showPlaylist ? 'heart' : 'search'} size={28} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>{showPlaylist ? 'Your playlist is empty' : 'No exercises found'}</Text>
            <Text style={styles.emptyText}>{showPlaylist ? 'Tap the heart on a workout to save it here for quick access.' : 'Try another exercise, muscle group, or piece of equipment.'}</Text>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setShowPlaylist(false);
                setQuery('');
                setCategory('All');
                setEquipment('All equipment');
              }}
            >
              <Text style={styles.clearButtonText}>Clear search</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal
        visible={filterVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterVisible(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setFilterVisible(false)} />
          <View style={styles.filterSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filter</Text>
              <TouchableOpacity style={styles.sheetCloseButton} onPress={() => setFilterVisible(false)}>
                <Feather name="x" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {MUSCLE_FILTER_GROUPS.map((group) => (
                <View key={group.label} style={styles.muscleFilterGroup}>
                  <Text style={styles.muscleFilterGroupTitle}>{group.label}</Text>
                  <View style={styles.muscleFilterChips}>
                    {group.items.map((item) => {
                      const selected = item === draftCategory;
                      return (
                        <TouchableOpacity
                          key={item}
                          style={[styles.filterChip, selected && styles.filterChipSelected]}
                          onPress={() => setDraftCategory(item)}
                        >
                          <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{item}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}

              <Text style={styles.filterGroupTitle}>Equipment</Text>
              <View style={styles.filterChipGrid}>
                {EXERCISE_EQUIPMENT_FILTERS.map((item) => {
                  const selected = item.label === draftEquipment;
                  return (
                    <TouchableOpacity
                      key={item.label}
                      style={[styles.filterChip, selected && styles.filterChipSelected]}
                      onPress={() => setDraftEquipment(item.label)}
                    >
                      <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{item.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => {
                  setDraftCategory('All');
                  setDraftEquipment('All equipment');
                }}
              >
                <Text style={styles.resetButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                <Text style={styles.applyButtonText}>Apply filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
  },
  searchCard: {
    flex: 1,
    height: 50,
    borderRadius: BorderRadius.full,
  },
  searchContainer: {
    flex: 1,
    height: '100%',
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchInput: { flex: 1, height: '100%', fontSize: Typography.fontSize.md, color: Colors.text },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.glassFill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.glassCardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterActiveDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textWhite,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    height: 36,
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.glassFill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.glassCardBorder,
  },
  filterChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { color: Colors.textSecondary, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium },
  filterTextSelected: { color: Colors.textWhite, fontWeight: Typography.fontWeight.semibold },
  listHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  listTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.text },
  playlistButton: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 7 },
  playlistButtonActive: { backgroundColor: Colors.primary },
  playlistText: { color: Colors.primaryDark, fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },
  playlistTextActive: { color: Colors.textWhite },
  list: { flex: 1 },
  listContent: { paddingHorizontal: Spacing.xl },
  rowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.divider, marginLeft: 48 + Spacing.md },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  exerciseIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  exerciseContent: { flex: 1, marginRight: Spacing.sm },
  likeButton: { width: 38, height: 38, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center', marginRight: 2 },
  exerciseName: { color: Colors.text, fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold },
  exerciseMuscles: { color: Colors.textSecondary, fontSize: Typography.fontSize.sm, marginTop: 3 },
  exerciseMeta: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm },
  equipment: { color: Colors.textLight, fontSize: Typography.fontSize.xs },
  emptyListContent: { flexGrow: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxl, paddingBottom: 80 },
  emptyIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: Colors.text, fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, marginTop: Spacing.lg },
  emptyText: { color: Colors.textSecondary, fontSize: Typography.fontSize.sm, textAlign: 'center', lineHeight: 20, marginTop: Spacing.sm },
  clearButton: { marginTop: Spacing.lg, backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: BorderRadius.full },
  clearButtonText: { color: Colors.textWhite, fontWeight: Typography.fontWeight.semibold },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.42)' },
  filterSheet: {
    maxHeight: '82%',
    backgroundColor: Colors.elevatedSurface,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.lg },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  sheetTitle: { flex: 1, color: Colors.text, fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold },
  sheetCloseButton: { width: 40, height: 40, borderRadius: BorderRadius.full, backgroundColor: Colors.controlFill, alignItems: 'center', justifyContent: 'center' },
  filterGroupTitle: { color: Colors.text, fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, marginBottom: Spacing.md },
  muscleFilterGroup: { marginBottom: Spacing.md },
  muscleFilterGroupTitle: { color: Colors.textSecondary, fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: Spacing.sm },
  muscleFilterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  filterChipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  sheetActions: { flexDirection: 'row', gap: Spacing.md, paddingTop: Spacing.md },
  resetButton: { flex: 1, minHeight: 50, borderRadius: BorderRadius.full, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  resetButtonText: { color: Colors.text, fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold },
  applyButton: { flex: 2, minHeight: 50, borderRadius: BorderRadius.full, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  applyButtonText: { color: Colors.textWhite, fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold },
});
