import { scrub } from './scrub.js';
import { sampleStory } from './samples.js';
import { PICTURE_KEYS, FRIEND_KEYS, FRIENDS, DEFAULT_FRIEND } from '../public/js/pictures.js';
import { activity } from '../public/js/activities.js';
import { LANGUAGES } from '../public/js/languages.js';
import { FEAR_IDS, fear } from '../public/js/fears.js';

const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

const VISIT_TYPE_MAX = 120;
const DETAILS_MAX = 300;
const THEME_MAX = 60;

export class InputError extends Error {}

// Voice cues the narrator may use. ElevenLabs acts them out; other voices skip them.
export const CUES = ['giggles', 'laughs', 'whispers', 'excited', 'gasps', 'sighs'];

// Young autistic kids drift off and lose long sentences, so the friend
// grabs attention, says the key word twice, and talks in tiny pieces.
const AGES = {
  '3-5': `Age rules:
- The child is 3 to 5 years old and gets distracted easily. Long sentences get lost.
- "text" and "fun" each have 6 words or fewer. Use only words a 3-year-old knows. One idea per page.
- "say" has 3 to 5 tiny sentences, each 5 words or fewer.
- Start every "say" by catching the child's attention, a different way each page: "Ooooh! Look, NAME!", "Ahhh! What is that?", "Oh my! Look!", "Hmm... what do I see?", "Psst... look over here!" It must fit what is on the page. Only ask "What is that?" about a real thing the child can see.
- Say the key word two times, slowly: "The chair. The big chair!"
- Use "..." for slow pauses. Stretch a word three times only for a real movement or sound, like "Up... up... up!" or "Bzzz... bzzz...", and on 2 or 3 pages at most.
  Bad: "It shows... shows... shows!" "It tastes... tastes... tastes!"
  Good: "The mirror. A tiny mirror! It looks at your teeth."
- Every sentence tells something true about what happens. No filler.
- End most pages with a tiny question or job: "Can you see it?", "Can you say buzz?", "Let's count. One... two... three!"
- On a page about something that hurts or is scary, catch attention softly: "Psst... NAME. Look at me."
- Example "say": "Ooooh! Look, NAME! The big chair. The big blue chair! It goes up... up... up! Can you say up?"`,
  '6-8': `Age rules:
- The child is 6 to 8 years old. "text" and "fun" each have 10 words or fewer.
- "say" has 2 to 4 short sentences, each 8 words or fewer.
- Start most "say" lines with something that catches attention, like "Ooh, look!" or "Hmm... guess what?" Say the key word two times.
- Example "say": "Ooh, look! The big chair. It goes up slowly, like a ramp. Ready?"`,
  '9-12': `Age rules:
- The child is 9 to 12 years old. Use sentences under 14 words. Do not sound babyish.
- "say" has 2 or 3 short sentences.`,
};

const KINDS = {
  visit: {
    goal: 'get ready for a medical visit',
    focus: 'what the clinician does, which tools they use, and what the child may see, hear, and feel',
    ending: '"The visit is over! Now I get to play with my dinosaurs."',
  },
  routine: {
    goal: 'get ready for an everyday activity, like a bath, a meal, a haircut, or bedtime. It is not a medical visit',
    focus: 'each step of the activity, in order, and what the child may see, hear, smell, and feel',
    ending: '"All done! Now I get to play with my dinosaurs."',
  },
};

const STORY_SYSTEM = (kind) => `You write social stories that help autistic children ${KINDS[kind].goal}. The story should feel like a small adventure the child gets to go on. The fun comes from curiosity, never from surprises.

Each page has:
- "text": one sentence, in the child's voice using "I", saying what happens next.
- "fun": one more sentence that makes the page interesting. Use one of these:
  - a true detail about a tool or step: "It shows how much I have grown!"
  - a small job for the child: "My job is to count to 5."
  - a concrete comparison a child knows: "It feels like a tight hug on my arm."
  - something to notice: "I can look for the light on the ceiling."
  "fun" must add something new. Never say the same thing again in other words.
  Bad: "The nurse calls my name." + "I hear my name."
  Good: "The nurse calls my name." + "Then we walk to a small room together."
  For the worried page use "It is OK to feel worried." + "My grown-up is there to help me."
- "sound": a short sound word for something the child will really hear, like "Beep!", "Bzzzz", "Click!", "Slurp!", or "". It is a sound a machine or tool makes, never the child's voice ("Ow!"). Never invent sounds. Do not repeat it in the text.
- "say": what the story friend says out loud on this page. See the friend rules below.
- "scene": a description of this page's picture for an illustrator, 1 or 2 sentences. Show exactly what the page says: who is there, where they are, what they are doing, and their faces. Example: "A smiling receptionist behind a bright clinic front desk greets the child and their grown-up." Include the child and the friend in most scenes. The friend joins in and copies what the child does, right next to them: "The child sits in the dentist chair with their mouth open wide, and the toy lawn mower friend beside them opens its mouth wide too." Never use the child's name. No words, letters, or signs. Keep medical moments gentle: no blood, never a needle touching skin. For a shot, show the nurse gently holding the child's arm while the child holds their grown-up's hand. The child is always covered: for bath or shower pages show only the head and shoulders above lots of bubbles, or the child wrapped in a towel; for toilet pages show the child washing hands at the sink or the closed bathroom door; for dressing pages the child is in pajamas or underclothes like a full undershirt.
- "picture": the picture that matches the main thing on the page. Must be one of: ${PICTURE_KEYS.join(', ')}, or "friend" for pages that are mostly about the friend.

Example pages from a different visit:
{"text": "I step on the scale.", "fun": "It shows how big I am!", "say": "Ooooh! Look, NAME! A scale. A scale! Step on... Beep! Wow, so big!", "picture": "scale", "sound": "Beep!"}
{"text": "A cuff goes on my arm.", "fun": "It hugs my arm tight.", "say": "Hmm... what is that? A cuff! It hugs your arm. Squeeze... squeeze... Pfff! All done.", "picture": "arm", "sound": "Pfff pfff"}
{"text": "The doctor listens to my heart.", "fun": "My heart goes thump, thump!", "say": "Shhh... listen! Your heart. Thump... thump... thump! It feels a little cold.", "picture": "stethoscope", "sound": ""}

Rules:
- 8 to 12 pages. Tell what will happen in order. At least half the pages are about the main part: ${KINDS[kind].focus}.
- Use complete, correct grammar with words like "the", "a", and "my". Simple does not mean broken English.
- Do not guess what people are like. Do not write "nice nurse" or "friendly doctor".
- Be honest. If something may hurt, say so and say how long it lasts. Never promise it will not hurt.
- Describe, do not command. Write "I can hold my grown-up's hand", not "I will hold still". Never write "I will not cry" or "I must sit still".
- One page mentions the comfort item by name. 1 or 2 pages use what helps the child feel calm.
- One page says it is OK to feel worried, and that the grown-ups are there to help. Use the "feelings" picture for it.
- The last page is a happy finish with the favorite thing: ${KINDS[kind].ending}
- Up to 4 exclamation marks in all the "text" and "fun" lines.
- Use literal words. No idioms. Never use the words "pinch", "quick", "brave", or "good boy" or "good girl".
- "title": short and fun, using the word NAME where the child's name goes, like "NAME's dentist adventure". Do not use NAME anywhere else.
- Return only JSON that matches the schema.`;

// The friend tells the story out loud, like a storyteller at bedtime.
const FRIEND_RULES = (friend) => `Friend rules:
- The story friend is ${friend}. The friend comes along with the child and tells the story.
- "say" is what ${friend} says out loud, warm and excited like a favorite storyteller, but never loud or sudden. Follow the age rules for how long it is. Talk to the child as "you". Say "we" for things you do together.
- Use the word NAME for the child's name on about every third page, never more than once per page.
- Talk like a real person telling a story out loud, not like a book: think out loud with "Hmm...", react with "Ooh!", "Wow!", "Uh-oh!", "Hee hee!", "Guess what?", "Here we go!". Use sound words the child will really hear.
- You may add one voice cue in square brackets per page, from this list only: [giggles], [laughs], [whispers], [excited], [gasps], [sighs]. Never on a page about something that hurts or is scary.
- The friend gets checked or does the activity too, in a silly, gentle way: "Count your teeth... then my blades! Hee hee." The friend may have a tiny, silly problem, like a squeaky wheel or a little booboo, that gets a gentle fix. The friend is never badly hurt and never scared of the real steps.
- On the first page the friend says hello and its own name from "helper". For a lawn mower friend: "Hmm... hello, NAME! It's me, Mo the Mower! [excited] Today... the dentist! You and me. Here we go!"
- Explain a painful moment on one page only, the page where it happens.
- After the first page the friend says "I" and "me", never its own name.
- "say" follows the same honesty rules. When something hurts, say so and say how long, then say how the friend and the grown-up will help. Example: "Psst... NAME. Now the shot. A sharp poke. It hurts for 2 seconds. One... two... done! I'm right here. Squeeze your grown-up's hand."
- The friend never says "be brave", "don't cry", "hold still", or "it won't hurt". The friend never does the medical steps.
- "friendLook": how the friend looks, for the illustrator, under 20 words. Example: "a cute green toy lawn mower with big friendly eyes and a yellow handle".`;

// Autistic kids often have a strong favorite interest. Telling the visit
// through it keeps them listening, but the medical steps must stay real.
const THEME_RULES = (theme) => `Theme rules:
- The child loves ${theme}. The friend is a ${theme} with a short, friendly name, like "Mo the Mower" for lawn mowers or "Tilly the Train" for trains. Make up a new name that fits ${theme}; use "Mo the Mower" only for lawn mowers. Put only the name in "helper", with no description, and use the same name on the first page.
- "friend": the picture closest to ${theme}. Must be one of: ${FRIEND_KEYS.join(', ')}.
- On 3 to 5 pages, use ${theme} in a comparison that helps the child picture a real sound, size, feeling, or movement: "The toothbrush buzzes like a tiny lawn mower." "The chair goes up slowly, like a mower on a ramp."
- No more than 4 pages in the whole story compare something to ${theme}, in "say" or "text". Skip the comparison when it does not fit. A plain page is better than a strange comparison. Never compare a painful moment to ${theme}; on that page the friend just stays close.
- The real steps stay true. Never say ${theme} are really there, and never change what the clinician or grown-up does.`;

// English and Spanish have fixed support lines below. Every other language
// gets them translated by the model in the same call.
const LANG_RULES = (lang) => `Language rules:
- Write "title", "text", "fun", "say", "sound", and "helper" in ${lang}. Use simple, natural words a child hears at home in ${lang}.
- Write "scene" and "friendLook" in English, always. They go to an illustrator.
- Keep the word NAME exactly as it is, in Latin letters.`;

const TRANSLATE_RULES = (lang, lines) => `Also fill "support" with these lines translated into ${lang}. Keep NAME as it is.
${Object.entries(lines).map(([key, [text, say]]) => `- ${key}: text "${text}" say "${say}"`).join('\n')}`;

// The parent picks what scares the child most. The story gives the child a
// plan for that moment, using ideas that are known to help.
const FEAR_RULES = `Fear rules:
- The child is most scared of the things listed under "Most scary". On the page just before that moment, the friend and the child make a plan: "I have a plan for the poke. I sit on my grown-up's lap and look at bubbles."
- On the scary page itself, the child uses the plan. Use only ideas from "Ways that help". Stay honest about what happens.
- If the parent described a fear in their own words, put the closest matches in "fears", from this list only: ${FEAR_IDS.join(', ')}.`;

function storySchema(theme, translate) {
  const schema = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      pages: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            fun: { type: 'string' },
            say: { type: 'string' },
            scene: { type: 'string' },
            sound: { type: 'string' },
            picture: { type: 'string', enum: [...PICTURE_KEYS, 'friend'] },
          },
          required: ['text', 'fun', 'say', 'scene', 'sound', 'picture'],
        },
      },
    },
    required: ['title', 'pages'],
  };
  schema.properties.friendLook = { type: 'string' };
  schema.required.push('friendLook');
  if (theme) {
    schema.properties.helper = { type: 'string' };
    schema.properties.friend = { type: 'string', enum: FRIEND_KEYS };
    schema.required.push('helper', 'friend');
  }
  schema.properties.fears = { type: 'array', items: { type: 'string', enum: FEAR_IDS } };
  if (translate) {
    const line = { type: 'object', properties: { text: { type: 'string' }, say: { type: 'string' } }, required: ['text', 'say'] };
    schema.properties.support = {
      type: 'object',
      properties: Object.fromEntries(SUPPORT_KEYS.map((k) => [k, line])),
      required: SUPPORT_KEYS,
    };
    schema.required.push('support');
  }
  return schema;
}

export async function writeStory(env, body) {
  const visitType = str(body.visitType, VISIT_TYPE_MAX);
  if (!visitType) throw new InputError('Choose or type the kind of visit.');

  const details = scrub(str(body.details, DETAILS_MAX));
  const age = AGES[body.age] ?? AGES['6-8'];
  const lang = LANGUAGES.find((l) => l.code === body.lang) ?? LANGUAGES[0];
  const theme = scrub(str(body.theme, THEME_MAX)).text;
  const known = activity(visitType);
  const kind = known?.kind ?? (body.kind === 'routine' ? 'routine' : 'visit');
  const comfort = str(body.comfort, 80);
  const favorite = str(body.favorite, 80);
  const translate = !SUPPORT_TEXT[lang.code];
  const picked = strs(body.fears, FEAR_IDS.length).filter((id) => FEAR_IDS.includes(id));
  const fearText = scrub(str(body.fearText, 200)).text;
  const scary = picked.map(fear);

  const user = [
    `${kind === 'visit' ? 'Visit' : 'Activity'}: ${visitType}`,
    known && `What usually happens, in order: ${known.steps}`,
    details.text && `Details: ${details.text}`,
    favorite && `Favorite thing: ${favorite}`,
    comfort && `Comfort item: ${comfort}`,
    listLine('Hard for the child', body.sensory),
    listLine('What helps the child', body.helps),
    scary.length && `Most scary: ${scary.map((f) => f.label.toLowerCase()).join('; ')}`,
    scary.length && `Ways that help: ${scary.flatMap((f) => f.helps).join('; ')}`,
    fearText && `The parent says this scares the child: "${fearText}"`,
    theme && `Story theme: ${theme}`,
  ].filter(Boolean).join('\n');

  const friendName = theme ? `a ${theme} friend` : DEFAULT_FRIEND.name;
  const system = [
    STORY_SYSTEM(kind),
    FRIEND_RULES(friendName),
    theme && THEME_RULES(theme),
    (scary.length || fearText) && FEAR_RULES,
    age,
    lang.code === 'en' ? 'Write all text in English.' : LANG_RULES(lang.en),
    translate && TRANSLATE_RULES(lang.en, englishSupports(kind, comfort || 'blanket', favorite || 'my toys')),
  ].filter(Boolean).join('\n\n');
  const raw = await runModel(env, system, user, storySchema(theme, translate));
  if (!raw) return { ...structuredClone(sampleStory), sample: true, removed: details.removed };

  const pages = objs(raw.pages, ['text', 'fun', 'say', 'scene', 'picture', 'sound'], 14).map((p) => ({
    text: `${p.text} ${p.fun}`.replace(/\bNAME\b/g, '').replace(/\[[a-z ]+\]/gi, '').replace(/\s{2,}/g, ' ').trim(),
    say: p.say.replace(/\[([a-z ]+)\]/gi, (tag, cue) => (CUES.includes(cue.toLowerCase()) ? tag.toLowerCase() : '')).slice(0, 400),
    scene: p.scene.replace(/\bNAME\b/g, 'the child').slice(0, 400),
    picture: PICTURE_KEYS.includes(p.picture) || p.picture === 'friend' ? p.picture : 'ok',
    sound: p.sound.slice(0, 24),
  })).filter((p) => p.text);
  addMissingSupports(pages, comfort, lang.code, favorite, { kind, translated: translate ? translatedSupports(raw.support) : null });

  return {
    title: str(raw.title, 120) || (kind === 'visit' ? 'NAME goes to the doctor' : 'NAME can do it'),
    pages,
    friend: theme
      ? {
          key: friendFor(theme) ?? (FRIEND_KEYS.includes(raw.friend) ? raw.friend : 'robot'),
          name: str(raw.helper, 40).split(/[,.(]/)[0].trim() || `My ${theme} friend`,
          look: str(raw.friendLook, 160) || `a cute, friendly ${theme} character with big eyes`,
          theme,
        }
      : { ...DEFAULT_FRIEND },
    plan: fearPlan([...picked, ...(fearText ? strs(raw.fears, 3) : [])]),
    removed: details.removed,
  };
}

// The parent's checklist for the scary parts, straight from the library.
function fearPlan(ids) {
  return [...new Set(ids)].map(fear).filter(Boolean).slice(0, 4)
    .map(({ id, label, helps, ask, src }) => ({ id, label, helps, ask, src }));
}

const SUPPORT_KEYS = ['comfort', 'feelings', 'done', 'favorite'];

const SUPPORT_TEXT = {
  en: {
    comfort: (item) => [`I can bring my ${item} with me.`, `Ooh, look! Your ${item}. Your ${item} comes too! Hold it tight.`],
    feelings: ['It is OK to feel worried. My grown-up is there to help me.', 'Hmm... feeling worried? That is OK, NAME. Your grown-up is here. And me too!'],
    done: (kind) => kind === 'visit'
      ? ['The visit is over. I did it.', 'Yaaay! All done! You did it. You did it!']
      : ['All done. I did it.', 'Yaaay! All done! You did it. You did it!'],
    favorite: (thing) => [`Now it is time for ${thing}.`, `Guess what? ${cap(thing)}! Yay... ${thing}!`],
  },
  es: {
    comfort: (item) => [`Puedo llevar mi ${item} conmigo.`, `¡Mira! Tu ${item}. ¡Tu ${item} viene también! Abrázalo fuerte.`],
    feelings: ['Está bien sentir nervios. Mi adulto está ahí para ayudarme.', 'Mmm... ¿sientes nervios? Está bien, NAME. Tu adulto está aquí. ¡Y yo también!'],
    done: (kind) => kind === 'visit'
      ? ['La visita terminó. Lo logré.', '¡Bieeen! ¡Terminamos! Lo lograste. ¡Lo lograste!']
      : ['Ya terminé. Lo logré.', '¡Bieeen! ¡Terminamos! Lo lograste. ¡Lo lograste!'],
    favorite: (thing) => [`Ahora es hora de ${thing}.`, `¿Sabes qué? ¡${cap(thing)}! ¡Sí... ${thing}!`],
  },
};

// The model sometimes picks an odd icon (a ladybug for lawn mowers), so a
// plain name match wins when there is one.
export function friendFor(theme) {
  const one = (s) => s.toLowerCase().trim().replace(/(\w)s\b/g, '$1');
  const want = one(theme);
  return FRIEND_KEYS.find((key) => [key, ...FRIENDS[key].label.split(/ or |,/)]
    .map(one).some((name) => name && (want.includes(name) || name.includes(want))));
}

function cap(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function englishSupports(kind, item, thing) {
  const en = SUPPORT_TEXT.en;
  return { comfort: en.comfort(item), feelings: en.feelings, done: en.done(kind), favorite: en.favorite(thing) };
}

// The model's translations, shaped like SUPPORT_TEXT. Missing lines fall back to English.
function translatedSupports(raw) {
  const line = (key) => {
    const t = raw?.[key];
    return t && str(t.text, 200) && str(t.say, 300) ? [str(t.text, 200), str(t.say, 300)] : null;
  };
  const en = SUPPORT_TEXT.en;
  return {
    comfort: (item) => line('comfort') ?? en.comfort(item),
    feelings: line('feelings') ?? en.feelings,
    done: (kind) => line('done') ?? en.done(kind),
    favorite: (thing) => line('favorite') ?? en.favorite(thing),
  };
}

const SCENES = {
  comfort: (item, kind) => `The child happily holds their ${item} close in a calm ${kind === 'visit' ? 'clinic waiting room' : 'cozy room at home'}, with the friend beside them hugging something too.`,
  feelings: 'The child sits close to their grown-up, who gives a gentle hug. The friend snuggles in too. Calm, soft light.',
  done: (kind) => kind === 'visit'
    ? 'The child and their grown-up walk out of the clinic door, smiling, with the friend.'
    : 'The child smiles and gives their grown-up a high five, and the friend cheers with its arms up.',
  favorite: (thing) => `The child plays happily with ${thing} at home, with the friend playing too.`,
};

const support = ([text, say], picture, scene) => ({ text, say, scene, picture, sound: '' });

const ENDINGS = ['done', 'home', 'favorite', 'play', 'sticker', 'friend'];

// Every story needs the comfort item, permission to feel worried, and a clear
// ending. The model sometimes drops them, so add them back in fixed places.
export function addMissingSupports(pages, comfort, lang = 'en', favorite = '', { kind = 'visit', translated = null } = {}) {
  const text = translated ?? SUPPORT_TEXT[lang] ?? SUPPORT_TEXT.en;
  const all = pages.map((p) => p.text.toLowerCase()).join(' ');
  const has = (picture) => pages.some((p) => p.picture === picture);

  if (comfort && !has('comfort') && !all.includes(comfort.toLowerCase())) {
    pages.splice(Math.min(1, pages.length), 0, support(text.comfort(comfort), 'comfort', SCENES.comfort(comfort, kind)));
  }
  if (!has('feelings') && !/worried|nervios/i.test(all)) {
    pages.splice(Math.min(2, pages.length), 0, support(text.feelings, 'feelings', SCENES.feelings));
  }
  if (!pages.slice(-2).some((p) => ENDINGS.includes(p.picture))) {
    pages.push(support(text.done(kind), 'done', SCENES.done(kind)));
  }
  const fav = favorite.toLowerCase().replace(/s$/, '');
  const ending = pages.slice(-2).map((p) => `${p.text} ${p.say}`).join(' ').toLowerCase();
  if (favorite && !has('favorite') && !all.includes(fav) && !ending.includes(fav)) {
    pages.push(support(text.favorite(favorite), 'favorite', SCENES.favorite(favorite)));
  }
  return pages;
}

async function runModel(env, system, user, schema) {
  if (!env.AI || env.MOCK_AI === '1') return null;

  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];

  try {
    const res = await env.AI.run(env.MODEL || MODEL, {
      messages,
      response_format: { type: 'json_schema', json_schema: schema },
      max_tokens: 3500,
      temperature: 0.4,
    });
    return parse(res.response);
  } catch {
    // JSON mode can fail on long outputs. Retry once with plain text and parse it.
    const res = await env.AI.run(env.MODEL || MODEL, { messages, max_tokens: 3500, temperature: 0.2 });
    return parse(res.response);
  }
}

function parse(value) {
  if (value && typeof value === 'object') return value;
  const text = String(value ?? '');
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Model did not return JSON');
  }
}

function listLine(label, items) {
  const list = strs(items, 12);
  return list.length ? `${label}: ${list.join('; ')}` : '';
}

function str(value, max = 400) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function strs(value, max = 12) {
  if (!Array.isArray(value)) return [];
  return value.map((v) => str(v)).filter(Boolean).slice(0, max);
}

function objs(value, keys, max) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v) => v && typeof v === 'object')
    .map((v) => Object.fromEntries(keys.map((k) => [k, str(v[k])])))
    .filter((v) => Object.values(v).some(Boolean))
    .slice(0, max);
}
