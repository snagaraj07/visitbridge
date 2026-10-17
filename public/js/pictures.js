// Fixed picture set for kids stories and boards. The AI can only pick keys
// from this list, it never generates images.
//   anim  - how the picture moves when its page opens (see .anim-* in app.css)
//   scene - the backdrop behind it (see .scene-* in app.css)
export const PICTURES = {
  car: { emoji: '🚗', label: 'Car ride', anim: 'drive', scene: 'sky' },
  clinic: { emoji: '🏥', label: 'Clinic', anim: 'rise', scene: 'sky' },
  desk: { emoji: '🛎️', label: 'Front desk', anim: 'pop', scene: 'room' },
  wait: { emoji: '🪑', label: 'Waiting room', anim: 'bounce', scene: 'room' },
  name: { emoji: '📣', label: 'Name called', anim: 'wiggle', scene: 'room' },
  room: { emoji: '🚪', label: 'Exam room', anim: 'pop', scene: 'room' },
  nurse: { emoji: '🧑‍⚕️', label: 'Nurse', anim: 'wave', scene: 'warm' },
  doctor: { emoji: '👩‍⚕️', label: 'Doctor', anim: 'wave', scene: 'warm' },
  scale: { emoji: '⚖️', label: 'Scale', anim: 'bounce', scene: 'clinic' },
  height: { emoji: '📏', label: 'Measure height', anim: 'grow', scene: 'clinic' },
  thermometer: { emoji: '🌡️', label: 'Temperature', anim: 'pulse', scene: 'clinic' },
  arm: { emoji: '💪', label: 'Arm squeeze', anim: 'squeeze', scene: 'clinic' },
  stethoscope: { emoji: '🩺', label: 'Listen to heart', anim: 'swing', scene: 'clinic' },
  ears: { emoji: '👂', label: 'Check ears', anim: 'wiggle', scene: 'clinic' },
  mouth: { emoji: '😮', label: 'Open mouth', anim: 'pop', scene: 'clinic' },
  eyes: { emoji: '👀', label: 'Check eyes', anim: 'look', scene: 'clinic' },
  needle: { emoji: '💉', label: 'Shot or needle', anim: 'float', scene: 'clinic' },
  bandage: { emoji: '🩹', label: 'Bandage', anim: 'pop', scene: 'warm' },
  tooth: { emoji: '🦷', label: 'Teeth', anim: 'sparkle', scene: 'water' },
  chair: { emoji: '💺', label: 'Big chair', anim: 'recline', scene: 'water' },
  xray: { emoji: '🩻', label: 'X-ray', anim: 'glow', scene: 'night' },
  light: { emoji: '💡', label: 'Bright light', anim: 'glow', scene: 'night' },
  loud: { emoji: '🔊', label: 'Loud sound', anim: 'buzz', scene: 'room' },
  buzz: { emoji: '🐝', label: 'Buzzing sound', anim: 'buzz', scene: 'water' },
  headphones: { emoji: '🎧', label: 'Headphones', anim: 'pulse', scene: 'calm' },
  comfort: { emoji: '🧸', label: 'Comfort item', anim: 'hug', scene: 'calm' },
  favorite: { emoji: '💛', label: 'Favorite thing', anim: 'pulse', scene: 'party' },
  grownup: { emoji: '🧑‍🧒', label: 'My grown-up', anim: 'hug', scene: 'warm' },
  hold: { emoji: '🤝', label: 'Hold hands', anim: 'hug', scene: 'warm' },
  breathe: { emoji: '🌬️', label: 'Deep breaths', anim: 'breathe', scene: 'calm' },
  count: { emoji: '🔢', label: 'Count', anim: 'bounce', scene: 'calm' },
  feelings: { emoji: '😟', label: 'Worried', anim: 'float', scene: 'calm' },
  ok: { emoji: '🙂', label: 'It is OK', anim: 'bounce', scene: 'calm' },
  done: { emoji: '✅', label: 'All done', anim: 'pop', scene: 'party' },
  sticker: { emoji: '⭐', label: 'Sticker', anim: 'spin', scene: 'party' },
  home: { emoji: '🏠', label: 'Go home', anim: 'rise', scene: 'party' },
  play: { emoji: '🛝', label: 'Play', anim: 'bounce', scene: 'party' },
  snack: { emoji: '🍎', label: 'Snack', anim: 'pop', scene: 'party' },
  screen: { emoji: '📱', label: 'Screen time', anim: 'glow', scene: 'party' },
  book: { emoji: '📖', label: 'Book', anim: 'float', scene: 'calm' },
  // daily routines and other places
  bath: { emoji: '🛁', label: 'Bath', anim: 'float', scene: 'water' },
  shower: { emoji: '🚿', label: 'Shower', anim: 'float', scene: 'water' },
  toothbrush: { emoji: '🪥', label: 'Brush teeth', anim: 'buzz', scene: 'water' },
  wash: { emoji: '🧼', label: 'Wash hands', anim: 'bounce', scene: 'water' },
  toilet: { emoji: '🚽', label: 'Toilet', anim: 'pop', scene: 'room' },
  meal: { emoji: '🍽️', label: 'Mealtime', anim: 'pop', scene: 'warm' },
  dress: { emoji: '👕', label: 'Get dressed', anim: 'wiggle', scene: 'warm' },
  homework: { emoji: '✏️', label: 'Homework', anim: 'wiggle', scene: 'calm' },
  bed: { emoji: '🛏️', label: 'Bedtime', anim: 'breathe', scene: 'night' },
  school: { emoji: '🏫', label: 'School', anim: 'rise', scene: 'sky' },
  haircut: { emoji: '💈', label: 'Haircut', anim: 'spin', scene: 'room' },
  nails: { emoji: '✂️', label: 'Nail trim', anim: 'wiggle', scene: 'warm' },
  shop: { emoji: '🛒', label: 'Store', anim: 'drive', scene: 'room' },
  swim: { emoji: '🏊', label: 'Swimming', anim: 'float', scene: 'water' },
  party: { emoji: '🎂', label: 'Party', anim: 'bounce', scene: 'party' },
  plane: { emoji: '🛫', label: 'Plane trip', anim: 'rise', scene: 'sky' },
  swab: { emoji: '🧪', label: 'Swab test', anim: 'float', scene: 'clinic' },
  brain: { emoji: '🧠', label: 'Brain scan', anim: 'pulse', scene: 'night' },
  cast: { emoji: '🦾', label: 'Cast or brace', anim: 'squeeze', scene: 'clinic' },
  therapy: { emoji: '🧩', label: 'Therapy', anim: 'wiggle', scene: 'calm' },
  talk: { emoji: '💬', label: 'Talking', anim: 'pop', scene: 'calm' },
  allergy: { emoji: '🤧', label: 'Allergy test', anim: 'wiggle', scene: 'clinic' },
  stitches: { emoji: '🪡', label: 'Stitches', anim: 'float', scene: 'clinic' },
};

for (const [key, p] of Object.entries(PICTURES)) p.img = `/img/3d/${key}.png`;

export const PICTURE_KEYS = Object.keys(PICTURES);

export function picture(key) {
  return PICTURES[key] ?? PICTURES.ok;
}

// Story friends: the character that comes along and tells the story.
// The AI picks one key that is closest to the child's favorite thing.
export const FRIENDS = {
  tractor: { emoji: '🚜', label: 'Tractor or lawn mower' },
  train: { emoji: '🚂', label: 'Train' },
  dinosaur: { emoji: '🦖', label: 'T-rex' },
  sauropod: { emoji: '🦕', label: 'Long-neck dinosaur' },
  rocket: { emoji: '🚀', label: 'Rocket' },
  planet: { emoji: '🪐', label: 'Planet' },
  alien: { emoji: '👽', label: 'Alien' },
  firetruck: { emoji: '🚒', label: 'Fire truck' },
  police: { emoji: '🚓', label: 'Police car' },
  ambulance: { emoji: '🚑', label: 'Ambulance' },
  racecar: { emoji: '🏎️', label: 'Race car' },
  bus: { emoji: '🚌', label: 'Bus' },
  airplane: { emoji: '✈️', label: 'Airplane' },
  helicopter: { emoji: '🚁', label: 'Helicopter' },
  ship: { emoji: '🚢', label: 'Ship' },
  bike: { emoji: '🚲', label: 'Bike' },
  crane: { emoji: '🏗️', label: 'Construction' },
  bricks: { emoji: '🧱', label: 'Blocks' },
  robot: { emoji: '🤖', label: 'Robot' },
  gamepad: { emoji: '🎮', label: 'Video games' },
  dog: { emoji: '🐶', label: 'Dog' },
  cat: { emoji: '🐱', label: 'Cat' },
  horse: { emoji: '🐴', label: 'Horse' },
  unicorn: { emoji: '🦄', label: 'Unicorn' },
  dragon: { emoji: '🐉', label: 'Dragon' },
  shark: { emoji: '🦈', label: 'Shark' },
  whale: { emoji: '🐳', label: 'Whale' },
  octopus: { emoji: '🐙', label: 'Octopus' },
  fish: { emoji: '🐠', label: 'Fish' },
  turtle: { emoji: '🐢', label: 'Turtle' },
  frog: { emoji: '🐸', label: 'Frog' },
  penguin: { emoji: '🐧', label: 'Penguin' },
  owl: { emoji: '🦉', label: 'Owl' },
  lion: { emoji: '🦁', label: 'Lion' },
  bear: { emoji: '🐻', label: 'Bear' },
  panda: { emoji: '🐼', label: 'Panda' },
  elephant: { emoji: '🐘', label: 'Elephant' },
  monkey: { emoji: '🐵', label: 'Monkey' },
  butterfly: { emoji: '🦋', label: 'Butterfly' },
  ladybug: { emoji: '🐞', label: 'Ladybug' },
  rainbow: { emoji: '🌈', label: 'Rainbow' },
  ball: { emoji: '⚽', label: 'Soccer' },
  guitar: { emoji: '🎸', label: 'Music' },
  pizza: { emoji: '🍕', label: 'Pizza' },
  icecream: { emoji: '🍦', label: 'Ice cream' },
};

for (const [key, f] of Object.entries(FRIENDS)) f.img = `/img/3d/${key}.png`;

export const FRIEND_KEYS = Object.keys(FRIENDS);

// The guide when the parent doesn't pick a favorite thing.
export const DEFAULT_FRIEND = { key: 'owl', name: 'Ollie the Owl', look: 'a small, round brown owl with big friendly eyes and a soft cream belly' };
