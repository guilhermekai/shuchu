/**
 * Original chibi heroes. Each is an archetype, not an existing character:
 * names, palettes and silhouettes are invented for Shūchū.
 * `look` drives the SVG placeholder; `riveArtboard` is where the Rive file plugs in.
 */
export type HeroId =
  | 'kaze'
  | 'tetsu'
  | 'hoshi'
  | 'jin'
  | 'suzu'
  | 'haru'
  | 'kon'
  | 'menma';

export type HeroLook = {
  skin: string;
  hair: string;
  hairStyle: 'spiky' | 'topknot' | 'twintails' | 'short' | 'long' | 'bob' | 'fox' | 'bandana';
  outfit: string;
  outfitAccent: string;
  eye: string;
  /** Signature built-in accessory, separate from shop cosmetics. */
  signature: 'mask' | 'sheath' | 'wand' | 'visor' | 'gohei' | 'satchel' | 'tail' | 'towel';
};

export type Hero = {
  id: HeroId;
  name: string;
  kanji: string;
  archetype: string;
  archetypeJp: string;
  tagline: string;
  cost: number; // 0 = starter
  look: HeroLook;
  riveArtboard: string;
};

export const HEROES: Hero[] = [
  {
    id: 'haru',
    name: 'Haru',
    kanji: '春',
    archetype: 'Student',
    archetypeJp: '学生',
    tagline: 'Front row, sharpened pencils, unstoppable.',
    cost: 0,
    look: { skin: '#FCE3D2', hair: '#3A2A26', hairStyle: 'short', outfit: '#24324F', outfitAccent: '#E5483B', eye: '#4A3528', signature: 'satchel' },
    riveArtboard: 'Haru',
  },
  {
    id: 'kaze',
    name: 'Kaze',
    kanji: '風',
    archetype: 'Ninja',
    archetypeJp: '忍者',
    tagline: 'Moves fast. Finishes faster.',
    cost: 0,
    look: { skin: '#F7D9C4', hair: '#2B2D42', hairStyle: 'spiky', outfit: '#2F3550', outfitAccent: '#7FA8D9', eye: '#2B2D42', signature: 'mask' },
    riveArtboard: 'Kaze',
  },
  {
    id: 'suzu',
    name: 'Suzu',
    kanji: '鈴',
    archetype: 'Shrine Maiden',
    archetypeJp: '巫女',
    tagline: 'Calm as the morning bell.',
    cost: 120,
    look: { skin: '#FCE6D8', hair: '#1E1B24', hairStyle: 'long', outfit: '#FFFFFF', outfitAccent: '#D7263D', eye: '#6B2737', signature: 'gohei' },
    riveArtboard: 'Suzu',
  },
  {
    id: 'tetsu',
    name: 'Tetsu',
    kanji: '鉄',
    archetype: 'Samurai',
    archetypeJp: '侍',
    tagline: 'One cut. One task. No distractions.',
    cost: 180,
    look: { skin: '#F2D0B5', hair: '#1D1A1A', hairStyle: 'topknot', outfit: '#5B3A6E', outfitAccent: '#C9A227', eye: '#2A1E1A', signature: 'sheath' },
    riveArtboard: 'Tetsu',
  },
  {
    id: 'menma',
    name: 'Menma',
    kanji: '麺',
    archetype: 'Ramen Chef',
    archetypeJp: '料理人',
    tagline: 'Simmers for hours. Worth it.',
    cost: 180,
    look: { skin: '#F5D3B8', hair: '#5A3B2E', hairStyle: 'bandana', outfit: '#F7F7F2', outfitAccent: '#2E4057', eye: '#3B2A22', signature: 'towel' },
    riveArtboard: 'Menma',
  },
  {
    id: 'hoshi',
    name: 'Hoshi',
    kanji: '星',
    archetype: 'Magical Girl',
    archetypeJp: '魔法少女',
    tagline: 'Focus is the real transformation.',
    cost: 260,
    look: { skin: '#FDE7DA', hair: '#F7A1C4', hairStyle: 'twintails', outfit: '#FFFFFF', outfitAccent: '#8E6CEF', eye: '#8E6CEF', signature: 'wand' },
    riveArtboard: 'Hoshi',
  },
  {
    id: 'jin',
    name: 'Jin',
    kanji: '迅',
    archetype: 'Mecha Pilot',
    archetypeJp: 'パイロット',
    tagline: 'Systems green. Distractions offline.',
    cost: 340,
    look: { skin: '#F3D5C0', hair: '#E2E8F0', hairStyle: 'bob', outfit: '#F26B21', outfitAccent: '#1F2933', eye: '#2563EB', signature: 'visor' },
    riveArtboard: 'Jin',
  },
  {
    id: 'kon',
    name: 'Kon',
    kanji: '狐',
    archetype: 'Kitsune',
    archetypeJp: '狐',
    tagline: 'Nine tails, one focus.',
    cost: 480,
    look: { skin: '#FCEBDD', hair: '#F2A541', hairStyle: 'fox', outfit: '#FDF6EC', outfitAccent: '#C2410C', eye: '#B45309', signature: 'tail' },
    riveArtboard: 'Kon',
  },
];

export const heroById = (id: HeroId) => HEROES.find((h) => h.id === id)!;
