export type SceneId = 'sakura' | 'neon' | 'station' | 'hallway';

export type Scene = {
  id: SceneId;
  name: string;
  jp: string;
  sky: [string, string];
  /** whether UI on top should use light text */
  dark: boolean;
};

export const SCENES: Scene[] = [
  { id: 'sakura', name: 'Cherry Blossom Street', jp: '桜通り', sky: ['#FFE9EF', '#FFF8F2'], dark: false },
  { id: 'neon', name: 'Neon City', jp: '夜の街', sky: ['#160F2E', '#3A1C5C'], dark: true },
  { id: 'station', name: 'Rural Station', jp: '田舎の駅', sky: ['#FFB88C', '#FFE6C7'], dark: false },
  { id: 'hallway', name: 'School Hallway', jp: '廊下', sky: ['#EAF2F8', '#F8F4EC'], dark: false },
];

export const sceneById = (id: SceneId) => SCENES.find((s) => s.id === id)!;
