// Daily play games for parents of young autistic children (ages 1 to 5).
// Each game practices one skill from parent-led, play-based approaches with
// strong research: PACT (Green et al., Lancet 2010; Pickles et al., Lancet 2016),
// ESDM (Dawson et al., Pediatrics 2010), JASPER (Kasari et al.), and Hanen
// "More Than Words". The AI only rewrites these around the child's favorite
// thing, so the steps stay tested.
//   steps - what the parent does
//   say   - short words to use, at the child's level
//   watch - the small win to look for

export const PLAY_AGES = [
  { id: '1-2', label: '1 to 2' },
  { id: '2-3', label: '2 to 3' },
  { id: '3-5', label: '3 to 5' },
];

export const TALK_LEVELS = [
  { id: 'none', label: 'No words yet', words: 'sounds and single words like "go", "up", "more"' },
  { id: 'few', label: 'A few words', words: 'single words, sometimes two together, like "more ball"' },
  { id: 'phrases', label: 'Short phrases', words: 'two or three word phrases, like "push the car"' },
];

// The research behind each skill. Only published studies, with how many
// children took part, so parents see what has worked for other kids.
const STUDY = {
  pact: { name: 'PACT trial (Green et al., Lancet 2010; Pickles et al., Lancet 2016)', kids: 152, ages: '2 to 5',
    found: 'Parents were coached to notice and answer their child\'s signals during play. Children started more communication with their parent, and about 6 years later their autism symptoms were milder than in the comparison group.' },
  esdm: { name: 'Early Start Denver Model trial (Dawson et al., Pediatrics 2010)', kids: 48, ages: '1½ to 2½',
    found: 'Play-based therapy with parents taking part, using copying and people games. After 2 years, children gained more in thinking, language, and daily living skills than children with usual care.' },
  prt: { name: 'Parent PRT trial (Gengoux et al., Pediatrics 2019)', kids: 48, ages: '2 to 5',
    found: 'Parents learned to wait for the child to try, then give the thing the child wanted right away as the reward. Children used more spoken words than children on a wait list.' },
  jasper: { name: 'JASPER trials (Kasari et al., 2006 and 2010)', kids: 96, ages: '2 to 4',
    found: 'Play with turns and shared attention, with parents in the 2010 trial. Children spent more time engaged together, and shared attention more often.' },
  sandbank: { name: 'Review of early autism interventions (Sandbank et al., Psychological Bulletin 2020)', kids: null, ages: 'young children',
    found: 'Across about 130 studies with thousands of children, play-based approaches that follow the child\'s interests had some of the most consistent evidence.' },
  ncaep: { name: 'National report on evidence-based practices for autism (NCAEP, 2020)', kids: null, ages: 'birth to 22',
    found: 'A review of 972 studies. Reinforcement, visual supports, and functional communication training are among the 28 practices with strong evidence.' },
};

// The order a parent learns them in. Earlier skills make the later ones work.
export const SKILLS = [
  { id: 'lead', label: 'Follow their lead', emoji: '👣', evidence: ['pact', 'sandbank'],
    why: 'When you join what your child already loves, they are more ready to connect and learn.' },
  { id: 'copy', label: 'Copy them', emoji: '🪞', evidence: ['esdm', 'sandbank'],
    why: 'Copying shows your child that you are interested in them. Many kids start to watch you and copy back.' },
  { id: 'routine', label: 'People games', emoji: '🎵', evidence: ['esdm'],
    why: 'Short games with a pause teach your child that people are fun and that they can ask for more.' },
  { id: 'wait', label: 'Wait and give a reason to ask', emoji: '⏳', evidence: ['prt', 'pact'],
    why: 'A small wait gives your child a reason and the time to reach out to you. What they asked for is the reward.' },
  { id: 'turns', label: 'Take turns', emoji: '🔁', evidence: ['jasper'],
    why: 'Turns are the start of every conversation, even before words.' },
  { id: 'share', label: 'Look together', emoji: '👀', evidence: ['jasper', 'pact'],
    why: 'Sharing interest in the same thing, like pointing or showing, is a key step toward talking.' },
  { id: 'words', label: 'Add one word', emoji: '💬', evidence: ['prt', 'sandbank'],
    why: 'Say just a little more than your child says now. Short, clear words are easier to learn.' },
  { id: 'firstthen', label: 'First this, then the fun thing', emoji: '🎁', evidence: ['ncaep'],
    why: 'A short task, then right away the thing they love. Seeing "first, then" in pictures helps them know what comes next.' },
  { id: 'ask', label: 'A way to ask for help or a break', emoji: '✋', evidence: ['ncaep'],
    why: 'Many meltdowns happen when a child cannot say what they need. A sign or a card gives them a way.' },
];

export function evidence(skill) {
  return (SKILLS.find((s) => s.id === skill)?.evidence ?? []).map((id) => STUDY[id]);
}

// What the parent is working toward. Each goal sets which skills come up.
export const GOALS = [
  { id: 'connect', emoji: '🤗', label: 'Connect and play with me', skills: ['lead', 'copy', 'routine', 'share'] },
  { id: 'talk', emoji: '💬', label: 'First words, or more words', skills: ['lead', 'copy', 'routine', 'wait', 'words'] },
  { id: 'ask', emoji: '🙋', label: 'Ask for things instead of crying or grabbing', skills: ['routine', 'wait', 'words', 'ask'] },
  { id: 'turns', emoji: '🔁', label: 'Take turns and play with others', skills: ['lead', 'copy', 'turns', 'share'] },
  { id: 'routines', emoji: '🪥', label: 'Do daily tasks: teeth, shoes, clean-up', skills: ['routine', 'firstthen'] },
  { id: 'calm', emoji: '🌿', label: 'Fewer meltdowns at hard moments', skills: ['firstthen', 'ask'] },
];

export const SKILL_IDS = SKILLS.map((s) => s.id);

export const GAMES = [
  // Follow their lead
  { id: 'lead-floor', skill: 'lead', title: 'Join their play', ages: ['1-2', '2-3', '3-5'], need: 'Whatever toy they pick',
    steps: ['Get down on the floor, face to face, at their eye level.', 'Let them pick the toy and the game.', 'Play the same way they play, right next to them. No questions, no teaching.', 'Talk about what they do in 1 or 2 words.'],
    say: ['car', 'go', 'wow'], watch: 'They let you stay close, or look at you, even for a second.' },
  { id: 'lead-narrate', skill: 'lead', title: 'Be the sports announcer', ages: ['2-3', '3-5'], need: 'Their favorite toys',
    steps: ['Sit near them while they play.', 'Say what they are doing, in very short words: "Car up. Car down."', 'Do not ask questions. Just enjoy it with them.', 'Smile big when they look your way.'],
    say: ['up', 'down', 'crash'], watch: 'They glance at you or bring a toy closer to you.' },
  { id: 'lead-helper', skill: 'lead', title: 'Be their helper', ages: ['1-2', '2-3', '3-5'], need: 'Blocks, cars, or any toys',
    steps: ['Watch what they are building or lining up.', 'Hand them the next piece they need.', 'Let them decide where it goes.', 'Say the word for it as you hand it over.'],
    say: ['block', 'here', 'more'], watch: 'They take pieces from your hand or reach toward you for the next one.' },

  // Copy them
  { id: 'copy-twin', skill: 'copy', title: 'Toy twins', ages: ['1-2', '2-3', '3-5'], need: 'Two of the same toy, like two cars or two spoons',
    steps: ['Give them one toy and keep the twin.', 'Do exactly what they do with it: bang, roll, spin.', 'Stop when they stop. Start when they start.', 'Wait and see if they notice and check on you.'],
    say: ['bang', 'roll', 'again'], watch: 'They look at your toy or do something new to see if you copy.' },
  { id: 'copy-sounds', skill: 'copy', title: 'Echo their sounds', ages: ['1-2', '2-3'], need: 'Nothing',
    steps: ['Listen for any sound they make: "ba", "ee", a hum.', 'Make the same sound back, softly and happily.', 'Wait a few seconds.', 'If they make it again, copy again. It is a conversation.'],
    say: ['ba ba', 'ooh', 'mmm'], watch: 'They make the sound again after you, as if taking a turn.' },
  { id: 'copy-moves', skill: 'copy', title: 'Mirror moves', ages: ['2-3', '3-5'], need: 'Nothing, or music',
    steps: ['When they rock, flap, jump or spin, do it too, next to them.', 'Make it fun, not a lesson.', 'After a few times, add one small new move, like a clap.', 'If they copy your clap, cheer.'],
    say: ['jump', 'clap', 'yay'], watch: 'They watch you, or copy your new move.' },

  // People games
  { id: 'routine-peekaboo', skill: 'routine', title: 'Peekaboo', ages: ['1-2', '2-3'], need: 'A soft blanket or a scarf',
    steps: ['Hide your face behind the blanket.', 'Say "Where is Mommy?" slowly, with a big build-up.', 'Pop out: "Peekaboo!" with a big smile.', 'Do it 3 times. On the 4th time, wait behind the blanket and see what they do.'],
    say: ['peekaboo', 'where', 'boo'], watch: 'They pull the blanket, laugh, or make a sound to ask for more.' },
  { id: 'routine-song', skill: 'routine', title: 'Song with a pause', ages: ['1-2', '2-3', '3-5'], need: 'A song they like, like "Row, row, row your boat"',
    steps: ['Sit face to face and hold their hands if they like that.', 'Sing and rock together.', 'Sing it a few times the same way.', 'Then stop just before the last word and wait, smiling.'],
    say: ['row', 'boat', 'more'], watch: 'They rock, look at you, or make a sound to finish the song.' },
  { id: 'routine-ready', skill: 'routine', title: 'Ready, set... go!', ages: ['1-2', '2-3', '3-5'], need: 'A car, a ball, or your arms for a lift',
    steps: ['Say "Ready... set..." slowly, with excitement.', 'Wait a moment, then "GO!" and roll the car or lift them up.', 'Do it many times, the same way.', 'Then say "Ready... set..." and wait for them to say or show "go".'],
    say: ['ready', 'set', 'go'], watch: 'They say "go", make any sound, or move to ask you.' },
  { id: 'routine-squish', skill: 'routine', title: 'Pillow squish', ages: ['1-2', '2-3', '3-5'], need: 'A pillow or a cushion',
    steps: ['Only if your child likes deep pressure: gently press a pillow on their back or legs.', 'Say "squish... squish!" each time.', 'Stop and wait.', 'Squish again when they look at you, move toward you, or make a sound.'],
    say: ['squish', 'more', 'again'], watch: 'They lean in or ask in any way for more squish.' },

  // Wait and give a reason to ask
  { id: 'wait-jar', skill: 'wait', title: 'Snack in a clear jar', ages: ['1-2', '2-3', '3-5'], need: 'A clear jar with a lid they cannot open, and a favorite snack',
    steps: ['Put a few bites of a favorite snack in the jar and close it.', 'Put it where they can see it.', 'When they come to you with it, wait 5 seconds and smile.', 'Any sign, look, sound or reach counts. Open it right away and say the word.'],
    say: ['open', 'more', 'snack'], watch: 'They bring you the jar, look at you, or make a sound to ask.' },
  { id: 'wait-bubbles', skill: 'wait', title: 'Bubbles stop and go', ages: ['1-2', '2-3', '3-5'], need: 'Bubbles',
    steps: ['Blow bubbles for them a few times.', 'Close the bubbles and hold them near your face.', 'Wait 5 seconds with a happy, ready face.', 'When they ask in any way, say "bubbles!" and blow right away.'],
    say: ['bubbles', 'pop', 'more'], watch: 'They look at you, reach, sign or say a sound to ask.' },
  { id: 'wait-little', skill: 'wait', title: 'A little at a time', ages: ['2-3', '3-5'], need: 'Blocks, puzzle pieces, or crackers',
    steps: ['Hold the pieces yourself.', 'Give just one at a time.', 'Before each one, wait for them to ask in any way.', 'Say the word as you give it.'],
    say: ['more', 'block', 'please'], watch: 'They ask you again and again, in any way.' },

  // Take turns
  { id: 'turns-ball', skill: 'turns', title: 'Roll it back', ages: ['1-2', '2-3', '3-5'], need: 'A soft ball or a car',
    steps: ['Sit across from each other with your legs open, like a little fence.', 'Roll the ball to them: "My turn... your turn!"', 'Help them push it back if they need help.', 'Cheer for every roll.'],
    say: ['my turn', 'your turn', 'roll'], watch: 'They roll it back to you, even once.' },
  { id: 'turns-tower', skill: 'turns', title: 'Tower turns', ages: ['2-3', '3-5'], need: 'Blocks or cups',
    steps: ['Put one block down: "My turn."', 'Hand them a block: "Your turn."', 'Take turns until it is tall.', 'Crash it together: "Crash!"'],
    say: ['my turn', 'your turn', 'crash'], watch: 'They wait for your block, then add theirs.' },
  { id: 'turns-drum', skill: 'turns', title: 'Drum talk', ages: ['1-2', '2-3', '3-5'], need: 'A pot and two spoons',
    steps: ['Tap the pot 2 times. Stop.', 'Hand them the spoon and wait.', 'When they tap, cheer, then take your turn again.', 'Try fast and slow taps.'],
    say: ['tap', 'boom', 'you'], watch: 'They tap after you stop, like an answer.' },

  // Look together
  { id: 'share-window', skill: 'share', title: 'Look out the window', ages: ['1-2', '2-3', '3-5'], need: 'A window',
    steps: ['Stand at a window together.', 'Point at something they like and say its name with excitement: "Truck!"', 'Look at it, then at them, then back at it.', 'If they point or look, say the name of what they see.'],
    say: ['look', 'truck', 'wow'], watch: 'They look where you point, or point to show you.' },
  { id: 'share-surprise', skill: 'share', title: 'Surprise bag', ages: ['2-3', '3-5'], need: 'A bag and 3 small toys they like (big enough not to choke on)',
    steps: ['Shake the bag. Say "What is in here?" with a curious face.', 'Pull one toy out slowly: "Ooh!"', 'Hold it near your face so they look at you and the toy.', 'Let them play with it, then try the next toy.'],
    say: ['ooh', 'look', 'car'], watch: 'They look from the toy to your face, or show it to you.' },
  { id: 'share-book', skill: 'share', title: 'Point at the picture', ages: ['1-2', '2-3', '3-5'], need: 'A picture book with big pictures',
    steps: ['Let them turn pages at their speed.', 'Point at a picture and name it in one word.', 'Make the sound: a dog "woof", a car "vroom".', 'Wait and see if they point too.'],
    say: ['dog', 'woof', 'look'], watch: 'They point at a picture, or touch where you pointed.' },

  // Add one word
  { id: 'words-plus-one', skill: 'words', title: 'One word more', ages: ['2-3', '3-5'], need: 'Any toy they love',
    steps: ['Play next to them.', 'When they say or show something, say it back with one more word.', 'If they say "car", you say "red car" or "car go".', 'Never make them repeat it. Just say it and keep playing.'],
    say: ['car go', 'big car', 'car up'], watch: 'They try a new word or a new sound.' },
  { id: 'words-label', skill: 'words', title: 'Name it as they touch it', ages: ['1-2', '2-3', '3-5'], need: 'Bath toys, food, or a toy box',
    steps: ['When they pick something up, say its name once, clearly.', 'Use the same word every time.', 'Say it slowly, with a happy voice.', 'No questions like "What is this?". Just name it.'],
    say: ['ball', 'duck', 'cup'], watch: 'They look at you when you say the word, or try to say it.' },
  { id: 'words-choice', skill: 'words', title: 'This or that?', ages: ['2-3', '3-5'], need: 'Two snacks or two toys',
    steps: ['Hold one in each hand.', 'Say the name of each while you lift it: "Apple? Cracker?"', 'Wait for them to point, reach, look or say.', 'Give it right away and say the word again.'],
    say: ['apple', 'cracker', 'this one'], watch: 'They choose by pointing, looking, or saying a word.' },

  // First this, then the fun thing
  { id: 'firstthen-tiny', skill: 'firstthen', title: 'One tiny step, then fun', ages: ['1-2', '2-3'], need: 'Their favorite toy or song, and one small task like putting on a sock',
    steps: ['Hold up the sock and their favorite toy: "First sock, then train."', 'Help them do just one tiny part, like pushing a foot in.', 'Give the favorite toy right away, with a big smile.', 'Do this every time. They learn that the fun thing always comes.'],
    say: ['first', 'then', 'yay'], watch: 'They let you do the small task, or reach for the fun thing after it.' },
  { id: 'firstthen-card', skill: 'firstthen', title: 'First-then card', ages: ['2-3', '3-5'], need: 'Paper, and a photo or drawing of the task and of their favorite thing',
    steps: ['Fold a paper in two. Put the task picture on the left and the favorite on the right.', 'Point and say: "First teeth, then train."', 'Keep the task short and help as much as they need.', 'Point to "then" and give the favorite thing right away. Always keep the promise.'],
    say: ['first teeth', 'then train', 'done'], watch: 'They look at the card, or go along with the task more easily.' },
  { id: 'firstthen-cleanup', skill: 'firstthen', title: 'Two toys in, then play', ages: ['2-3', '3-5'], need: 'A toy box and a clean-up song',
    steps: ['Sing a short clean-up song.', 'Ask for just 2 toys in the box. Put one in yourself to show.', 'When the 2nd toy goes in, cheer and name it: "You put the car in!"', 'Then right away play their favorite game together.'],
    say: ['in', 'clean up', 'done'], watch: 'They put a toy in the box, even with help.' },

  // A way to ask for help or a break
  { id: 'ask-help', skill: 'ask', title: 'The "help" jar', ages: ['1-2', '2-3', '3-5'], need: 'A favorite toy or snack in a jar they cannot open',
    steps: ['Give them the closed jar with something they want inside.', 'When they get stuck, show the help sign: tap one palm on the other, and say "help".', 'Any try counts: handing you the jar, a sound, or the sign. Open it right away.', 'Say "help" again as you open it, happily.'],
    say: ['help', 'open', 'yay'], watch: 'They hand you the jar or sign "help" instead of crying.' },
  { id: 'ask-alldone', skill: 'ask', title: 'All done!', ages: ['1-2', '2-3', '3-5'], need: 'Snack time or any toy they finish with',
    steps: ['When you see they are finished, show the sign: shake both open hands, and say "all done".', 'Then end it right away, so the sign works.', 'Do it at every snack and every toy.', 'When they shake their hands or say it, end it right away and smile.'],
    say: ['all done', 'finished', 'bye bye'], watch: 'They show "all done" instead of throwing or pushing away.' },
  { id: 'ask-break', skill: 'ask', title: 'Break card', ages: ['2-3', '3-5'], need: 'A card with a picture of a quiet spot, and a cozy corner with a pillow',
    steps: ['On a calm day, show the card and walk to the cozy corner together: "Break."', 'Practice a few times while they are happy, so they know it.', 'When they start to get upset, hold up the card and say "break?"', 'Let them go to the corner. Cheer any time they use the card themselves.'],
    say: ['break', 'quiet', 'ok'], watch: 'They take the card or go to the corner when upset.' },
];

export function game(id) {
  return GAMES.find((g) => g.id === id) ?? null;
}

// Which skill to practice today. Each skill needs 3 good days before the next one
// opens, and a hard day repeats the same skill in a gentler way.
export function skillPath(goals = []) {
  const want = new Set(GOALS.filter((g) => goals.includes(g.id)).flatMap((g) => g.skills));
  return want.size ? SKILL_IDS.filter((id) => want.has(id)) : SKILL_IDS.slice(0, 7);
}

export function nextGame(log = [], age = '2-3', goals = []) {
  const path = skillPath(goals);
  const fits = GAMES.filter((g) => g.ages.includes(age));
  const last = log.at(-1);
  const stars = Object.fromEntries(SKILL_IDS.map((id) => [id, log.filter((l) => l.skill === id && good(l)).length]));
  const open = path.filter((id, i) => i === 0 || path.slice(0, i).every((prev) => stars[prev] >= 3) || stars[id] > 0);
  let skill = open.find((id) => stars[id] < 3) ?? open[log.length % open.length];
  if (last?.feel === 'hard') skill = last.skill;
  const choices = fits.filter((g) => g.skill === skill);
  const pool = choices.length ? choices : fits;
  const played = log.filter((l) => l.skill === skill).length;
  const pick = pool.find((g) => g.id !== last?.gameId && !log.slice(-3).some((l) => l.gameId === g.id)) ?? pool[played % pool.length];
  return { game: pick, gentle: last?.feel === 'hard', stars, path };
}

export function good(entry) {
  return entry.feel !== 'hard' && (entry.looks > 0 || entry.reached);
}
