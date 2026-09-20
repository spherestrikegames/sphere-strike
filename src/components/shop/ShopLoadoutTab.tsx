import React from 'react';
import { PlayerProfile } from '../../types';
import { WEAPON_REGISTRY } from '../../data/fortniteData';
import { fortniteAudio } from '../../utils/audio';
import { Target, Check } from 'lucide-react';

interface ShopLoadoutTabProps {
  profile: PlayerProfile;
  onUpdateProfile: (updated: PlayerProfile) => void;
  unlockedWeapons: string[];
  setClaimedRewardMessage: (msg: string | null) => void;
}

export const ShopLoadoutTab: React.FC<ShopLoadoutTabProps> = ({
  profile,
  onUpdateProfile,
  unlockedWeapons,
  setClaimedRewardMessage,
}) => {
  const handleEquipSlot = (weaponId: string, slotKey: keyof typeof profile.loadout) => {
    const updated: PlayerProfile = {
      ...profile,
      loadout: {
        ...profile.loadout,
        [slotKey]: weaponId,
      },
    };
    onUpdateProfile(updated);
    fortniteAudio.playUiClick();
    const name = WEAPON_REGISTRY[weaponId]?.name || 'Weapon';
    setClaimedRewardMessage(`EQUIPPED ${name.toUpperCase()} TO ${String(slotKey).toUpperCase()}!`);
    setTimeout(() => setClaimedRewardMessage(null), 2500);
  };

  const availableGuns = Object.values(WEAPON_REGISTRY).filter(
    (w) => unlockedWeapons.includes(w.id) || w.id === 'ar_scar' || w.id === 'ar_common'
  );

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
        <div>
          <h3 className="font-display font-black text-lg text-emerald-300 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            <span>MATCH STARTING LOADOUT CONFIGURATION</span>
          </h3>
          <p className="text-xs text-slate-300">
            Choose which weapons spawn directly in your hotbar when dropping into the Arena!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(['slot1', 'slot2', 'slot3'] as const).map((slotKey, idx) => {
          const currentEquippedId = profile.loadout[slotKey];
          const equippedWeapon = WEAPON_REGISTRY[currentEquippedId];

          return (
            <div
              key={slotKey}
              className="p-5 rounded-3xl bg-black/50 border border-white/10 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className="font-display font-black text-xs text-emerald-400 tracking-wider uppercase">
                    SLOT {idx + 1} ({slotKey.toUpperCase()})
                  </span>
                  {equippedWeapon && (
                    <span className="text-xl">{equippedWeapon.icon}</span>
                  )}
                </div>

                <div className="py-4 text-center">
                  <h4 className="font-display font-black text-lg text-white">
                    {equippedWeapon?.name || 'Empty Slot'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {equippedWeapon ? `${equippedWeapon.rarity.toUpperCase()} • ${equippedWeapon.damage} DMG` : 'No weapon assigned'}
                  </p>
                </div>
              </div>

              {/* Selector dropdown/list */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {availableGuns.map((gun) => {
                  const isSelected = currentEquippedId === gun.id;
                  return (
                    <button
                      key={gun.id}
                      onClick={() => handleEquipSlot(gun.id, slotKey)}
                      className={`w-full p-2 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 shadow-md'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300'
                      }`}
                    >
                      <span className="truncate">{gun.icon} {gun.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
