import { ItemStack, system, world, ItemComponentTypes, EnchantmentType, } from "@minecraft/server";
function distance3D(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const dz = point2.z - point1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
export class BobberPlayer {
    constructor(tick, player) {
        this.bobber = null;
        this.pulled = false;
        this.pullLocation = { x: 0, y: 0, z: 0 };
        this.tick = tick;
        this.player = player;
    }
    addBobber(bobber) {
        this.bobber = bobber;
    }
    markAsPulled() {
        if (!this.bobber)
            return;
        this.pulled = true;
        this.pullLocation = this.bobber.location;
    }
}
let activeBobbers = [];
const customFishChance = 10; //out of 100
function beforeCasting(data) {
    let player = data.source;
    if (!player.typeId.endsWith("player"))
        return;
    if (!data.itemStack.typeId.endsWith("fishing_rod"))
        return;
    activeBobbers.push(new BobberPlayer(system.currentTick, player));
}
function afterCasting(data) {
    const bobber = data.entity;
    if (!bobber.typeId.endsWith("hook"))
        return;
    const sameTick = activeBobbers.filter((player) => player.tick === system.currentTick);
    let closestPlayer = sameTick[0];
    if (sameTick.length > 1) {
        let minDistance = distance3D(sameTick[0].player.location, bobber.location);
        for (let i; (i = 1); i < sameTick.length) {
            const distance = distance3D(sameTick[i].player.location, bobber.location);
            if (distance < minDistance)
                minDistance = distance;
            closestPlayer = sameTick[i];
        }
    }
    closestPlayer.addBobber(bobber);
}
function beforeReeling(data) {
    const bobber = data.removedEntity;
    if (!bobber.typeId.endsWith("hook"))
        return;
    const bobberEntry = activeBobbers.find((active) => active.bobber == bobber);
    if (!bobberEntry) {
        world.sendMessage("Debug: No matching bobber found in list");
        return;
    }
    bobberEntry === null || bobberEntry === void 0 ? void 0 : bobberEntry.markAsPulled();
}
function afterReeling(data) {
    var _a;
    const bobber = data.typeId;
    if (!bobber.endsWith("hook"))
        return;
    //get bobbers that are set to be pulled
    const pulledBobbers = activeBobbers.filter((bobber) => bobber.pulled);
    //detect closest item entity
    for (const bobber of pulledBobbers) {
        const dimension = (_a = bobber.player) === null || _a === void 0 ? void 0 : _a.dimension;
        const pulledEntities = dimension.getEntities({
            location: bobber.pullLocation,
            closest: 1,
            type: "minecraft:item",
            maxDistance: 5
            // Note: the items spawn in/are surprisingly far away from the bobber location (more than 2 blocks). 
            // no matter the distance though it's easy to fake getting the custom fish by dropping a salmon and fishing near it.
        });
        if (pulledEntities.length == 0)
            return;
        const pulledEntity = pulledEntities[0];
        //get item component
        const itemEntity = pulledEntity.getComponent("minecraft:item");
        const stack = itemEntity.itemStack;
        const itemType = stack.typeId;
        //if fish and 10% chance
        if (itemType.endsWith(":salmon") || itemType.endsWith(":cod")) {
            world.sendMessage("Debug: Salmon/Cod caught");
            const chance = Math.random();
            if (chance <= customFishChance / 100.0) {
                world.sendMessage(`Spawning "custom fish" item`);
                //create new item
                let newItem = new ItemStack("minecraft:diamond_pickaxe", 1);
                //Set enchantments
                let enchantment = newItem.getComponent(ItemComponentTypes.Enchantable);
                if (enchantment) {
                    enchantment.addEnchantments([
                        { type: new EnchantmentType("efficiency"), level: 3 },
                        { type: new EnchantmentType("unbreaking"), level: 1 },
                        { type: new EnchantmentType("mending"), level: 1 },
                    ]);
                }
                //Set durability
                let durability = newItem.getComponent(ItemComponentTypes.Durability);
                if (durability) {
                    durability.damage = durability.maxDurability / 2;
                }
                const newItemEntity = dimension.spawnItem(newItem, pulledEntity.location);
                //appply same velocity
                newItemEntity.applyImpulse(itemEntity.entity.getVelocity());
                //giving the player another set of experience
                //(trying to find the existing orbs and hoping they aren't already despawned and spawning additional orbs and giving them the same value would seem overkill)
                bobber.player.addExperience(randomInt(1, 6));
                pulledEntity.remove();
            }
            else {
                world.sendMessage(`Debug: Too bad, no custom fish (10% are surprisingly low odds)`);
            }
        }
        //remove bobberPlayer object from list
        activeBobbers.splice(activeBobbers.indexOf(bobber));
    }
}
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
world.beforeEvents.entityRemove.subscribe(beforeReeling);
world.afterEvents.entityRemove.subscribe(afterReeling);
world.beforeEvents.itemUse.subscribe(beforeCasting);
world.afterEvents.entitySpawn.subscribe(afterCasting);
//# sourceMappingURL=CustomFishing.js.map