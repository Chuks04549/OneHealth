import { ADDITION_EQUIPMENT, POPULAR_EXERCISE_ADDITIONS } from './popularExerciseAdditions.js';

const exercise = (
  id,
  name,
  category,
  muscles,
  equipment,
  difficulty,
  summary,
  setup,
  steps,
  cues,
  mistakes,
  easier,
  harder,
) => ({
  id,
  name,
  category,
  muscles,
  equipment,
  difficulty,
  summary,
  setup,
  steps,
  cues,
  mistakes,
  easier,
  harder,
});

export const EXERCISE_CATEGORIES = [
  'All',
  'Chest',
  'Back',
  'Quadriceps',
  'Hamstrings',
  'Calves',
  'Glutes',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Forearms',
  'Core',
  'Cardio',
  'Mobility',
];

export const EXERCISE_EQUIPMENT_FILTERS = [
  { label: 'All equipment', keywords: [] },
  { label: 'Bodyweight', keywords: ['bodyweight'] },
  { label: 'Dumbbells', keywords: ['dumbbell'] },
  { label: 'Barbells', keywords: ['barbell'] },
  { label: 'Cables', keywords: ['cable'] },
  { label: 'Machines', keywords: ['machine'] },
  { label: 'Kettlebells', keywords: ['kettlebell'] },
  { label: 'Bench / box', keywords: ['bench', 'box'] },
];

const BASE_EXERCISES = [
  exercise('push-up', 'Push-Up', 'Chest', ['Chest', 'Triceps', 'Shoulders', 'Core'], 'Bodyweight', 'Beginner', 'A foundational horizontal pressing movement that also trains full-body tension.', 'Place your hands slightly wider than shoulder width. Form a straight line from head to heels and brace your abdomen.', ['Lower your chest by bending your elbows about 30–45 degrees from your torso.', 'Pause just above the floor while keeping your hips level.', 'Press the floor away until your elbows are straight without locking aggressively.'], 'Inhale as you lower and exhale as you press. Keep your neck neutral and squeeze your glutes.', ['Letting the hips sag', 'Flaring the elbows straight out', 'Reaching the head toward the floor'], 'Elevate your hands on a bench or wall.', 'Elevate your feet or add a controlled three-second lowering phase.'),
  exercise('bench-press', 'Barbell Bench Press', 'Chest', ['Chest', 'Triceps', 'Front shoulders'], 'Barbell and bench', 'Intermediate', 'A compound press for upper-body strength and chest development.', 'Lie with eyes under the bar, feet planted, shoulder blades gently pulled down and together, and hands just wider than shoulders.', ['Unrack the bar over your shoulders with straight arms.', 'Lower it under control toward the lower chest while keeping wrists stacked over elbows.', 'Press up and slightly back until the bar returns over your shoulders.'], 'Take a breath and brace before lowering; exhale after passing the hardest point. Keep your upper back anchored.', ['Bouncing the bar', 'Lifting the hips', 'Allowing wrists to fold backward'], 'Use dumbbells or a chest-press machine.', 'Add weight gradually while maintaining the same bar path.'),
  exercise('incline-dumbbell-press', 'Incline Dumbbell Press', 'Chest', ['Upper chest', 'Triceps', 'Front shoulders'], 'Dumbbells and incline bench', 'Intermediate', 'An angled press that emphasizes the upper chest while allowing each arm to move independently.', 'Set the bench to roughly 20–35 degrees. Hold the dumbbells over your upper chest with feet firmly planted.', ['Lower both dumbbells beside the upper chest with forearms nearly vertical.', 'Pause when you feel a controlled chest stretch.', 'Press the dumbbells up and slightly inward without clanking them together.'], 'Keep the shoulder blades supported and ribs controlled. Exhale through the press.', ['Setting the bench too steep', 'Shrugging the shoulders', 'Dropping the weights too deep'], 'Use a lighter load or a machine incline press.', 'Use a slower lowering phase or alternating presses.'),
  exercise('cable-fly', 'Cable Chest Fly', 'Chest', ['Chest', 'Front shoulders'], 'Cable machine', 'Intermediate', 'A chest isolation exercise with consistent resistance through the range of motion.', 'Set handles around chest height, take a staggered stance, and hold a soft bend in the elbows.', ['Bring your hands together in a wide hugging motion.', 'Briefly squeeze the chest without rounding your shoulders forward.', 'Return slowly until the upper arms align with the torso.'], 'Keep elbow angle nearly fixed and your torso still. Exhale as the hands come together.', ['Turning it into a press', 'Using momentum', 'Overstretching behind the body'], 'Use resistance bands or reduce the cable load.', 'Use a one-arm variation to challenge trunk stability.'),
  exercise('pull-up', 'Pull-Up', 'Back', ['Lats', 'Upper back', 'Biceps', 'Core'], 'Pull-up bar', 'Intermediate', 'A vertical pull that builds back and arm strength using bodyweight.', 'Grip the bar slightly wider than shoulders and begin from a controlled hang with ribs down.', ['Pull your shoulder blades down before bending the elbows.', 'Drive elbows toward your sides until your chin reaches bar height.', 'Lower under control to a full but active hang.'], 'Exhale as you pull. Think “chest tall, elbows down” rather than craning your neck.', ['Kicking or swinging', 'Shrugging at the bottom', 'Only performing the top half'], 'Use an assistance band or assisted pull-up machine.', 'Add a pause at the top or external weight.'),
  exercise('lat-pulldown', 'Lat Pulldown', 'Back', ['Lats', 'Upper back', 'Biceps'], 'Cable machine', 'Beginner', 'A scalable vertical pulling exercise that teaches lat engagement.', 'Secure your thighs beneath the pad and take a grip just outside shoulder width.', ['Lean back only slightly and pull the bar toward the upper chest.', 'Drive elbows down while keeping shoulders away from ears.', 'Return the bar slowly until the arms are long.'], 'Keep the torso quiet and exhale during the pull.', ['Pulling behind the neck', 'Rocking far backward', 'Using only the arms'], 'Use a neutral-grip handle and lighter resistance.', 'Try single-arm pulldowns with a controlled stretch.'),
  exercise('one-arm-row', 'One-Arm Dumbbell Row', 'Back', ['Lats', 'Mid-back', 'Biceps'], 'Dumbbell and bench', 'Beginner', 'A supported row that trains each side of the back independently.', 'Support one hand and knee on a bench. Keep your spine long and the working arm hanging below the shoulder.', ['Pull the dumbbell toward your hip.', 'Pause while keeping the shoulder away from your ear.', 'Lower until the arm is straight without rotating your torso.'], 'Exhale as you row and keep both hip bones facing the floor.', ['Twisting the torso', 'Shrugging', 'Pulling toward the shoulder instead of hip'], 'Use a lighter dumbbell or a seated cable row.', 'Use a three-second lowering phase.'),
  exercise('seated-cable-row', 'Seated Cable Row', 'Back', ['Mid-back', 'Lats', 'Rear shoulders', 'Biceps'], 'Cable machine', 'Beginner', 'A stable horizontal pull for posture and upper-back strength.', 'Sit tall with knees softly bent and arms extended while keeping your lower back neutral.', ['Pull the handle toward the lower ribs.', 'Bring shoulder blades together without over-arching.', 'Extend the arms slowly while keeping the torso upright.'], 'Exhale during the pull. Lead with the elbows and keep shoulders low.', ['Rocking forward and backward', 'Rounding the lower back', 'Shrugging'], 'Use less resistance and shorten the range slightly.', 'Pause for two seconds with the handle at your ribs.'),
  exercise('bodyweight-squat', 'Bodyweight Squat', 'Legs', ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'], 'Bodyweight', 'Beginner', 'A fundamental knee-and-hip movement for daily strength and mobility.', 'Stand around shoulder width with toes turned out slightly. Brace gently and keep your whole foot grounded.', ['Sit your hips down and slightly back while bending the knees.', 'Descend as far as you can while maintaining a stable foot and neutral spine.', 'Push the floor away to stand tall.'], 'Let knees track in the direction of your toes. Inhale down and exhale up.', ['Knees collapsing inward', 'Heels lifting', 'Rounding to chase extra depth'], 'Squat to a chair or hold a stable support.', 'Use a slower tempo or progress to a goblet squat.'),
  exercise('goblet-squat', 'Goblet Squat', 'Legs', ['Quadriceps', 'Glutes', 'Core'], 'Dumbbell or kettlebell', 'Beginner', 'A front-loaded squat that encourages an upright torso and strong brace.', 'Hold one weight close to your chest with feet around shoulder width.', ['Brace and lower between your hips.', 'Keep elbows inside the knees near the bottom without forcing depth.', 'Drive through the whole foot to stand.'], 'Keep the weight close and ribs stacked over the pelvis.', ['Holding the weight away from the body', 'Knees caving in', 'Losing foot pressure'], 'Use a lighter weight or squat to a box.', 'Increase load or add a pause at the bottom.'),
  exercise('back-squat', 'Barbell Back Squat', 'Legs', ['Quadriceps', 'Glutes', 'Adductors', 'Core'], 'Barbell and rack', 'Advanced', 'A heavily loadable squat variation for lower-body strength.', 'Position the bar securely across the upper back, step out carefully, and set a stable stance.', ['Take a full breath and brace before descending.', 'Bend hips and knees together while keeping the bar over mid-foot.', 'Drive upward while maintaining knee alignment and torso tension.'], 'Use safety arms or a spotter. Reset your breath and brace before each repetition.', ['Descending without a brace', 'Knees collapsing', 'Allowing the bar to drift over the toes'], 'Use a goblet squat or safety-bar squat.', 'Progress load conservatively or add tempo work.'),
  exercise('reverse-lunge', 'Reverse Lunge', 'Legs', ['Quadriceps', 'Glutes', 'Hamstrings'], 'Bodyweight or dumbbells', 'Beginner', 'A single-leg exercise that is often more knee-friendly than stepping forward.', 'Stand tall with feet hip width and enough space behind you.', ['Step one foot backward and land on the ball of that foot.', 'Lower both knees while keeping the front foot planted.', 'Push through the front foot to return to standing.'], 'Keep the front knee tracking over the toes and torso tall.', ['Stepping directly behind the other foot', 'Pushing mostly from the back leg', 'Front heel lifting'], 'Hold a support or reduce the depth.', 'Add dumbbells or elevate the front foot.'),
  exercise('romanian-deadlift', 'Romanian Deadlift', 'Legs', ['Hamstrings', 'Glutes', 'Back extensors'], 'Barbell or dumbbells', 'Intermediate', 'A hip hinge that develops the posterior chain through a controlled stretch.', 'Stand tall holding the weight against your thighs with knees softly bent.', ['Push your hips backward while keeping the weights close to your legs.', 'Stop when your hamstrings limit the hinge and your back remains neutral.', 'Drive hips forward to stand without leaning backward.'], 'Keep the shins nearly vertical and lats engaged. Inhale before hinging; exhale near the top.', ['Turning it into a squat', 'Rounding the back', 'Letting weights drift forward'], 'Practice an unloaded hip hinge against a wall.', 'Increase load slowly or use a single-leg variation.'),
  exercise('calf-raise', 'Standing Calf Raise', 'Legs', ['Calves'], 'Bodyweight, machine, or dumbbells', 'Beginner', 'A simple ankle-strength exercise for the gastrocnemius and soleus.', 'Stand tall with the balls of your feet secure and hold support if needed.', ['Rise onto your toes as high as control allows.', 'Pause briefly at the top.', 'Lower the heels slowly through a comfortable range.'], 'Keep pressure through the big toe and avoid rolling the ankles outward.', ['Bouncing', 'Rushing the lowering phase', 'Letting ankles collapse'], 'Use both legs and a smaller range.', 'Perform one leg at a time or add weight.'),
  exercise('hip-thrust', 'Hip Thrust', 'Glutes', ['Glutes', 'Hamstrings'], 'Bench and barbell or dumbbell', 'Intermediate', 'A loaded hip-extension exercise that emphasizes the glutes.', 'Place your upper back against a stable bench and the weight securely across your hips.', ['Begin with hips lowered and chin gently tucked.', 'Drive through your heels until your hips are level with your knees and shoulders.', 'Squeeze the glutes, then lower under control.'], 'Keep ribs down so the motion comes from the hips rather than the lower back.', ['Overarching at the top', 'Feet too far away', 'Pushing through the toes'], 'Perform a floor glute bridge.', 'Add a pause, band, or additional load.'),
  exercise('glute-bridge', 'Glute Bridge', 'Glutes', ['Glutes', 'Hamstrings', 'Core'], 'Bodyweight', 'Beginner', 'An accessible floor exercise for learning controlled hip extension.', 'Lie on your back with knees bent and feet flat about hip width.', ['Brace gently and press through your heels.', 'Lift the hips until shoulders, hips, and knees form a line.', 'Pause, then lower without relaxing completely.'], 'Keep ribs down and finish by squeezing the glutes, not arching the back.', ['Pushing through the toes', 'Knees falling outward or inward', 'Hyperextending the lower back'], 'Reduce the lifting range.', 'Perform single-leg bridges or add a weight across the hips.'),
  exercise('step-up', 'Step-Up', 'Glutes', ['Glutes', 'Quadriceps', 'Hamstrings'], 'Box or bench', 'Beginner', 'A practical single-leg movement that builds stair-climbing strength.', 'Choose a stable box low enough to keep your pelvis level. Place the whole working foot on top.', ['Lean slightly forward and push through the elevated foot.', 'Stand fully on the box without jumping from the floor leg.', 'Step down slowly and repeat on the same or opposite side.'], 'Keep the knee tracking over the middle toes and control the descent.', ['Pushing off the trailing foot', 'Using a box that is too high', 'Knee collapsing inward'], 'Use a lower step and hand support.', 'Hold dumbbells or increase the step height moderately.'),
  exercise('overhead-press', 'Dumbbell Overhead Press', 'Shoulders', ['Shoulders', 'Triceps', 'Upper chest'], 'Dumbbells', 'Beginner', 'A vertical press for shoulder and triceps strength.', 'Sit or stand tall with dumbbells near shoulder height and wrists over elbows.', ['Brace your torso and press the weights overhead.', 'Finish with arms long without shrugging aggressively.', 'Lower slowly to shoulder height.'], 'Exhale during the press and keep ribs from flaring.', ['Leaning far backward', 'Pressing around the body unevenly', 'Dropping too low'], 'Use a machine or one light dumbbell at a time.', 'Stand to increase the stability demand or add load gradually.'),
  exercise('lateral-raise', 'Dumbbell Lateral Raise', 'Shoulders', ['Side shoulders'], 'Dumbbells', 'Beginner', 'An isolation exercise for the middle deltoids.', 'Stand tall with light dumbbells by your sides and elbows softly bent.', ['Raise the arms out and slightly forward.', 'Stop around shoulder height.', 'Lower slowly until the weights return beside you.'], 'Lead with the elbows and keep shoulders away from ears.', ['Using momentum', 'Shrugging', 'Lifting far above shoulder height'], 'Use lighter weights or one arm at a time.', 'Add a pause at shoulder height.'),
  exercise('face-pull', 'Cable Face Pull', 'Shoulders', ['Rear shoulders', 'Upper back', 'Rotator cuff'], 'Cable rope', 'Beginner', 'A pulling movement for rear-shoulder and upper-back control.', 'Set a rope around face height and step back with arms extended.', ['Pull the rope toward your forehead.', 'Separate the rope ends while driving elbows outward.', 'Pause, then return without letting shoulders roll forward.'], 'Stay tall and keep the neck relaxed.', ['Leaning backward', 'Shrugging', 'Using too much weight'], 'Use a light resistance band.', 'Add a longer pause in the contracted position.'),
  exercise('biceps-curl', 'Dumbbell Biceps Curl', 'Arms', ['Biceps', 'Forearms'], 'Dumbbells', 'Beginner', 'A direct elbow-flexion exercise for the biceps.', 'Stand tall with arms by your sides and palms forward or neutral.', ['Keep upper arms still as you bend the elbows.', 'Curl until the forearms approach the upper arms.', 'Lower fully under control.'], 'Keep wrists neutral and exhale while curling.', ['Swinging the torso', 'Elbows drifting far forward', 'Dropping the weights quickly'], 'Alternate arms with lighter weights.', 'Use a slower lowering phase or incline bench curls.'),
  exercise('triceps-pushdown', 'Cable Triceps Pushdown', 'Arms', ['Triceps'], 'Cable machine', 'Beginner', 'A stable isolation exercise for elbow extension.', 'Stand close to the cable with elbows tucked near your ribs.', ['Press the handle down by straightening the elbows.', 'Briefly contract the triceps at the bottom.', 'Return until forearms are just above parallel without moving the upper arms.'], 'Keep shoulders relaxed and torso still.', ['Flaring elbows', 'Leaning bodyweight onto the handle', 'Only using a partial range'], 'Use a resistance band.', 'Try a rope attachment or single-arm variation.'),
  exercise('close-grip-push-up', 'Close-Grip Push-Up', 'Arms', ['Triceps', 'Chest', 'Shoulders'], 'Bodyweight', 'Intermediate', 'A push-up variation that increases the demand on the triceps.', 'Set hands slightly narrower than shoulders and establish a straight body line.', ['Lower while keeping elbows near your sides.', 'Bring your chest toward your hands without letting hips sag.', 'Press back to the starting position.'], 'Brace the core and keep wrists beneath or just outside the shoulders.', ['Hands placed too close together', 'Elbows flaring', 'Losing body alignment'], 'Perform with hands elevated.', 'Elevate feet or add a pause near the bottom.'),
  exercise('plank', 'Forearm Plank', 'Core', ['Abdominals', 'Obliques', 'Glutes', 'Shoulders'], 'Bodyweight', 'Beginner', 'An anti-extension exercise that teaches full-body bracing.', 'Place elbows under shoulders and extend the legs behind you.', ['Lift knees and form a straight line from head to heels.', 'Gently tuck the pelvis and squeeze glutes.', 'Hold while breathing slowly without losing position.'], 'Imagine pulling elbows toward toes without moving them. Stop when form changes.', ['Hips sagging', 'Holding the breath', 'Looking too far forward'], 'Hold from the knees or elevate the forearms.', 'Use a longer lever or add controlled shoulder taps.'),
  exercise('dead-bug', 'Dead Bug', 'Core', ['Deep abdominals', 'Hip flexors'], 'Bodyweight', 'Beginner', 'A low-impact core exercise that trains trunk control while the limbs move.', 'Lie on your back with hips and knees at 90 degrees and arms pointed upward.', ['Gently press your lower back toward the floor.', 'Extend one leg and the opposite arm without losing trunk position.', 'Return slowly and alternate sides.'], 'Exhale as the limbs extend and make the range only as large as you can control.', ['Arching the lower back', 'Moving too quickly', 'Tensing the neck'], 'Move only the arms or tap one heel at a time.', 'Hold a light weight or extend both limbs farther.'),
  exercise('side-plank', 'Side Plank', 'Core', ['Obliques', 'Glutes', 'Shoulders'], 'Bodyweight', 'Intermediate', 'An anti-lateral-flexion hold for side-core and hip stability.', 'Lie on one side with elbow under shoulder and legs stacked or staggered.', ['Lift your hips until the body forms a straight line.', 'Keep chest facing forward and top hip stacked.', 'Hold while breathing, then lower with control.'], 'Press the floor away and keep the bottom shoulder active.', ['Hips rotating backward', 'Shoulder collapsing', 'Holding the breath'], 'Bend the lower knee for support.', 'Raise the top leg or use a longer hold.'),
  exercise('bird-dog', 'Bird Dog', 'Core', ['Core', 'Back extensors', 'Glutes', 'Shoulders'], 'Bodyweight', 'Beginner', 'A quadruped stability exercise for coordinated trunk control.', 'Start on hands and knees with wrists under shoulders and knees under hips.', ['Brace gently and extend one leg behind you.', 'Reach the opposite arm forward without rotating your pelvis.', 'Pause, return, and switch sides.'], 'Reach long rather than high and keep your belt line level.', ['Arching the back', 'Opening the hip', 'Shifting weight excessively'], 'Move only one limb at a time.', 'Draw the elbow and knee together between extensions.'),
  exercise('mountain-climber', 'Mountain Climber', 'Cardio', ['Core', 'Hip flexors', 'Shoulders', 'Legs'], 'Bodyweight', 'Intermediate', 'A full-body conditioning exercise performed from a high-plank position.', 'Begin in a strong high plank with hands under shoulders.', ['Drive one knee toward your chest.', 'Return that foot as the other knee comes forward.', 'Continue at a pace that preserves a stable torso.'], 'Keep hips level and land quietly. Breathe rhythmically rather than holding your breath.', ['Bouncing the hips', 'Hands too far forward', 'Moving faster than control allows'], 'Use a slow marching pace or elevate your hands.', 'Increase cadence or use timed intervals.'),
  exercise('jumping-jack', 'Jumping Jack', 'Cardio', ['Legs', 'Shoulders', 'Calves'], 'Bodyweight', 'Beginner', 'A simple rhythmic movement for warming up or moderate cardio intervals.', 'Stand tall with feet together and arms by your sides.', ['Jump the feet outward while raising arms overhead.', 'Land softly with knees aligned over toes.', 'Jump back to the starting position and repeat smoothly.'], 'Stay light on your feet and keep a steady breathing rhythm.', ['Landing stiff-legged', 'Knees collapsing inward', 'Rushing before warming up'], 'Step one foot out at a time instead of jumping.', 'Increase interval duration or use faster controlled repetitions.'),
  exercise('burpee', 'Burpee', 'Cardio', ['Full body', 'Chest', 'Legs', 'Core'], 'Bodyweight', 'Advanced', 'A demanding floor-to-standing conditioning movement.', 'Stand with clear floor space and choose whether to include a push-up or jump.', ['Squat and place hands on the floor.', 'Step or jump feet into a strong plank, then perform an optional push-up.', 'Return feet beneath you and stand or jump vertically with control.'], 'Move smoothly through each position. Stop before fatigue causes the lower back to sag.', ['Rushing the plank', 'Landing with knees inward', 'Holding the breath'], 'Step back and forward one foot at a time and omit the jump.', 'Add a push-up or controlled jump while keeping repetitions crisp.'),
  exercise('high-knees', 'High Knees', 'Cardio', ['Hip flexors', 'Quadriceps', 'Calves', 'Core'], 'Bodyweight', 'Intermediate', 'A running-style drill that elevates heart rate and reinforces quick ground contact.', 'Stand tall with arms bent and enough room to move safely.', ['Drive one knee upward while the opposite arm moves forward.', 'Switch feet quickly beneath your center of mass.', 'Maintain tall posture and quiet, springy landings.'], 'Think quick contacts rather than forcing maximum knee height.', ['Leaning far backward', 'Heavy heel strikes', 'Losing arm rhythm'], 'March in place with deliberate knee lifts.', 'Use short faster intervals while maintaining posture.'),
  exercise('cat-cow', 'Cat–Cow', 'Mobility', ['Spine', 'Upper back', 'Abdominals'], 'Bodyweight', 'Beginner', 'A gentle spinal movement for warming up and exploring comfortable flexion and extension.', 'Begin on hands and knees with hands under shoulders and knees under hips.', ['Inhale as you gently lift your chest and tailbone.', 'Exhale as you press the floor away and round your back.', 'Move slowly between positions without forcing the endpoints.'], 'Let your breath lead the movement and keep shoulders away from ears.', ['Forcing neck motion', 'Moving only the lower back', 'Rushing'], 'Use a smaller pain-free range.', 'Pause briefly in each position and focus on moving one spinal segment at a time.'),
  exercise('worlds-greatest-stretch', 'World’s Greatest Stretch', 'Mobility', ['Hips', 'Hamstrings', 'Upper back', 'Hip flexors'], 'Bodyweight', 'Intermediate', 'A multi-joint mobility drill that combines a lunge, rotation, and hamstring shift.', 'Start in a high plank or standing position with clear floor space.', ['Step one foot outside the same-side hand into a long lunge.', 'Rotate that-side arm toward the ceiling while keeping the rear leg active.', 'Return the hand, shift hips back gently, then switch sides.'], 'Move slowly and keep each position comfortable rather than chasing maximum range.', ['Front knee collapsing inward', 'Forcing the rotation', 'Holding the breath'], 'Place hands on yoga blocks or keep the rear knee down.', 'Add a longer controlled pause in each phase.'),
  exercise('hip-flexor-stretch', 'Half-Kneeling Hip-Flexor Stretch', 'Mobility', ['Hip flexors', 'Quadriceps'], 'Mat or pad', 'Beginner', 'A controlled stretch for the front of the hip that avoids excessive lower-back extension.', 'Kneel on one knee with the other foot forward. Pad the rear knee and stand your torso tall.', ['Gently tuck your pelvis as if bringing your belt buckle upward.', 'Shift forward slightly until you feel the front of the rear hip.', 'Hold while breathing, then switch sides.'], 'Keep ribs stacked over the pelvis and squeeze the rear-side glute.', ['Arching the lower back', 'Lunging too far', 'Twisting the pelvis'], 'Use a smaller shift or hold a stable support.', 'Reach the rear-side arm overhead and lean slightly away.'),
  exercise('thoracic-rotation', 'Open-Book Rotation', 'Mobility', ['Upper back', 'Chest', 'Shoulders'], 'Bodyweight', 'Beginner', 'A side-lying rotation drill for the thoracic spine and chest.', 'Lie on your side with hips and knees bent and arms extended together in front.', ['Keep knees stacked as you sweep the top arm across your body.', 'Rotate through the upper back until you reach a comfortable endpoint.', 'Exhale, then return the arm and repeat before switching sides.'], 'Let your eyes follow the moving hand while keeping the lower body quiet.', ['Forcing the shoulder to the floor', 'Letting knees separate', 'Moving too quickly'], 'Place a pillow under the head and use a smaller range.', 'Pause for several breaths at the comfortable endpoint.'),
];

const MUSCLES_BY_CATEGORY = {
  Chest: ['Chest', 'Triceps', 'Front shoulders'],
  Back: ['Lats', 'Upper back', 'Biceps'],
  Legs: ['Quadriceps', 'Hamstrings', 'Calves'],
  Glutes: ['Glutes', 'Hamstrings', 'Hip stabilizers'],
  Shoulders: ['Front shoulders', 'Side shoulders', 'Rear shoulders'],
  Arms: ['Biceps', 'Triceps', 'Forearms'],
  Core: ['Abdominals', 'Obliques', 'Deep core'],
};

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function musclesForExercise(name, category) {
  const normalizedName = name.toLowerCase();
  if (category === 'Arms') {
    if (/triceps|skull|dip|close-grip|diamond/.test(normalizedName)) {
      return ['Triceps', 'Chest', 'Shoulders'];
    }
    if (/curl|chin-up/.test(normalizedName)) return ['Biceps', 'Forearms'];
  }
  if (category === 'Legs') {
    if (/romanian|leg curl|good morning/.test(normalizedName)) return ['Hamstrings', 'Glutes'];
    if (/calf/.test(normalizedName)) return ['Calves'];
    if (/leg extension/.test(normalizedName)) return ['Quadriceps'];
    if (/jump/.test(normalizedName)) return ['Quadriceps', 'Hamstrings', 'Calves', 'Glutes'];
    return ['Quadriceps', 'Hamstrings', 'Glutes'];
  }
  return MUSCLES_BY_CATEGORY[category];
}

function createPopularExercise(name, category, equipmentLabel) {
  const equipment = ADDITION_EQUIPMENT[equipmentLabel];
  const muscles = musclesForExercise(name, category);
  return exercise(
    `${slug(category)}-${slug(equipmentLabel)}-${slug(name)}`,
    name,
    category,
    muscles,
    equipment,
    'Intermediate',
    `A popular ${equipment.toLowerCase()} movement for training the ${category.toLowerCase()} with controlled, repeatable technique.`,
    `Prepare the ${equipment.toLowerCase()} and choose a resistance or variation you can control. Set a stable base, brace your trunk, and align the working joints before beginning.`,
    [
      `Move into the starting position for the ${name} while keeping the target area supported and your spine neutral.`,
      'Perform the working phase smoothly through a comfortable range without using momentum.',
      'Pause briefly with control, then return to the start slowly and reset before the next repetition.',
    ],
    `Breathe out through the working phase and inhale on the controlled return. Keep tension on the ${muscles.slice(0, 2).join(' and ').toLowerCase()}.`,
    ['Using more resistance than you can control', 'Rushing the return phase', 'Changing posture to create momentum'],
    'Reduce the resistance or shorten the range while keeping the movement controlled.',
    'Add resistance gradually, slow the return, or add a brief pause without sacrificing form.',
  );
}

function fillPopularExerciseCombinations(baseExercises) {
  const exercises = [...baseExercises];
  const existingNames = new Set(exercises.map((item) => item.name.trim().toLowerCase()));

  Object.entries(POPULAR_EXERCISE_ADDITIONS).forEach(([category, equipmentGroups]) => {
    Object.entries(equipmentGroups).forEach(([equipmentLabel, candidates]) => {
      const filter = EXERCISE_EQUIPMENT_FILTERS.find((item) => item.label === equipmentLabel);
      const countForCombination = () => exercises.filter((item) => (
        item.category === category
        && filter.keywords.some((keyword) => item.equipment.toLowerCase().includes(keyword))
      )).length;

      for (const name of candidates) {
        if (countForCombination() >= 3) break;
        const normalizedName = name.trim().toLowerCase();
        if (existingNames.has(normalizedName)) continue;
        exercises.push(createPopularExercise(name, category, equipmentLabel));
        existingNames.add(normalizedName);
      }
    });
  });

  return exercises;
}

export const EXERCISES = fillPopularExerciseCombinations(BASE_EXERCISES);

export function findExerciseById(id) {
  return EXERCISES.find((item) => item.id === id);
}

export function searchExercises(query, category = 'All', equipmentFilter = 'All equipment') {
  const normalizedQuery = query.trim().toLowerCase();
  const selectedEquipment = EXERCISE_EQUIPMENT_FILTERS.find(
    (filter) => filter.label === equipmentFilter,
  ) || EXERCISE_EQUIPMENT_FILTERS[0];

  return EXERCISES.filter((item) => {
    const normalizedCategory = category.toLowerCase();
    const matchesCategory = category === 'All'
      || item.category === category
      || item.muscles.some((muscle) => muscle.toLowerCase() === normalizedCategory);
    if (!matchesCategory) return false;

    const normalizedEquipment = item.equipment.toLowerCase();
    const matchesEquipment = selectedEquipment.keywords.length === 0
      || selectedEquipment.keywords.some((keyword) => normalizedEquipment.includes(keyword));
    if (!matchesEquipment) return false;

    if (!normalizedQuery) return true;

    const searchable = [
      item.name,
      item.category,
      item.equipment,
      item.summary,
      ...item.muscles,
    ].join(' ').toLowerCase();
    return searchable.includes(normalizedQuery);
  }).sort((first, second) => first.name.localeCompare(second.name));
}
