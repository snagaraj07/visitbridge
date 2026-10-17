// Story languages. The first 10 are the languages most spoken at home in the
// US (Census ACS), shown as buttons. The rest go in the dropdown.
//   code  - sent to the worker
//   name  - how the language calls itself
//   en    - the English name, used in the prompt
//   tag   - BCP 47 tag for the device voice
//   rtl   - written right to left
export const LANGUAGES = [
  { code: 'en', name: 'English', en: 'English', tag: 'en-US' },
  { code: 'es', name: 'Español', en: 'Spanish', tag: 'es-US' },
  { code: 'zh', name: '中文', en: 'Simplified Chinese (Mandarin)', tag: 'zh-CN' },
  { code: 'tl', name: 'Tagalog', en: 'Tagalog', tag: 'fil-PH' },
  { code: 'vi', name: 'Tiếng Việt', en: 'Vietnamese', tag: 'vi-VN' },
  { code: 'ar', name: 'العربية', en: 'Arabic', tag: 'ar', rtl: true },
  { code: 'fr', name: 'Français', en: 'French', tag: 'fr-FR' },
  { code: 'ko', name: '한국어', en: 'Korean', tag: 'ko-KR' },
  { code: 'ru', name: 'Русский', en: 'Russian', tag: 'ru-RU' },
  { code: 'hi', name: 'हिन्दी', en: 'Hindi', tag: 'hi-IN' },

  { code: 'pt', name: 'Português', en: 'Portuguese', tag: 'pt-BR' },
  { code: 'ht', name: 'Kreyòl ayisyen', en: 'Haitian Creole', tag: 'ht' },
  { code: 'de', name: 'Deutsch', en: 'German', tag: 'de-DE' },
  { code: 'te', name: 'తెలుగు', en: 'Telugu', tag: 'te-IN' },
  { code: 'ur', name: 'اردو', en: 'Urdu', tag: 'ur-PK', rtl: true },
  { code: 'bn', name: 'বাংলা', en: 'Bengali', tag: 'bn-IN' },
  { code: 'gu', name: 'ગુજરાતી', en: 'Gujarati', tag: 'gu-IN' },
  { code: 'ta', name: 'தமிழ்', en: 'Tamil', tag: 'ta-IN' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', en: 'Punjabi (Gurmukhi script)', tag: 'pa-IN' },
  { code: 'ml', name: 'മലയാളം', en: 'Malayalam', tag: 'ml-IN' },
  { code: 'kn', name: 'ಕನ್ನಡ', en: 'Kannada', tag: 'kn-IN' },
  { code: 'mr', name: 'मराठी', en: 'Marathi', tag: 'mr-IN' },
  { code: 'ne', name: 'नेपाली', en: 'Nepali', tag: 'ne-NP' },
  { code: 'pl', name: 'Polski', en: 'Polish', tag: 'pl-PL' },
  { code: 'it', name: 'Italiano', en: 'Italian', tag: 'it-IT' },
  { code: 'uk', name: 'Українська', en: 'Ukrainian', tag: 'uk-UA' },
  { code: 'ja', name: '日本語', en: 'Japanese', tag: 'ja-JP' },
  { code: 'fa', name: 'فارسی', en: 'Persian (Farsi)', tag: 'fa-IR', rtl: true },
  { code: 'he', name: 'עברית', en: 'Hebrew', tag: 'he-IL', rtl: true },
  { code: 'el', name: 'Ελληνικά', en: 'Greek', tag: 'el-GR' },
  { code: 'tr', name: 'Türkçe', en: 'Turkish', tag: 'tr-TR' },
  { code: 'th', name: 'ไทย', en: 'Thai', tag: 'th-TH' },
  { code: 'id', name: 'Bahasa Indonesia', en: 'Indonesian', tag: 'id-ID' },
  { code: 'km', name: 'ភាសាខ្មែរ', en: 'Khmer', tag: 'km-KH' },
  { code: 'lo', name: 'ພາສາລາວ', en: 'Lao', tag: 'lo-LA' },
  { code: 'my', name: 'မြန်မာ', en: 'Burmese', tag: 'my-MM' },
  { code: 'so', name: 'Soomaali', en: 'Somali', tag: 'so-SO' },
  { code: 'am', name: 'አማርኛ', en: 'Amharic', tag: 'am-ET' },
  { code: 'sw', name: 'Kiswahili', en: 'Swahili', tag: 'sw-KE' },
  { code: 'yo', name: 'Yorùbá', en: 'Yoruba', tag: 'yo-NG' },
];

export const TOP_LANGUAGES = LANGUAGES.slice(0, 10);

// Languages with an AI voice on the worker (see src/media.js).
export const AI_VOICE = ['en', 'es', 'fr', 'zh', 'ja', 'ko'];

export function language(code) {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}
