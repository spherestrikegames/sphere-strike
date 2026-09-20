import React from 'react';
import { PlayerProfile } from '../../types';
import { SHOP_COSMETICS_CATALOG, ShopCosmeticItem } from '../FortniteShop';
import { FORTNITE_SKINS } from '../../data/fortniteData';
import { PlayerCharacterAvatar } from '../PlayerCharacterAvatar';
import { fortniteAudio } from '../../utils/audio';
import { Crown, Check, Lock } from 'lucide-react';

interface ShopSkinsTabProps {
  profile: PlayerProfile;
  onUpdateProfile: (updated: PlayerProfile) => void;
  unlockedSkins: string[];
  unlockedPickaxes: string[];
  unlockedGliders: string[];
  selectedCosmeticId: string;
  setSelectedCosmeticId: (id: string) => void;
  setClaimedRewardMessage: (msg: string | null) => void;
}

export const ShopSkinsTab: React.FC<ShopSkinsTabProps> = ({
  profile,
  onUpdateProfile,
  unlockedSkins,
  unlockedPickaxes,
  unlockedGliders,
  selectedCosmeticId,
  setSelectedCosmeticId,
  setClaimedRewardMessage,
}) => {
  const selectedCosmeticItem =
    SHOP_COSMETICS_CATALOG.find((c) => c.id === selectedCosmeticId) ||
    SHOP_COSMETICS_CATALOG[1] ||
    SHOP_COSMETICS_CATALOG[0];

  const activeCosmeticSkin =
    FORTNITE_SKINS.find(
      (s) =>
        s.id ===
        (selectedCosmeticItem?.category === 'skin'
          ? selectedCosmeticItem.id
          : profile.selectedSkin)
    ) || FORTNITE_SKINS[0];

  const handleBuyOrEquipCosmetic = (item: ShopCosmeticItem) => {
    if (item.category === 'skin') {
      const isUnlocked = unlockedSkins.includes(item.id) || item.costTokens === 0;
      if (!isUnlocked) {
        if (profile.vbucks < item.costTokens) {
          fortniteAudio.playShieldBreak?.();
          return;
        }
        const updated: PlayerProfile = {
          ...profile,
          vbucks: profile.vbucks - item.costTokens,
          unlockedSkins: [...new Set([...unlockedSkins, item.id])],
          selectedSkin: item.id,
        };
        onUpdateProfile(updated);
        fortniteAudio.playUpgradeBenchAnvil();
        setClaimedRewardMessage(`UNLOCKED & EQUIPPED ${item.name.toUpperCase()}! 👑`);
        setTimeout(() => setClaimedRewardMessage(null), 3000);
      } else {
        const updated: PlayerProfile = {
          ...profile,
          selectedSkin: item.id,
        };
        onUpdateProfile(updated);
        fortniteAudio.playUiClick();
        setClaimedRewardMessage(`EQUIPPED ${item.name.toUpperCase()}! 👑`);
        setTimeout(() => setClaimedRewardMessage(null), 2500);
      }
    } else if (item.category === 'pickaxe') {
      const isUnlocked = unlockedPickaxes.includes(item.id) || item.costTokens === 0;
      if (!isUnlocked) {
        if (profile.vbucks < item.costTokens) {
          fortniteAudio.playShieldBreak?.();
          return;
        }
        const updated: PlayerProfile = {
          ...profile,
          vbucks: profile.vbucks - item.costTokens,
          unlockedPickaxes: [...new Set([...unlockedPickaxes, item.id])],
          selectedPickaxe: item.id,
        };
        onUpdateProfile(updated);
        fortniteAudio.playUpgradeBenchAnvil();
        setClaimedRewardMessage(`UNLOCKED ${item.name.toUpperCase()}! ⛏️`);
        setTimeout(() => setClaimedRewardMessage(null), 3000);
      } else {
        const updated: PlayerProfile = {
          ...profile,
          selectedPickaxe: item.id,
        };
        onUpdateProfile(updated);
        fortniteAudio.playUiClick();
        setClaimedRewardMessage(`EQUIPPED ${item.name.toUpperCase()}! ⛏️`);
        setTimeout(() => setClaimedRewardMessage(null), 2500);
      }
    } else if (item.category === 'glider') {
      const isUnlocked = unlockedGliders.includes(item.id) || item.costTokens === 0;
      if (!isUnlocked) {
        if (profile.vbucks < item.costTokens) {
          fortniteAudio.playShieldBreak?.();
          return;
        }
        const updated: PlayerProfile = {
          ...profile,
          vbucks: profile.vbucks - item.costTokens,
          unlockedGliders: [...new Set([...unlockedGliders, item.id])],
          selectedGlider: item.id,
        };
        onUpdateProfile(updated);
        fortniteAudio.playUpgradeBenchAnvil();
        setClaimedRewardMessage(`UNLOCKED ${item.name.toUpperCase()}! 🪂`);
        setTimeout(() => setClaimedRewardMessage(null), 3000);
      } else {
        const updated: PlayerProfile = {
          ...profile,
          selectedGlider: item.id,
        };
        onUpdateProfile(updated);
        fortniteAudio.playUiClick();
        setClaimedRewardMessage(`EQUIPPED ${item.name.toUpperCase()}! 🪂`);
        setTimeout(() => setClaimedRewardMessage(null), 2500);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Cols: Cosmetics Catalog Grid */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-black text-sm text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <Crown className="w-4 h-4" />
            <span>OUTFITS & COSMETICS LOCKER STORE</span>
          </h3>
          <span className="text-xs text-slate-400">Unlock with Coins earned from eliminations</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[65vh] overflow-y-auto pr-1">
          {SHOP_COSMETICS_CATALOG.map((c) => {
            const isSelected = selectedCosmeticId === c.id;
            const isUnlocked =
              c.category === 'skin'
                ? unlockedSkins.includes(c.id) || c.costTokens === 0
                : c.category === 'pickaxe'
                ? unlockedPickaxes.includes(c.id) || c.costTokens === 0
                : unlockedGliders.includes(c.id) || c.costTokens === 0;

            const isEquipped =
              c.category === 'skin'
                ? profile.selectedSkin === c.id
                : c.category === 'pickaxe'
                ? profile.selectedPickaxe === c.id
                : profile.selectedGlider === c.id;

            const canAfford = profile.vbucks >= c.costTokens;

            return (
              <div
                key={c.id}
                onClick={() => {
                  setSelectedCosmeticId(c.id);
                  fortniteAudio.playUiClick();
                }}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-400 bg-slate-900/90 shadow-lg'
                    : 'border-white/10 bg-black/40 hover:bg-white/5'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl">{c.icon}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase text-rose-300">
                          {c.category}
                        </span>
                        {c.tag && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-500 text-white">
                            {c.tag}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-white line-clamp-1">{c.name}</h4>
                    </div>
                  </div>

                  {isEquipped && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-black text-[10px]">
                      EQUIPPED
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 mb-3 line-clamp-2">{c.description}</p>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  {isUnlocked ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBuyOrEquipCosmetic(c);
                      }}
                      className={`w-full py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        isEquipped
                          ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                      }`}
                    >
                      {isEquipped ? '✓ EQUIPPED' : 'EQUIP COSMETIC'}
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBuyOrEquipCosmetic(c);
                      }}
                      disabled={!canAfford}
                      className={`w-full py-1.5 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-1 transition-all ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md cursor-pointer'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>UNLOCK FOR 🅢 {c.costTokens}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Col: Cosmetic Character Stage Preview */}
      <div className="lg:col-span-1 bg-black/60 p-6 rounded-3xl border border-rose-500/30 flex flex-col items-center justify-between text-center min-h-[500px]">
        <div className="w-full">
          <span className="text-xs text-rose-400 font-black tracking-wider uppercase">
            3D PLAYER CHARACTER STAGE
          </span>
          <h2 className="font-display font-black text-xl text-white mt-1">
            {selectedCosmeticItem?.name || 'Character Outfit'}
          </h2>
        </div>

        <div className="my-6 relative flex items-center justify-center">
          <div className="absolute w-48 h-48 rounded-full bg-rose-500/10 blur-xl -z-10" />
          <PlayerCharacterAvatar skin={activeCosmeticSkin} size="lg" />
        </div>

        <div className="w-full space-y-3">
          <p className="text-xs text-slate-300 italic">{selectedCosmeticItem?.description}</p>

          <button
            onClick={() => handleBuyOrEquipCosmetic(selectedCosmeticItem)}
            className="w-full py-3 rounded-2xl font-display font-black text-sm uppercase bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 shadow-xl cursor-pointer"
          >
            {unlockedSkins.includes(selectedCosmeticItem.id) || selectedCosmeticItem.costTokens === 0
              ? 'EQUIP THIS OUTFIT'
              : `UNLOCK OUTFIT FOR 🅢 ${selectedCosmeticItem.costTokens}`}
          </button>
        </div>
      </div>
    </div>
  );
};
