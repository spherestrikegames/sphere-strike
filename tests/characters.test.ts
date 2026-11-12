import test from 'node:test';
import assert from 'node:assert/strict';
import { FORTNITE_SKINS } from '../src/data/skinsData';
import { buildCharacterModel } from '../src/game/fortniteCharacter';

test('character roster contains distinct original male character designs', () => {
  const ids = FORTNITE_SKINS.map((skin) => skin.id);
  const names = FORTNITE_SKINS.map((skin) => skin.name);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(names).size, names.length);
  assert.deepEqual(ids, ['zyro', 'rift', 'vexlo', 'kairox', 'voltix', 'nex', 'glitch', 'orbito']);
  for (const skin of FORTNITE_SKINS) {
    assert.ok(skin.hairStyle);
    assert.ok(skin.accessory);
    assert.match(skin.description, /./);
  }
});

test('each roster skin builds a visible rig with a working weapon slot', () => {
  for (const skin of FORTNITE_SKINS) {
    const rig = buildCharacterModel(skin.id, 'ar', 'epic');
    assert.equal(rig.skinId, skin.id);
    assert.ok(rig.root.children.length > 0);
    assert.equal(rig.weaponSlot.children.length, 1);
    rig.setWeapon('shotgun', 'rare');
    assert.equal(rig.currentWeaponType, 'shotgun');
    assert.equal(rig.weaponSlot.children.length, 1);
  }
});

test('legacy saved skin selections resolve to original roster designs', () => {
  const rig = buildCharacterModel('renegade_raider');
  assert.equal(rig.skinId, 'kairox');
});
