export const BLOCKED_NOTICE = 'Your post contains language that is not allowed here. Please rephrase it respectfully.'
const BLOCKED = ['fuck','shit','bitch','bastard','asshole','dick','pussy','cunt','slut','whore','nigger','faggot','retard','idiot','stupid']
function normalise(t: string): string { return t.toLowerCase().split('@').join('a').split('0').join('o').split('1').join('i').split('!').join('i').split('3').join('e').split('5').join('s').replace(/[^a-z]/g, '') }
export function checkText(text: string): { ok: boolean } { const s = normalise(text); return { ok: !BLOCKED.some(w => s.includes(w)) } }
