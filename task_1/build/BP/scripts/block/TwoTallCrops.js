import { world, BlockPermutation, EquipmentSlot, GameMode, EntityComponentTypes, } from "@minecraft/server";
export class TwoTallCrops {
    constructor() {
        this.onPlace = this.onPlace.bind(this);
        this.onPlayerDestroy = this.onPlayerDestroy.bind(this);
        this.onPlayerInteract = this.onPlayerInteract.bind(this);
    }
    onPlace({ block }) {
        //don't trigger for top half
        if (block.permutation.getState("dm95:top"))
            return;
        placeBlock(block);
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
            const otherHalf = block.permutation.getState("dm95:top") ? block.below() : block.above();
            if (otherHalf === null || otherHalf === void 0 ? void 0 : otherHalf.matches(block.typeId))
                otherHalf === null || otherHalf === void 0 ? void 0 : otherHalf.setPermutation(otherHalf === null || otherHalf === void 0 ? void 0 : otherHalf.permutation.withState("dm95:growth", growth - 3));
            else
                destroyBlock(block);
        }
    }
}
TwoTallCrops.COMPONENT_ID = "dm95:two_tall_crop";
TwoTallCrops.MAX_GROWTH = 7;
function growCrop(block, growth, player, mainhand) {
    // Grow crop fully in creative, otherwise give random amount
    growth = player.getGameMode() === GameMode.creative ? 7 : (growth += randomInt(1, TwoTallCrops.MAX_GROWTH - growth));
    block.setPermutation(block.permutation.withState("dm95:growth", growth));
    const otherHalf = block.permutation.getState("dm95:top") ? block.below() : block.above();
    if (otherHalf === null || otherHalf === void 0 ? void 0 : otherHalf.matches(block.typeId)) {
        otherHalf === null || otherHalf === void 0 ? void 0 : otherHalf.setPermutation(otherHalf === null || otherHalf === void 0 ? void 0 : otherHalf.permutation.withState("dm95:growth", growth));
        // Decrement stack
        if (!GameMode.creative) {
            if (mainhand.amount > 1)
                mainhand.amount--;
            else
                mainhand.setItem(undefined);
        }
        // Play effects
        const dim = block.dimension;
        const effectLocation = block.center();
        dim.playSound("item.bone_meal.use", effectLocation);
        dim.spawnParticle("minecraft:crop_growth_emitter", effectLocation);
        dim.spawnParticle("minecraft:crop_growth_emitter", otherHalf.center());
    }
    else {
        block.setType("minecraft:air");
        return;
    }
}
function placeBlock(block) {
    //getting closest player for warning messages cause onPlace has no player component like beforeOnPlayerPlace had
    const player = block.dimension.getPlayers({ location: block.location, closest: 1 })[0];
    const upBlock = block.above();
    if (!(upBlock === null || upBlock === void 0 ? void 0 : upBlock.isAir)) {
        player.onScreenDisplay.setActionBar({ translate: "warning.dm95:actionbar.insufficient_space.crops", });
        world.sendMessage("not enough space");
        destroyBlock(block);
        return;
    }
    const loc = block.location;
    if (loc.y + 1 >= 320) {
        player.onScreenDisplay.setActionBar({ translate: "warning.dm95:actionbar.build_limit.crops" });
        destroyBlock(block);
        return;
    }
    upBlock === null || upBlock === void 0 ? void 0 : upBlock.setPermutation(BlockPermutation.resolve(block.typeId).withState("dm95:top", true));
}
function breakBlock(block, destroyedBlockPermutation) {
    //Determine which block to remove
    let blockToDestroy = destroyedBlockPermutation.getState("dm95:top")
        ? block.below()
        : block.above();
    destroyBlock(blockToDestroy);
}
function destroyBlock(block) {
    const loc = block.location;
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