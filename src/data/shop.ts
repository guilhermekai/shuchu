export type Slot = 'head' | 'outfit' | 'hand' | 'pet' | 'treat';

export type ShopItem = {
  id: string;
  name: string;
  jp: string;
  slot: Slot;
  price: number;
  color: string;
  accent: string;
  /** Visual variant the SVG renderer draws. */
  kind:
    | 'headband'
    | 'kitsune-mask'
    | 'straw-hat'
    | 'yukata'
    | 'kimono'
    | 'mecha-armor'
    | 'katana'
    | 'fan'
    | 'ramen'
    | 'tanuki'
    | 'shiba'
    | 'dango';
};

export const SLOTS: { slot: Slot; label: string; jp: string }[] = [
  { slot: 'head', label: 'Headwear', jp: '頭' },
  { slot: 'outfit', label: 'Outfits', jp: '服' },
  { slot: 'hand', label: 'Gear', jp: '道具' },
  { slot: 'pet', label: 'Pets', jp: '相棒' },
  { slot: 'treat', label: 'Treats', jp: '食' },
];

export const SHOP: ShopItem[] = [
  { id: 'hachimaki-red', name: 'Hachimaki', jp: '鉢巻', slot: 'head', price: 10, color: '#FFFFFF', accent: '#E5483B', kind: 'headband' },
  { id: 'hachimaki-indigo', name: 'Indigo Hachimaki', jp: '藍鉢巻', slot: 'head', price: 14, color: '#3B5BDB', accent: '#FFFFFF', kind: 'headband' },
  { id: 'kitsune-mask', name: 'Kitsune Mask', jp: '狐面', slot: 'head', price: 35, color: '#FFFFFF', accent: '#E5483B', kind: 'kitsune-mask' },
  { id: 'straw-hat', name: 'Kasa Hat', jp: '笠', slot: 'head', price: 25, color: '#E9C46A', accent: '#8D6E3F', kind: 'straw-hat' },

  { id: 'yukata-asagao', name: 'Morning Glory Yukata', jp: '浴衣', slot: 'outfit', price: 40, color: '#5C7CFA', accent: '#FFFFFF', kind: 'yukata' },
  { id: 'yukata-sakura', name: 'Sakura Yukata', jp: '桜浴衣', slot: 'outfit', price: 45, color: '#FFD6E0', accent: '#F07C9A', kind: 'yukata' },
  { id: 'kimono-crane', name: 'Crane Kimono', jp: '鶴着物', slot: 'outfit', price: 70, color: '#1B1A1F', accent: '#F5B83D', kind: 'kimono' },
  { id: 'mecha-armor', name: 'Mecha Armor', jp: '装甲', slot: 'outfit', price: 90, color: '#CBD5E1', accent: '#F26B21', kind: 'mecha-armor' },

  { id: 'bokken', name: 'Practice Katana', jp: '木刀', slot: 'hand', price: 20, color: '#C08552', accent: '#5E3023', kind: 'katana' },
  { id: 'katana-moon', name: 'Moonlight Katana', jp: '月光刀', slot: 'hand', price: 60, color: '#E2E8F0', accent: '#7C3AED', kind: 'katana' },
  { id: 'uchiwa', name: 'Uchiwa Fan', jp: '団扇', slot: 'hand', price: 15, color: '#FFFFFF', accent: '#E5483B', kind: 'fan' },

  { id: 'tanuki', name: 'Tanuki', jp: '狸', slot: 'pet', price: 55, color: '#8B6F5A', accent: '#3E2F27', kind: 'tanuki' },
  { id: 'shiba', name: 'Shiba', jp: '柴犬', slot: 'pet', price: 65, color: '#E0A25E', accent: '#FFFFFF', kind: 'shiba' },

  { id: 'ramen', name: 'Tonkotsu Ramen', jp: 'ラーメン', slot: 'treat', price: 12, color: '#E5483B', accent: '#F5E6C8', kind: 'ramen' },
  { id: 'dango', name: 'Hanami Dango', jp: '団子', slot: 'treat', price: 8, color: '#F7A1C4', accent: '#A7D7A0', kind: 'dango' },
];

export const itemById = (id: string) => SHOP.find((i) => i.id === id);
