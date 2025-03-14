import { world, EquipmentSlot, GameMode, EntityComponentTypes, } from "@minecraft/server";
export class TwoTallCrops {
    constructor() {
        this.beforeOnPlayerPlace = this.beforeOnPlayerPlace.bind(this);
        this.onPlayerDestroy = this.onPlayerDestroy.bind(this);
        //this.onPlayerInteract = this.onPlayerInteract.bind(this);
    }
    beforeOnPlayerPlace({ block, player, permutationToPlace, cancel }) {
        if (!player)
            return;
        cancel = placeBlock(block, player, permutationToPlace);
    }
    onPlayerDestroy({ block, destroyedBlockPermutation, }) {
        breakBlock(block, destroyedBlockPermutation);
    }
    onPlayerInteract({ block, player, }) {
        if (!player)
            return;
        const test = TwoTallCrops.MAX_GROWTH;
        let growth = block.permutation.getState("dm95:growth");
        //Check for bone_meal in hand
        if (growth < TwoTallCrops.MAX_GROWTH) {
            const equippable = player.getComponent(EntityComponentTypes.Equippable);
            if (!equippable)
                return;
            const mainhand = equippable.getEquipmentSlot(EquipmentSlot.Mainhand);
            if (mainhand.hasItem() && mainhand.typeId == "minecraft:bone_meal")
                growCrop(block, growth, player, mainhand);
            //Fruit is ripe, so harvest
        }
        else {
            const loc = block.center();
            const fruit = block.typeId.split(":")[1];
            block.dimension.runCommandAsync(`loot spawn ${loc.x} ${loc.y} ${loc.z} loot "dm95/block/${fruit}_mature"`);
            block.setPermutation(block.permutation.withState("dm95:growth", growth - 3));
            const isTopHalf = block.permutation.getState("dm95:top");
            const blockToChange = isTopHalf ? block.below() : block.above();
            blockToChange === null || blockToChange === void 0 ? void 0 : blockToChange.setPermutation(blockToChange === null || blockToChange === void 0 ? void 0 : blockToChange.permutation.withState("dm95:growth", growth - 3));
        }
    }
}
TwoTallCrops.COMPONENT_ID = "dm95:two_tall_crop";
TwoTallCrops.MAX_GROWTH = 7;
function growCrop(block, growth, player, mainhand) {
    var _a;
    // Grow crop fully in creative, otherwise give random amount
    growth =
        player.getGameMode() === GameMode.creative
            ? 7
            : (growth += randomInt(1, TwoTallCrops.MAX_GROWTH - growth));
    block.setPermutation(block.permutation.withState("dm95:growth", growth));
    const isTopHalf = block.permutation.getState("dm95:top");
    if (isTopHalf) {
        const belowBlock = block.below();
        belowBlock === null || belowBlock === void 0 ? void 0 : belowBlock.setPermutation(belowBlock === null || belowBlock === void 0 ? void 0 : belowBlock.permutation.withState("dm95:growth", growth));
    }
    else {
        const aboveBlock = block.above();
        if (!(aboveBlock === null || aboveBlock === void 0 ? void 0 : aboveBlock.matches(block.typeId))) {
            block.setType("minecraft:air");
            return true;
        }
        aboveBlock === null || aboveBlock === void 0 ? void 0 : aboveBlock.setPermutation(aboveBlock === null || aboveBlock === void 0 ? void 0 : aboveBlock.permutation.withState("dm95:growth", growth));
    }
    const loc = (_a = block.above()) === null || _a === void 0 ? void 0 : _a.location;
    // Decrement stack
    if (mainhand.amount > 1)
        mainhand.amount--;
    else
        mainhand.setItem(undefined);
    // Play effects
    const dim = block.dimension;
    const effectLocation = block.center();
    dim.playSound("item.bone_meal.use", effectLocation);
    dim.spawnParticle("minecraft:crop_growth_emitter", effectLocation);
    if (isTopHalf)
        effectLocation.y = effectLocation.y - 1;
    else
        effectLocation.y = effectLocation.y + 1;
    dim.spawnParticle("minecraft:crop_growth_emitter", effectLocation);
    return false;
}
function placeBlock(block, player, permutationToPlace) {
    const upBlock = block.above();
    if (!(upBlock === null || upBlock === void 0 ? void 0 : upBlock.isAir)) {
        player === null || player === void 0 ? void 0 : player.onScreenDisplay.setActionBar({
            translate: "warning.dm95:actionbar.insufficient_space.crops",
        });
        return true;
    }
    const loc = block.location;
    if (loc.y + 1 >= 320) {
        player === null || player === void 0 ? void 0 : player.onScreenDisplay.setActionBar({
            translate: "warning.dm95:actionbar.build_limit.crops",
        });
        return true;
    }
    upBlock === null || upBlock === void 0 ? void 0 : upBlock.setPermutation(permutationToPlace);
    upBlock === null || upBlock === void 0 ? void 0 : upBlock.setPermutation(upBlock === null || upBlock === void 0 ? void 0 : upBlock.permutation.withState("dm95:top", true));
    return false;
}
function breakBlock(block, destroyedBlockPermutation) {
    //Determine which block to remove
    let blockToDestroy = !destroyedBlockPermutation.getState("dm95:top")
        ? block.above()
        : block.below();
    const loc = blockToDestroy === null || blockToDestroy === void 0 ? void 0 : blockToDestroy.location;
    //using /setblock command instead of .setType to cause relevant loot tables, particles etc. to trigger
    block.dimension.runCommand(`/setblock ${loc === null || loc === void 0 ? void 0 : loc.x} ${loc === null || loc === void 0 ? void 0 : loc.y} ${loc === null || loc === void 0 ? void 0 : loc.z} air destroy`);
}
world.afterEvents.pistonActivate.subscribe(({ piston }) => {
    // WIP/DEBUG code
    /*const loc1 = piston.block.location;
    world.sendMessage(`Piston: ${loc1.x}, ${loc1.y}, ${loc1.z}`);
    piston.getAttachedBlocksLocations().forEach((loc) => {
      world.sendMessage(`${loc.x}, ${loc.y}, ${loc.z}`);
    });
    piston.getAttachedBlocks().forEach((crop) => {
      const test = crop.getTags();
        world.sendMessage(" ");
        const loc = crop.location;
        world.sendMessage(`${crop.typeId}: ${loc.x}, ${loc.y}, ${loc.z}`);
        breakBlock(crop, crop.permutation);
    });*/
});
world.afterEvents.blockExplode.subscribe(({ block }) => {
    if (block.permutation.hasTag("dm95.two_tall_crop"))
        breakBlock(block, block.permutation);
});
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
//# sourceMappingURL=TwoTallCrops.js.map