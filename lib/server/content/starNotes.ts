// SERVER-ONLY. The paid per-star content of The Master of Geomancy (house-6 and house-2 meanings and
// remedies, sadaqah offerings and days) and the per-element occupations list, relocated here from
// content/stars.ts so that NO client-reachable module imports it: it must never be statically imported by
// a 'use client' file, a shared component or any public route. It is read only inside server code after an
// entitlement check (see lib/server/raml/chartNotes.ts and app/api/raml/chart-notes/route.ts for the
// per-chart notes, and app/books/[id]/read/page.tsx, a Server Component behind the book access gate).
// The strings are unchanged from the original content/stars.ts; they were moved, not edited.
import type { Element } from '@/content/stars';

export interface StarNotes {
  house6: { meaning: string; remedy: string };
  house2: { meaning: string; remedy: string };
  sadaqah: { offering: string; day: string };
}

export const STAR_NOTES: Record<string, StarNotes> = {
  "yussif": {
    house6: { meaning: "Sickness is rooted in enmity — witchcraft directed at the querent.", remedy: "Sadaqah of massan (11), cow milk and a red cock, given on a Friday." },
    house2: { meaning: "Money will be sent to someone, but success and finances are blocked — financial instability.", remedy: "Recite \"Ya Tahir\" 251 times and Surah Al-Quraish 5 times over water for drinking and rubbing." },
    sadaqah: { offering: "Red cock, red cloth and red money", day: "Friday morning" },
  },
  "adam": {
    house6: { meaning: "The querent’s surroundings are full of witches and wizards; sickness starts from the head and lingers.", remedy: "Sadaqah of one white cola nut, massan (any number) and fresh cow milk." },
    house2: { meaning: "A large sum of money is coming soon.", remedy: "Recite \"Ya Allah\" 66 times and Surah Al-A’la over water for drinking and rubbing." },
    sadaqah: { offering: "Red cake or baked bread and red money", day: "Thursday morning" },
  },
  "mahadi": {
    house6: { meaning: "A mild mental disturbance.", remedy: "Sadaqah of one white cola nut and one white hen, given to a healthy man." },
    house2: { meaning: "A good sum of money will arrive soon.", remedy: "Recite \"Ya Zaki\" 37 times and Surah Al-Mulk once over water for drinking and rubbing." },
    sadaqah: { offering: "An egg", day: "Friday at sunrise" },
  },
  "iddris": {
    house6: { meaning: "Jinn sickness — often chest pain lasting a long time, and difficulty settling into marriage.", remedy: "Sadaqah of white cloth, three white cola nuts and sea water, given to a Muslim brother." },
    house2: { meaning: "Money is on its way, often arriving the same day.", remedy: "Recite \"Ya Rahim\" 115 times, Surah Al-Kawthar once and Surah An-Naba once over water for drinking and rubbing." },
    sadaqah: { offering: "Flowers or bread", day: "Monday, after Maghrib" },
  },
  "ibrahim": {
    house6: { meaning: "A jinn spirit that comes and goes; pain along the ribs or from waist to knees.", remedy: "Sadaqah of four cola nuts, cow milk and a white veil, given to a young woman." },
    house2: { meaning: "Fraud, or money being stolen; financial problems.", remedy: "Recite \"Ya Alim\" 150 times, Surah Al-Qadr once and Surah Az-Zalzalah once over water for drinking and rubbing." },
    sadaqah: { offering: "White rice and a white fowl", day: "Monday afternoon, before Dhuhr" },
  },
  "issah": {
    house6: { meaning: "A jinn spirit or long-standing sickness rooted in enmity; hinders a stable marriage.", remedy: "Sadaqah of fresh cow milk and one white cola nut to a sick person, then biscuits or toffees to children. Recite \"Ya Latif\" 129 times and Surah Al-A’la once over water." },
    house2: { meaning: "Financial problems.", remedy: "Give six white cola nuts to someone in need; split one, chew half with your intention and give the other half away. Recite \"Ya Latif\" 129 times and the same surah over water." },
    sadaqah: { offering: "Red cloth, red cola nut, red palm oil, palm kernel (abbe)", day: "Wednesday, after Asr" },
  },
  "umar": {
    house6: { meaning: "Sickness from witches and wizards — enmity, often from an older woman.", remedy: "Sadaqah of red cola nut (7), a red hen and massan (7)." },
    house2: { meaning: "Financial instability; difficulty getting money.", remedy: "Sadaqah of red cola nut (7) and a red goat, given to a woman far from you. Recite \"Ya Jabbar\" 206 times and Ayat al-Kursi 11 times." },
    sadaqah: { offering: "Red money, red meat, salt and palm oil", day: "Tuesday at sunrise" },
  },
  "ayuba": {
    house6: { meaning: "A jinn or spiritual affliction affecting marriage; difficulty settling into a stable relationship.", remedy: "Sadaqah of a black hen — cook it and give the food entirely to the poor, without tasting it yourself." },
    house2: { meaning: "Darkness over one’s success; business and money refuse to move forward.", remedy: "Recite \"Ya Basit\" 312 times, Ayat al-Kursi 7 times, Surah Al-Falaq 7 times and Surah An-Nas 7 times over water." },
    sadaqah: { offering: "A tuber of yam", day: "Saturday, after Isha" },
  },
  "kalla-allahu": {
    house6: { meaning: "Sickness caused by enemies from far away, not close to the querent.", remedy: "Sadaqah of massan (6) and any milk." },
    house2: { meaning: "Money is being mismanaged, knowingly or not.", remedy: "Sadaqah of cow milk, a hen of any colour and a cola nut of any colour. Recite \"Ya Hadi\" 20 times and Surah Al-Qari’ah once." },
    sadaqah: { offering: "A white dove or hen", day: "Sunday afternoon, after Dhuhr" },
  },
  "sulemana": {
    house6: { meaning: "Sickness from jinn and shaytan — often striking those who walk at odd, quiet hours, or who fell a large tree.", remedy: "Sadaqah of six red cola nuts, six pieces of pepper and a red hen." },
    house2: { meaning: "A spell is on the person; money will not stay stable in their hands.", remedy: "Take a local egg to where three paths meet, state your intention, break it in the middle and leave without the contents touching you. Recite \"Ya Nur\" 256 times and Surah Al-Ikhlas 7 times." },
    sadaqah: { offering: "Dates (tamaru) and a piece of alon ka", day: "Saturday, at Maghrib" },
  },
  "ali": {
    house6: { meaning: "Sickness from a bad wind, encountered unknowingly.", remedy: "Sadaqah of a sheep or goat; if unavailable, one yellow cola nut until the larger sadaqah can be done." },
    house2: { meaning: "Many enemies, born of a successful life and a promising future; also financial problems.", remedy: "Sadaqah of one cola nut with your intention, followed by a goat of any colour. Recite \"Ya Salaam\" 370 times and Surah Al-Bayyinah once." },
    sadaqah: { offering: "A packet of good-scented incense", day: "Wednesday morning" },
  },
  "nuhu": {
    house6: { meaning: "Sickness from sihr (magic) — an enmity sickness.", remedy: "Sadaqah of a red goat, dedicated with a recitation of Yasin." },
    house2: { meaning: "Much money is coming, but so are many new enemies — people will resent the success.", remedy: "Sadaqah of cow milk, three pieces of pepper and red money, given to an elderly man. Recite \"Ya Wakil\" 66 times and Surah Az-Zalzalah once." },
    sadaqah: { offering: "A red goat or red cock", day: "Thursday, at Maghrib" },
  },
  "hassan-hussein": {
    house6: { meaning: "Jinn sickness, often serious enough to involve hospital admission; can present as mental, financial or marital trouble.", remedy: "Sadaqah of two hens from the same mother, one released north and one south. Recite \"Ya Halim\" 88 times and Surah Al-Qadr once." },
    house2: { meaning: "Serious financial problems.", remedy: "The same sadaqah and recitation as above." },
    sadaqah: { offering: "A packet of good-scented incense", day: "Saturday, after Isha" },
  },
  "yunus": {
    house6: { meaning: "Sickness from enemies, envy and jealousy — often from stepping on sihr or being sworn against.", remedy: "Recite Ayat al-Kursi 9 times each morning before leaving the house. Sadaqah of a white hen and seven white cola nuts, then white water (Zamzam or rose water). Recite \"Ya Hayyu Ya Qayyum\" 18 times with the closing ayat of Surah Al-Hadid." },
    house2: { meaning: "Money is on its way to both the querent and the geomancer.", remedy: "Sadaqah of a white cock and cooked food, feeding fifty people or at least five men." },
    sadaqah: { offering: "A sheep, any colour", day: "Tuesday afternoon, before Dhuhr" },
  },
  "usman": {
    house6: { meaning: "A trial from Allah — some say sent by another teacher out of envy toward a sincere, open-hearted scholar.", remedy: "Sadaqah of a mixed-colour hen, given to a teacher (Mualim/Mualimaat) with your intention. Recite \"Ya Kafi\" 111 times and Surah Ash-Sharh once." },
    house2: { meaning: "Money is coming, but modestly — finances remain tied up.", remedy: "The same sadaqah and recitation as above." },
    sadaqah: { offering: "Pepper, tomatoes, onions, salt", day: "Sunday, after Asr" },
  },
  "musah": {
    house6: { meaning: "Sickness from witchcraft — enmity born of the querent’s success or bright future.", remedy: "Sadaqah of massan (8), followed by a sheep given to teachers to recite Qur’an or Yasin." },
    house2: { meaning: "Substantial money is coming, but it will not stay stable in hand.", remedy: "Sadaqah of a white cock and cooked food for children (or cow milk with fula and sugar). Recite \"Ya Jami’\" 114 times and Surah An-Naba once." },
    sadaqah: { offering: "Cooked food shared out — one bowl for children, three for neighbours", day: "Wednesday morning" },
  },
};

export const ELEMENT_OCCUPATIONS: Record<Element, string> = {
  fire: "Chef work, restaurant or bar, selling tea or food, fire service, electrical work, welding, blacksmithing, charcoal burning or selling.",
  air: "Driving, piloting, teaching, office work, business, secretarial work, handwork, music, drumming.",
  water: "Fishing, painting, artistry, washing, making or selling pure/sachet water, digging boreholes.",
  sand: "Farming, galamsey work, masonry, contracting, selling land or sand, geomancy itself, selling grains and tubers.",
};

export function getStarNotes(starId: string): StarNotes | undefined {
  return STAR_NOTES[starId];
}
