export interface YogaPose {
  id: number
  name: string
  english: string
  emoji: string
  benefits: string
  steps: string[]
  rarity: 'COMMON' | 'RARE' | 'EPIC'
  weight: number
  level: number
}

const yogaPoses: YogaPose[] = [
  // ───────── LEVEL 1 — Foundations (3 poses, need 2) ─────────
  {
    id: 1, level: 1, name: "Tadasana", english: "Mountain Pose", emoji: "🏔️", rarity: "COMMON", weight: 100,
    benefits: "Improves posture, strengthens thighs, knees, and ankles, firms abdomen and buttocks",
    steps: ["Stand with feet hip-width apart, arms at sides", "Ground all four corners of each foot", "Engage thighs, lift kneecaps slightly", "Lengthen spine, relax shoulders down, breathe deeply"],
  },
  {
    id: 6, level: 1, name: "Balasana", english: "Child's Pose", emoji: "🌙", rarity: "COMMON", weight: 100,
    benefits: "Gently stretches hips, thighs, and ankles; calms the brain; relieves stress and fatigue",
    steps: ["Kneel on the floor, sit back on your heels", "Fold forward, stretching arms out in front", "Rest forehead gently on the mat", "Breathe slowly, soften the shoulders with each exhale"],
  },
  {
    id: 10, level: 1, name: "Shavasana", english: "Corpse Pose", emoji: "💤", rarity: "COMMON", weight: 100,
    benefits: "Reduces stress and anxiety, lowers blood pressure, promotes deep relaxation",
    steps: ["Lie flat on your back, legs slightly apart", "Place arms at sides, palms facing up", "Close eyes, release all muscular tension", "Breathe naturally and let the body sink into the floor"],
  },

  // ───────── LEVEL 2 — Seated & Calm (4 poses, need 3) ─────────
  {
    id: 7, level: 2, name: "Sukhasana", english: "Easy Pose", emoji: "🧘", rarity: "COMMON", weight: 100,
    benefits: "Calms the mind, opens hips, lengthens spine, ideal for meditation",
    steps: ["Sit cross-legged on the floor or a cushion", "Rest hands on knees, palms up or down", "Lengthen spine from tailbone to crown", "Close eyes, breathe naturally for several minutes"],
  },
  {
    id: 9, level: 2, name: "Vajrasana", english: "Thunderbolt Pose", emoji: "⚡", rarity: "COMMON", weight: 100,
    benefits: "Aids digestion, strengthens pelvic muscles, calms the mind, relieves back pain",
    steps: ["Kneel on the floor, sit back on your heels", "Keep spine erect and hands on thighs", "Close eyes and breathe deeply through nose", "Hold for 5–10 minutes, especially after meals"],
  },
  {
    id: 25, level: 2, name: "Marjaryasana", english: "Cat Pose", emoji: "🐱", rarity: "COMMON", weight: 100,
    benefits: "Stretches back and neck, massages spine, improves posture and flexibility",
    steps: ["Start on all fours, wrists under shoulders", "Exhale and round the spine toward the ceiling", "Drop the head and tuck the tailbone", "Inhale to neutral and repeat in sync with breath"],
  },
  {
    id: 26, level: 2, name: "Bitilasana", english: "Cow Pose", emoji: "🐮", rarity: "RARE", weight: 20,
    benefits: "Improves spine flexibility, massages organs, relieves stress, warms up the body",
    steps: ["Start on all fours, wrists under shoulders", "Inhale, drop belly toward the floor", "Lift tailbone and chest, gaze forward", "Pair with Cat Pose for a flowing spinal warm-up"],
  },

  // ───────── LEVEL 3 — Standing Basics (5 poses, need 4) ─────────
  {
    id: 2, level: 3, name: "Vrikshasana", english: "Tree Pose", emoji: "🌳", rarity: "COMMON", weight: 100,
    benefits: "Improves balance and stability, strengthens legs and core, increases focus and concentration",
    steps: ["Stand in Tadasana, shift weight to left foot", "Place right foot on inner left thigh or calf (not knee)", "Bring palms together at chest or raise overhead", "Fix gaze on a steady point; hold 30–60 seconds per side"],
  },
  {
    id: 16, level: 3, name: "Utkatasana", english: "Chair Pose", emoji: "🪑", rarity: "COMMON", weight: 100,
    benefits: "Strengthens thighs and ankles, tones leg muscles, stimulates heart and diaphragm",
    steps: ["Stand in Tadasana, inhale and raise arms overhead", "Exhale, bend knees as if sitting in a chair", "Keep spine long, knees behind toes", "Hold for 30–60 seconds, breathing steadily"],
  },
  {
    id: 17, level: 3, name: "Uttanasana", english: "Standing Forward Bend", emoji: "🙇", rarity: "COMMON", weight: 100,
    benefits: "Stretches hamstrings and back, calms the mind, relieves stress and mild depression",
    steps: ["Stand hip-width apart, exhale and hinge at hips", "Fold forward, letting the head hang heavy", "Place hands on floor or hold opposite elbows", "Bend knees slightly if hamstrings are tight; hold 1 minute"],
  },
  {
    id: 46, level: 3, name: "Anjaneyasana", english: "Low Lunge", emoji: "🦵", rarity: "RARE", weight: 20,
    benefits: "Stretches hip flexors and quads, strengthens legs, opens chest, improves balance",
    steps: ["From Downward Dog, step right foot between hands", "Lower the left knee to the floor", "Sweep arms overhead, open chest, look up", "Hold 30–60 seconds, then switch sides"],
  },
  {
    id: 47, level: 3, name: "Malasana", english: "Garland Pose", emoji: "💎", rarity: "RARE", weight: 20,
    benefits: "Opens hips and groin, strengthens ankles, aids digestion, tones abdomen",
    steps: ["Stand with feet wider than hips, toes turned out", "Squat low, bringing hips below knees", "Press palms together at chest, elbows push knees open", "Keep heels grounded; hold for 1 minute"],
  },

  // ───────── LEVEL 4 — Warriors (5 poses, need 5) ─────────
  {
    id: 11, level: 4, name: "Virabhadrasana I", english: "Warrior I", emoji: "⚔️", rarity: "COMMON", weight: 100,
    benefits: "Strengthens legs, opens hips and chest, improves focus and stability",
    steps: ["Stand, step left foot back 3–4 feet", "Turn back foot out 45°, bend front knee to 90°", "Raise arms overhead, palms facing each other", "Square hips toward front; hold 30–60 seconds each side"],
  },
  {
    id: 12, level: 4, name: "Virabhadrasana II", english: "Warrior II", emoji: "🛡️", rarity: "COMMON", weight: 100,
    benefits: "Strengthens legs and arms, opens hips and chest, builds stamina and concentration",
    steps: ["Stand, step feet 3–4 feet apart", "Turn right foot out 90°, left foot in slightly", "Bend right knee over right ankle, extend arms parallel to floor", "Gaze over right fingertips; hold 30–60 seconds per side"],
  },
  {
    id: 14, level: 4, name: "Trikonasana", english: "Triangle Pose", emoji: "🔺", rarity: "RARE", weight: 20,
    benefits: "Stretches legs, hips, and spine; relieves backache; stimulates abdominal organs",
    steps: ["Stand with feet 3 feet apart, right foot out 90°", "Extend arms, hinge at right hip over right leg", "Touch right hand to shin, ankle, or floor", "Reach left arm to ceiling, gaze up; hold 1 minute per side"],
  },
  {
    id: 15, level: 4, name: "Parsvakonasana", english: "Side Angle Pose", emoji: "📐", rarity: "RARE", weight: 20,
    benefits: "Strengthens legs, stretches groin and spine, improves stamina, aids digestion",
    steps: ["From Warrior II, lower right forearm to right thigh", "Extend left arm over left ear, palm down", "Keep both sides of the torso long", "Hold 30–60 seconds, then switch sides"],
  },
  {
    id: 13, level: 4, name: "Virabhadrasana III", english: "Warrior III", emoji: "🦅", rarity: "EPIC", weight: 5,
    benefits: "Strengthens legs, ankles, and core; improves balance and posture",
    steps: ["From Warrior I, lean forward over front leg", "Lift back leg parallel to the floor", "Extend arms forward, body in one straight line", "Hold 20–30 seconds; use a wall for support if needed"],
  },

  // ───────── LEVEL 5 BONUS — Floor Poses (6 poses, need 6) ─────────
  {
    id: 3, level: 5, name: "Adho Mukha Svanasana", english: "Downward-Facing Dog", emoji: "🐕", rarity: "RARE", weight: 20,
    benefits: "Stretches hamstrings, calves, and shoulders; strengthens arms and legs; energizes the body",
    steps: ["Start on all fours, hands shoulder-width apart", "Tuck toes, lift hips toward ceiling", "Straighten legs as much as comfortable, press heels toward floor", "Hold 1–3 minutes, pedaling heels to loosen calves"],
  },
  {
    id: 4, level: 5, name: "Urdhva Mukha Svanasana", english: "Upward-Facing Dog", emoji: "☀️", rarity: "RARE", weight: 20,
    benefits: "Strengthens spine, arms, and wrists; opens chest and lungs; improves posture",
    steps: ["Lie face down, legs extended, top of feet on mat", "Place hands beside lower ribs, elbows bent", "Press hands and tops of feet down, lift torso and thighs off floor", "Roll shoulders back, gaze forward or up; hold 15–30 seconds"],
  },
  {
    id: 5, level: 5, name: "Bhujangasana", english: "Cobra Pose", emoji: "🐍", rarity: "RARE", weight: 20,
    benefits: "Strengthens spine, opens chest and shoulders, tones abdomen, soothes sciatica",
    steps: ["Lie face down, palms flat under shoulders", "Press tops of feet and thighs gently into mat", "Inhale, lift chest off floor using back muscles", "Keep elbows slightly bent; hold 15–30 seconds"],
  },
  {
    id: 27, level: 5, name: "Setu Bandhasana", english: "Bridge Pose", emoji: "🌉", rarity: "RARE", weight: 20,
    benefits: "Strengthens back and glutes, opens chest, calms the brain, relieves anxiety",
    steps: ["Lie on back, knees bent, feet flat hip-width apart", "Press feet and arms into floor, lift hips", "Clasp hands beneath the back, roll shoulders under", "Hold 30–60 seconds; lower slowly on exhale"],
  },
  {
    id: 20, level: 5, name: "Paschimottanasana", english: "Seated Forward Bend", emoji: "🙏", rarity: "RARE", weight: 20,
    benefits: "Stretches spine and hamstrings, calms the mind, relieves stress, stimulates liver and kidneys",
    steps: ["Sit with legs extended straight in front", "Inhale, lengthen spine; exhale, hinge from hips", "Reach for feet, shins, or ankles without rounding back", "Hold 1–3 minutes, breathing into the stretch"],
  },
  {
    id: 22, level: 5, name: "Baddha Konasana", english: "Bound Angle Pose", emoji: "🦋", rarity: "EPIC", weight: 5,
    benefits: "Opens hips and groin, stimulates abdominal organs, soothes menstrual discomfort",
    steps: ["Sit tall, bend knees and bring soles of feet together", "Hold feet with both hands, draw heels toward pelvis", "Let knees drop open toward floor", "Hinge forward from hips, keeping spine long; hold 2–5 minutes"],
  },

  // ───────── LEVEL 6 — Backbends (5 poses, need 5) ─────────
  {
    id: 28, level: 6, name: "Dhanurasana", english: "Bow Pose", emoji: "🏹", rarity: "RARE", weight: 20,
    benefits: "Strengthens back, opens chest and shoulders, stimulates digestion, improves posture",
    steps: ["Lie on belly, bend knees and reach back to hold ankles", "Inhale, kick feet away from hips to lift chest and thighs", "Roll shoulders back, keep neck neutral", "Hold 20–30 seconds; rest and repeat 2–3 times"],
  },
  {
    id: 29, level: 6, name: "Ustrasana", english: "Camel Pose", emoji: "🐪", rarity: "RARE", weight: 20,
    benefits: "Opens chest and hips, strengthens back, improves posture, stimulates abdominal organs",
    steps: ["Kneel with knees hip-width apart, hips above knees", "Place hands on lower back, fingers pointing down", "Lean back slowly, reaching hands to heels if possible", "Let head drop back gently; hold 30 seconds"],
  },
  {
    id: 30, level: 6, name: "Matsyasana", english: "Fish Pose", emoji: "🐟", rarity: "RARE", weight: 20,
    benefits: "Opens chest and throat, stretches neck, relieves respiratory issues, improves posture",
    steps: ["Lie on back, arms beside body", "Press forearms and elbows down, lift chest off floor", "Tilt head back to rest crown or top of head on mat", "Keep legs active; hold 15–30 seconds"],
  },
  {
    id: 40, level: 6, name: "Salabhasana", english: "Locust Pose", emoji: "🦗", rarity: "EPIC", weight: 5,
    benefits: "Strengthens back, glutes, and legs; opens chest; improves posture and digestion",
    steps: ["Lie face down, arms along body, palms up", "Inhale and lift head, chest, arms, and legs simultaneously", "Squeeze inner thighs, roll shoulders back", "Hold 15–30 seconds; repeat 2–3 times"],
  },
  {
    id: 48, level: 6, name: "Eka Pada Rajakapotasana", english: "Pigeon Pose", emoji: "🕊️", rarity: "EPIC", weight: 5,
    benefits: "Opens hips and chest, stretches thighs and groin, releases stored emotions and tension",
    steps: ["From Downward Dog, bring right knee behind right wrist", "Extend left leg straight back, square hips", "Walk hands forward and lower torso over front leg", "Hold 1–3 minutes per side; breathe into tight spots"],
  },

  // ───────── LEVEL 7 — Twists & Hip Openers (5 poses, need 5) ─────────
  {
    id: 41, level: 7, name: "Ardha Matsyendrasana", english: "Half Lord of the Fishes", emoji: "🌀", rarity: "RARE", weight: 20,
    benefits: "Increases spine flexibility, stimulates digestion, relieves back pain and fatigue",
    steps: ["Sit with legs extended, bend right knee, cross over left leg", "Plant right foot outside left thigh", "Inhale to lengthen spine, exhale twist right", "Hook left elbow outside right knee; hold 1 minute per side"],
  },
  {
    id: 42, level: 7, name: "Bharadvajasana", english: "Bharadvaja's Twist", emoji: "🌿", rarity: "RARE", weight: 20,
    benefits: "Stretches spine and shoulders, massages abdominal organs, relieves lower back pain",
    steps: ["Sit with legs extended, swing both legs to left", "Inhale to lengthen spine, exhale twist right", "Place right hand on floor behind, left hand on right knee", "Keep both sitting bones grounded; hold 1 minute per side"],
  },
  {
    id: 43, level: 7, name: "Parivrtta Trikonasana", english: "Revolved Triangle", emoji: "🔄", rarity: "EPIC", weight: 5,
    benefits: "Stretches legs and spine, improves digestion, relieves back pain, increases balance",
    steps: ["Stand, step feet 3 feet apart, right foot out 90°", "Extend arms, hinge forward over right leg", "Bring left hand to right shin or floor, rotate torso", "Extend right arm to ceiling; hold 30–60 seconds per side"],
  },
  {
    id: 44, level: 7, name: "Garudasana", english: "Eagle Pose", emoji: "🦅", rarity: "EPIC", weight: 5,
    benefits: "Improves balance and focus, stretches shoulders and upper back, strengthens legs",
    steps: ["Stand, bend knees slightly, cross right thigh over left", "Wrap right foot behind left calf if possible", "Cross left arm over right at elbows, wrap forearms", "Lift elbows to shoulder height; hold 30 seconds per side"],
  },
  {
    id: 49, level: 7, name: "Supta Baddha Konasana", english: "Reclined Bound Angle", emoji: "😌", rarity: "RARE", weight: 20,
    benefits: "Opens hips and groin, calms the nervous system, relieves stress and fatigue",
    steps: ["Lie on back, bring soles of feet together", "Let knees fall open to sides like a butterfly", "Place hands on belly or extend arms wide", "Relax completely; hold 3–5 minutes with supported props"],
  },

  // ───────── LEVEL 8 — Inversions (5 poses, need 5) ─────────
  {
    id: 31, level: 8, name: "Halasana", english: "Plow Pose", emoji: "🌾", rarity: "EPIC", weight: 5,
    benefits: "Stretches shoulders and spine, calms the brain, stimulates thyroid, relieves backache",
    steps: ["Lie on back, lift legs overhead in Shoulder Stand", "Lower legs toward floor behind the head", "Support lower back with hands or lay arms flat", "Keep throat relaxed; hold 1–5 minutes"],
  },
  {
    id: 32, level: 8, name: "Sarvangasana", english: "Shoulder Stand", emoji: "🙃", rarity: "EPIC", weight: 5,
    benefits: "Stimulates thyroid and prostate glands, calms the brain, improves digestion",
    steps: ["Lie on back, use core to swing legs overhead", "Support lower back with hands, elbows on mat", "Stack ankles over hips over shoulders", "Hold 1–5 minutes; come down slowly on exhale"],
  },
  {
    id: 33, level: 8, name: "Sirsasana", english: "Headstand", emoji: "🔱", rarity: "EPIC", weight: 5,
    benefits: "Strengthens arms and core, improves circulation, calms the mind, energizes the body",
    steps: ["Interlace fingers, place forearms on mat, crown of head in cradle of hands", "Walk feet in until hips are above shoulders", "Engage core, lift legs slowly overhead", "Hold 1–5 minutes; build up time gradually"],
  },
  {
    id: 45, level: 8, name: "Natarajasana", english: "Dancer Pose", emoji: "💃", rarity: "EPIC", weight: 5,
    benefits: "Improves balance, stretches shoulders and chest, strengthens legs, increases focus",
    steps: ["Stand in Tadasana, fix gaze on a point", "Bend left knee, hold outer left ankle with left hand", "Extend right arm forward, kick left foot back and up", "Open chest as leg and arm create a bow shape; hold 20–30 seconds"],
  },
  {
    id: 39, level: 8, name: "Navasana", english: "Boat Pose", emoji: "⛵", rarity: "RARE", weight: 20,
    benefits: "Strengthens core and hip flexors, improves digestion, stimulates kidneys and intestines",
    steps: ["Sit with knees bent, lean back slightly keeping spine straight", "Lift feet off floor until shins are parallel to mat", "Extend arms forward, parallel to floor", "Straighten legs into a V-shape if possible; hold 30–60 seconds"],
  },

  // ───────── LEVEL 9 — Arm Balances (6 poses, need 6) ─────────
  {
    id: 34, level: 9, name: "Pincha Mayurasana", english: "Forearm Stand", emoji: "🤸", rarity: "EPIC", weight: 5,
    benefits: "Strengthens shoulders and core, improves balance, builds confidence and focus",
    steps: ["Forearms on mat, shoulder-width, elbows under shoulders", "Walk feet in, lift one leg, then kick up into the stand", "Engage core and inner thighs, stack hips above shoulders", "Use wall for support while learning; hold 15–60 seconds"],
  },
  {
    id: 35, level: 9, name: "Bakasana", english: "Crow Pose", emoji: "🐦", rarity: "EPIC", weight: 5,
    benefits: "Strengthens arms, wrists, and abdomen; improves balance and concentration",
    steps: ["Squat and place hands on mat, shoulder-width apart", "Bend elbows and place knees on backs of upper arms", "Shift weight forward onto hands, lean into fingertips", "Lift feet off floor one at a time; hold 10–30 seconds"],
  },
  {
    id: 36, level: 9, name: "Chaturanga Dandasana", english: "Four-Limbed Staff Pose", emoji: "💪", rarity: "RARE", weight: 20,
    benefits: "Strengthens arms, wrists, and core; tones abdomen; builds upper body strength",
    steps: ["Start in plank, shoulders over wrists", "Lower body halfway down, elbows at 90°", "Keep elbows hugged to ribs, body in one line", "Hold 10–30 seconds before transitioning; build gradually"],
  },
  {
    id: 37, level: 9, name: "Phalakasana", english: "Plank Pose", emoji: "📏", rarity: "RARE", weight: 20,
    benefits: "Strengthens core, arms, and shoulders; tones abdomen; improves posture",
    steps: ["Start on hands and knees, step feet back to plank", "Wrists directly under shoulders, body in straight line", "Engage core, press floor away with hands", "Hold 30 seconds to 2 minutes; breathe evenly"],
  },
  {
    id: 38, level: 9, name: "Vasisthasana", english: "Side Plank", emoji: "↗️", rarity: "EPIC", weight: 5,
    benefits: "Strengthens arms, wrists, and core; improves balance; tones obliques",
    steps: ["From plank, shift weight to right hand and outer right foot", "Stack left foot on right, lift hips to form a diagonal line", "Extend left arm toward ceiling", "Hold 20–30 seconds; lower and repeat on other side"],
  },
  {
    id: 18, level: 9, name: "Prasarita Padottanasana", english: "Wide-Legged Forward Bend", emoji: "🦶", rarity: "RARE", weight: 20,
    benefits: "Stretches inner legs and back, strengthens feet and ankles, calms the brain",
    steps: ["Stand with feet 4–5 feet apart, parallel", "Hinge at hips, hands to floor under shoulders", "Walk hands back until torso is perpendicular to floor", "Place crown of head on floor if possible; hold 1 minute"],
  },

  // ───────── LEVEL 10 BONUS — Advanced Series (6 poses, need 6) ─────────
  {
    id: 8, level: 10, name: "Padmasana", english: "Lotus Pose", emoji: "🪷", rarity: "EPIC", weight: 5,
    benefits: "Opens hips, improves posture, calms the mind, deepens meditation practice",
    steps: ["Sit with legs extended; place right foot on left thigh", "Bring left foot onto right thigh, sole facing up", "Rest hands on knees in Gyan Mudra or Dhyana Mudra", "Keep spine erect; hold as long as comfortable"],
  },
  {
    id: 21, level: 10, name: "Janu Sirsasana", english: "Head-to-Knee Pose", emoji: "🎋", rarity: "RARE", weight: 20,
    benefits: "Stretches spine, shoulders, and hamstrings; calms the brain; improves digestion",
    steps: ["Sit with left leg extended, right foot to inner left thigh", "Inhale, lengthen spine; exhale, fold over left leg", "Hold left foot or ankle, keeping spine long", "Hold 1–3 minutes per side; switch legs"],
  },
  {
    id: 23, level: 10, name: "Upavistha Konasana", english: "Wide-Angle Seated Bend", emoji: "📡", rarity: "EPIC", weight: 5,
    benefits: "Stretches inner legs, strengthens spine, calms the brain, releases groin tension",
    steps: ["Sit, spread legs wide apart as comfortable", "Flex feet, keep toes pointing up", "Inhale, lengthen spine; exhale, walk hands forward", "Lower torso toward floor; hold 1–3 minutes"],
  },
  {
    id: 24, level: 10, name: "Gomukhasana", english: "Cow Face Pose", emoji: "🐄", rarity: "EPIC", weight: 5,
    benefits: "Stretches shoulders, hips, and chest; strengthens spine; relieves back pain",
    steps: ["Sit with left leg bent under right hip", "Cross right knee over left, stacking knees", "Raise right arm, bend elbow behind head", "Bring left arm behind and clasp hands; hold 1 minute per side"],
  },
  {
    id: 19, level: 10, name: "Padahastasana", english: "Hand-to-Foot Pose", emoji: "🤲", rarity: "RARE", weight: 20,
    benefits: "Stretches spine and hamstrings, improves digestion, increases blood flow to brain",
    steps: ["Stand hip-width apart, exhale and fold forward deeply", "Slide hands under feet, palms up", "Bend elbows out to sides as you deepen the fold", "Touch nose toward shins if possible; hold 1 minute"],
  },
  {
    id: 50, level: 10, name: "Viparita Karani", english: "Legs-Up-The-Wall", emoji: "🌅", rarity: "EPIC", weight: 5,
    benefits: "Relieves tired legs, calms the mind, reduces anxiety, improves circulation",
    steps: ["Sit sideways against a wall, then swing legs up", "Let shoulders and head rest flat on the floor", "Arms relax by sides, palms up", "Close eyes and hold 5–15 minutes; breathe deeply"],
  },
]

export default yogaPoses

export function getPosesForLevel(level: number): YogaPose[] {
  const maxLevel = 10
  const targetLevel = Math.min(level, maxLevel)
  return yogaPoses.filter(p => p.level === targetLevel)
}

// Unique card types needed per level (new unique cards needed each level)
export const UNIQUE_NEEDED: Record<number, number> = {
  1: 2, 2: 3, 3: 4, 4: 5, 5: 6,
  6: 5, 7: 5, 8: 5, 9: 6, 10: 6,
}

// Cumulative unique cards needed across all levels up to N
// Level 1=2, Level 2=5, Level 3=9, Level 4=14, Level 5=20...
export const CUMULATIVE_NEEDED: Record<number, number> = (() => {
  const result: Record<number, number> = {}
  let total = 0
  for (let l = 1; l <= 10; l++) {
    total += UNIQUE_NEEDED[l] ?? 0
    result[l] = total
  }
  return result
})()
