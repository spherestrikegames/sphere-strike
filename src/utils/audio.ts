import { FortniteMusicEngine } from './audio/audioMusic';

export type FortniteSoundSystem = FortniteMusicEngine;
export const fortniteAudio = new FortniteMusicEngine();
export { FortniteSoundSystemCore } from './audio/audioCore';
export { FortniteGunshotsEngine } from './audio/audioGunshots';
export { FortniteGameplayAudioEngine } from './audio/audioGameplay';
export { FortniteMusicEngine } from './audio/audioMusic';
