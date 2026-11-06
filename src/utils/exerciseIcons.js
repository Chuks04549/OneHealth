export function getExerciseEquipmentIcon(exercise) {
  const equipment = String(exercise?.equipment || '').toLowerCase();
  const category = String(exercise?.category || '').toLowerCase();

  if (equipment.includes('cable')) return 'cable-data';
  if (equipment.includes('machine')) return 'cog-outline';
  if (equipment.includes('kettlebell')) return 'kettlebell';
  if (equipment.includes('barbell')) return 'weight-lifter';
  if (equipment.includes('dumbbell')) return 'dumbbell';
  if (equipment.includes('bench') || equipment.includes('box')) return 'bench-back';
  if (equipment.includes('pull-up bar')) return 'human-handsup';
  if (equipment.includes('mat') || equipment.includes('pad')) return 'yoga';

  if (equipment.includes('bodyweight')) {
    if (category === 'cardio') return 'run';
    if (category === 'mobility') return 'yoga';
    if (category === 'core') return 'meditation';
    return 'human-handsup';
  }

  return 'arm-flex-outline';
}

