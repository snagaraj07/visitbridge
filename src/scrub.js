// Removes common personal identifiers before text leaves for the model.
// Names in free text are not caught, the UI asks people not to include them.

const RULES = [
  { label: 'email', re: /[\w.+-]+@[\w-]+\.[\w.-]+/g },
  { label: 'ssn', re: /\b\d{3}-\d{2}-\d{4}\b/g },
  { label: 'phone', re: /(\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g },
  { label: 'mrn', re: /\b(MRN|medical record( number)?|record #|acct|account)\s*[:#]?\s*[A-Z0-9-]{4,}/gi },
  { label: 'dob', re: /\b(DOB|date of birth|birth ?date)\s*[:#]?\s*[\d/.-]{6,10}/gi },
  { label: 'name', re: /\b([Pp]atient( [Nn]ame)?|PATIENT|[Ff]ull [Nn]ame)\s*:\s*[A-Z][A-Za-z'-]*( [A-Z][A-Za-z'-]*){0,3}/g },
  { label: 'address', re: /\b\d{1,5}\s+[A-Z][a-z]+(\s[A-Z][a-z]+)*\s(St|Street|Ave|Avenue|Rd|Road|Blvd|Dr|Drive|Ln|Lane|Ct|Way)\b\.?/g },
];

export function scrub(text) {
  let out = String(text ?? '');
  let removed = 0;
  for (const { label, re } of RULES) {
    out = out.replace(re, () => {
      removed++;
      return `[${label} removed]`;
    });
  }
  return { text: out, removed };
}
