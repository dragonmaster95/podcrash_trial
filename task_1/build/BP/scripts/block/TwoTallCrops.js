import { world, BlockPermutation, EquipmentSlot, GameMode, EntityComponentTypes, BlockPistonState, } from "@minecraft/server";
const BLOCK_TAG = "dm95.two_tall_crop";
const MAX_GROWTH = 7;
export class TwoTallCrops {
    constructor() {
        this.onPlace = this.onPlace.bind(this);
        this.onPlayerDestroy = this.onPlayerDestroy.bind(this);
        this.onPlayerInteract = this.onPlayerInteract.bind(this);
    }
    onPlace({ block, previousBlock }) {
        //don't trigger for top half
        if (previousBlock.type.id !== "minecraft:air")
            return;
        if (block.permutation.getState("dm95:top"))
            return;
        placeBlock(block);
    }
    onPlayerDestroy({ block, destroyedBlockPermutation, }) {
        breakOtherHalf(block, destroyedBlockPermutation);
    }
    onPlayerInteract({ block, player }) {
        if (!player)
            return;
        if (!block.permutation.hasTag(BLOCK_TAG))
            return;
        let growth = block.permutation.getState("dm95:growth");
        //Check for bone_meal in hand
        if (growth < MAX_GROWTH) {
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
function growCrop(block, growth, player, mainhand) {
    // Grow crop fully in creative, otherwise give random amount
    growth = player.getGameMode() === GameMode.creative ? 7 : (growth += randomInt(1, MAX_GROWTH - growth));
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
        destroyBlock(block);
        return;
    }
}
function placeBlock(block) {
    if (!block.hasTag(BLOCK_TAG))
        return;
    //getting closest player for warning messages cause onPlace has no player component like beforeOnPlayerPlace had
    const player = block.dimension.getPlayers({ location: block.location, closest: 1 })[0];
    const upBlock = block.above();
    if (!upBlock.isAir) {
        player.onScreenDisplay.setActionBar({ translate: "warning.dm95:actionbar.insufficient_space.crops", });
        destroyBlock(block);
        return;
    }
    const loc = block.location;
    if (loc.y + 1 >= 320) {
        player.onScreenDisplay.setActionBar({ translate: "warning.dm95:actionbar.build_limit.crops" });
        destroyBlock(block);
        return;
    }
    upBlock.setPermutation(BlockPermutation.resolve(block.typeId).withState("dm95:top", true));
}
function breakOtherHalf(block, perm) {
    //Determine which block to remove
    let blockToDestroy = perm.getState("dm95:top")
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
    let blocksToDestroy = [];
    //set offset based on piston facing and pushing state
    const state = piston.state;
    let offset = { x: 0, y: 0, z: 0 };
    const dir = piston.block.permutation.getState("facing_direction");
    if (dir == 0)
        offset.y = -1;
    if (dir == 1)
        offset.y = 1;
    if (dir == 2)
        offset.z = 1;
    if (dir == 3)
        offset.z = -1;
    if (dir == 4)
        offset.x = 1;
    if (dir == 5)
        offset.x = -1;
    if (state === BlockPistonState.Retracting)
        offset = invertVector(offset);
    const dim = piston.block.dimension;
    piston.getAttachedBlocks().forEach((blockOrigin) => {
        //resulting list is weird (gives location of the blocks before the were pushed), hence offset
        const loc = addVectors(blockOrigin.location, offset);
        const blockPushed = dim.getBlock(loc);
        //check for part of crop above and below old positions
        const upBlock = blockOrigin.above();
        if (upBlock.hasTag(BLOCK_TAG) && upBlock.permutation.getState("dm95:top") == true) {
            blocksToDestroy.push(upBlock);
            blocksToDestroy.push(blockPushed);
        }
        const downBlock = blockOrigin.below();
        if (downBlock.hasTag(BLOCK_TAG) && downBlock.permutation.getState("dm95:top") == false) {
            blocksToDestroy.push(downBlock);
            blocksToDestroy.push(blockPushed);
        }
        // sometimes doesn't remove all of them (not fully consistent)
        // tried it with sytem.runTimeout too, but it didn't really feel any more consistent with that either 
        // (especially if the piston fired on a redstone clock)
        breakBlocks(blocksToDestroy);
    });
});
function breakBlocks(blocks) {
    for (const block of blocks) {
        destroyBlock(block);
    }
}
world.afterEvents.blockExplode.subscribe(({ block }) => {
    if (block.permutation.hasTag(BLOCK_TAG))
        breakOtherHalf(block, block.permutation);
});
function invertVector(vec) {
    return { x: -vec.x, y: -vec.y, z: -vec.z };
}
function addVectors(vec1, vec2) {
    return { x: vec1.x + vec2.x, y: vec1.y + vec2.y, z: vec1.z + vec2.z };
}
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
//# sourceMappingURL=TwoTallCrops.js.map