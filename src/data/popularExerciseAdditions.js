// Candidate exercises used to fill muscle/equipment filter combinations that
// have fewer than three local results. Existing library entries always win.
export const POPULAR_EXERCISE_ADDITIONS = {
  Chest: {
    Bodyweight: ['Wide-Grip Push-Up', 'Decline Push-Up', 'Archer Push-Up'],
    Dumbbells: ['Dumbbell Bench Press', 'Dumbbell Chest Fly', 'Dumbbell Floor Press'],
    Barbells: ['Incline Barbell Bench Press', 'Decline Barbell Bench Press', 'Close-Grip Barbell Bench Press'],
    Cables: ['Cable Crossover', 'Low-to-High Cable Fly', 'Single-Arm Cable Chest Press'],
    Machines: ['Machine Chest Press', 'Pec Deck Fly', 'Incline Chest Press Machine'],
    Kettlebells: ['Kettlebell Floor Press', 'Kettlebell Crush Press', 'Alternating Kettlebell Chest Press'],
    'Bench / box': ['Bench Dip for Chest', 'Box Push-Up', 'Feet-Elevated Bench Push-Up'],
  },
  Back: {
    Bodyweight: ['Inverted Bodyweight Row', 'Superman Pull', 'Prone Y Raise'],
    Dumbbells: ['Dumbbell Bent-Over Row', 'Dumbbell Pullover', 'Renegade Row'],
    Barbells: ['Barbell Bent-Over Row', 'Pendlay Row', 'Barbell Seal Row'],
    Cables: ['Straight-Arm Cable Pulldown', 'Single-Arm Cable Row', 'Wide-Grip Cable Row'],
    Machines: ['Chest-Supported Row Machine', 'Machine High Row', 'Assisted Pull-Up Machine'],
    Kettlebells: ['Kettlebell Gorilla Row', 'Single-Arm Kettlebell Row', 'Kettlebell Renegade Row'],
    'Bench / box': ['Bench-Supported Dumbbell Row', 'Incline Bench Rear-Delt Row', 'Prone Bench Row'],
  },
  Legs: {
    Bodyweight: ['Wall Sit', 'Walking Lunge', 'Single-Leg Squat'],
    Dumbbells: ['Dumbbell Front Squat', 'Dumbbell Walking Lunge', 'Dumbbell Romanian Deadlift'],
    Barbells: ['Barbell Front Squat', 'Barbell Romanian Deadlift', 'Barbell Reverse Lunge'],
    Cables: ['Cable Squat', 'Cable Reverse Lunge', 'Cable Standing Leg Curl'],
    Machines: ['Leg Press', 'Leg Extension Machine', 'Seated Leg Curl'],
    Kettlebells: ['Kettlebell Front Squat', 'Kettlebell Reverse Lunge', 'Kettlebell Romanian Deadlift'],
    'Bench / box': ['Bulgarian Split Squat', 'Box Squat', 'Box Jump'],
  },
  Glutes: {
    Bodyweight: ['Donkey Kick', 'Fire Hydrant', 'Single-Leg Glute Bridge'],
    Dumbbells: ['Dumbbell Hip Thrust', 'Dumbbell Sumo Squat', 'Dumbbell Step-Up'],
    Barbells: ['Barbell Glute Bridge', 'Barbell Sumo Deadlift', 'Barbell Good Morning'],
    Cables: ['Cable Glute Kickback', 'Cable Pull-Through', 'Cable Hip Abduction'],
    Machines: ['Hip Abduction Machine', 'Glute Drive Machine', 'Reverse Hyperextension Machine'],
    Kettlebells: ['Kettlebell Swing', 'Kettlebell Sumo Deadlift', 'Kettlebell Step-Up'],
    'Bench / box': ['Bench Hip Thrust', 'Box Step-Up for Glutes', 'Bench Bulgarian Split Squat'],
  },
  Shoulders: {
    Bodyweight: ['Pike Push-Up', 'Handstand Hold', 'Wall Walk'],
    Dumbbells: ['Dumbbell Front Raise', 'Arnold Press', 'Dumbbell Rear-Delt Fly'],
    Barbells: ['Barbell Overhead Press', 'Barbell Upright Row', 'Barbell Front Raise'],
    Cables: ['Cable Lateral Raise', 'Cable Front Raise', 'Cable Rear-Delt Fly'],
    Machines: ['Machine Shoulder Press', 'Machine Lateral Raise', 'Reverse Pec Deck'],
    Kettlebells: ['Kettlebell Overhead Press', 'Kettlebell Halo', 'Kettlebell Bottoms-Up Press'],
    'Bench / box': ['Seated Bench Shoulder Press', 'Bench-Supported Lateral Raise', 'Feet-Elevated Pike Push-Up'],
  },
  Arms: {
    Bodyweight: ['Diamond Push-Up', 'Bodyweight Triceps Extension', 'Chin-Up for Biceps'],
    Dumbbells: ['Hammer Curl', 'Dumbbell Triceps Kickback', 'Overhead Dumbbell Triceps Extension'],
    Barbells: ['Barbell Biceps Curl', 'EZ-Bar Skull Crusher', 'Close-Grip Barbell Press'],
    Cables: ['Cable Biceps Curl', 'Overhead Cable Triceps Extension', 'Rope Hammer Curl'],
    Machines: ['Machine Preacher Curl', 'Assisted Dip Machine', 'Machine Triceps Extension'],
    Kettlebells: ['Kettlebell Biceps Curl', 'Kettlebell Skull Crusher', 'Kettlebell Triceps Extension'],
    'Bench / box': ['Bench Triceps Dip', 'Incline Bench Dumbbell Curl', 'Bench Skull Crusher'],
  },
  Core: {
    Bodyweight: ['Hollow-Body Hold', 'Reverse Crunch', 'Bicycle Crunch'],
    Dumbbells: ['Dumbbell Russian Twist', 'Dumbbell Side Bend', 'Dumbbell Dead Bug'],
    Barbells: ['Barbell Rollout', 'Landmine Rotation', 'Barbell Side Bend'],
    Cables: ['Cable Wood Chop', 'Kneeling Cable Crunch', 'Pallof Press'],
    Machines: ['Ab Crunch Machine', 'Rotary Torso Machine', 'Captain Chair Knee Raise'],
    Kettlebells: ['Kettlebell Windmill', 'Kettlebell Suitcase Carry', 'Kettlebell Turkish Get-Up'],
    'Bench / box': ['Bench Reverse Crunch', 'Decline Bench Sit-Up', 'Box Plank Shoulder Tap'],
  },
};

export const ADDITION_EQUIPMENT = {
  Bodyweight: 'Bodyweight',
  Dumbbells: 'Dumbbells',
  Barbells: 'Barbell',
  Cables: 'Cable station',
  Machines: 'Strength machine',
  Kettlebells: 'Kettlebell',
  'Bench / box': 'Bench or box',
};

