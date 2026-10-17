// What scares the child most, and what is known to help. The ways to help come
// from pediatric pain and autism care guidance, so the AI picks from tested
// ideas instead of making them up.
//   helps - things the child and grown-up can do, used in the story
//   ask   - what the parent can ask the staff for
//   src   - where the ideas come from
export const FEARS = [
  { id: 'needle', label: 'Needles or shots', emoji: '💉',
    helps: ['sit up on the grown-up\'s lap in a comfort hug instead of lying down', 'look at a video, bubbles, or a toy during the poke', 'pick which arm', 'take slow balloon breaths', 'know it hurts for about 2 seconds, then it is over'],
    ask: ['numbing cream about an hour before', 'a cold or vibrating device on the arm (like Buzzy)', 'doing it sitting up, in a comfort hold', 'counting down "3, 2, 1" only if the child likes that'],
    src: 'HELPinKIDS clinical guideline (CMAJ 2015); AAP HealthyChildren.org' },
  { id: 'pain', label: 'Something hurting', emoji: '🤕',
    helps: ['know exactly how long it lasts', 'squeeze the grown-up\'s hand or a squishy toy', 'say "stop" or use a stop card to ask for a break', 'take slow breaths'],
    ask: ['numbing options', 'telling the child before each step', 'a break signal the child can use'],
    src: 'Children\'s Hospital Colorado and CHOP child life guidance' },
  { id: 'noise', label: 'Loud or sudden sounds', emoji: '🔊',
    helps: ['wear headphones or ear defenders', 'hear the sound first at home in the story', 'cover ears and count to 5'],
    ask: ['a quiet room or the first or last appointment of the day', 'a warning before loud tools turn on'],
    src: 'Autism Speaks ATN/AIR-P visit toolkits' },
  { id: 'touch', label: 'Being touched by strangers', emoji: '✋',
    helps: ['the grown-up touches first to show', 'know which body part and for how long', 'hold the tool first, like the stethoscope'],
    ask: ['"tell, show, do": say it, show it on a toy, then do it', 'the parent doing simple steps like the thermometer'],
    src: 'Tell-show-do technique, American Academy of Pediatric Dentistry' },
  { id: 'held', label: 'Being held still', emoji: '🧍',
    helps: ['sit on the grown-up\'s lap in a hug', 'have a job, like holding the tissue', 'know the count, like "still for 5 seconds"'],
    ask: ['a comfort hold instead of restraint', 'short steps with breaks'],
    src: 'AAP and child life comfort positioning guidance' },
  { id: 'mouth', label: 'Things in the mouth or gagging', emoji: '😮',
    helps: ['practice "open wide" in a mirror at home', 'raise a hand to ask for a break', 'breathe through the nose', 'know the taste first, like gritty toothpaste'],
    ask: ['a hand signal for "stop"', 'unflavored or mild toothpaste', 'tell-show-do for each tool'],
    src: 'American Academy of Pediatric Dentistry behavior guidance' },
  { id: 'water', label: 'Water on the face', emoji: '💦',
    helps: ['hold a dry washcloth over the eyes', 'tip the head back and use a cup', 'use a visor or swim goggles', 'count the pours, like 3 pours and done'],
    ask: [],
    src: 'Occupational therapy sensory guidance for bathing' },
  { id: 'away', label: 'Being away from me', emoji: '🧑‍🧒',
    helps: ['the grown-up stays in the room', 'hold something of the grown-up\'s', 'know when the grown-up will be back, with a picture'],
    ask: ['staying with the child the whole time', 'being there when anesthesia starts and when the child wakes up'],
    src: 'AAP family-centered care guidance' },
  { id: 'wait', label: 'Waiting a long time', emoji: '⏳',
    helps: ['bring a busy bag or tablet', 'use a visual timer', 'wait in the car until called'],
    ask: ['a text when the room is ready', 'the first appointment of the day'],
    src: 'Autism Speaks ATN/AIR-P visit toolkits' },
  { id: 'new', label: 'New places and people', emoji: '🚪',
    helps: ['see real photos of the place and people first', 'watch the story many times', 'visit the building before the day'],
    ask: ['photos of the office and staff', 'a short practice visit'],
    src: 'Social story research (Gray; Kokina & Kern 2010)' },
  { id: 'unknown', label: 'Not knowing what comes next', emoji: '❓',
    helps: ['use a picture schedule and check off each step', 'use first-then: first the check, then a reward'],
    ask: ['telling the child each step before it happens'],
    src: 'Visual supports research, National Professional Development Center on ASD' },
  { id: 'lights', label: 'Bright lights', emoji: '💡',
    helps: ['wear sunglasses', 'wear a cap', 'close the eyes during the light'],
    ask: ['dimming the room lights'],
    src: 'Autism Speaks dental toolkit' },
  { id: 'smell', label: 'Strong smells or tastes', emoji: '👃',
    helps: ['smell or taste it first at home', 'bring a favorite smell on a cloth'],
    ask: ['unflavored options'],
    src: 'Occupational therapy sensory guidance' },
  { id: 'machines', label: 'Big machines', emoji: '🤖',
    helps: ['see a video of the machine first', 'hear its sounds at home', 'know it does not touch or hurt'],
    ask: ['seeing the machine before it starts', 'headphones with music'],
    src: 'Child life preparation guidance (CHOP, Boston Children\'s)' },
];

export const FEAR_IDS = FEARS.map((f) => f.id);

export function fear(id) {
  return FEARS.find((f) => f.id === id);
}
