import { world, system } from "@minecraft/server";
const dirtList = ["minecraft:dirt", "minecraft:grass_block"];
system.afterEvents.scriptEventReceive.subscribe(e => {
    var _a;
    const entity = e.sourceEntity;
    if (e.id == "podcrash:mole_unbury") {
        try {
            if (((entity === null || entity === void 0 ? void 0 : entity.typeId) == "podcrash:mole")) {
                //10% chance
                if (Math.random() < 0.1) {
                    const loc = entity.location;
                    const dugBlock = (_a = entity.dimension.getBlock(loc)) === null || _a === void 0 ? void 0 : _a.below();
                    if (!dugBlock)
                        return;
                    if (dirtList.includes(dugBlock.typeId)) {
                        //don't change block if mob griefing is disabled
                        if (world.gameRules.mobGriefing) {
                            dugBlock.setType("minecraft:coarse_dirt");
                            world.playSound("fall.dirt_with_roots", loc);
                        }
                        entity.dimension.runCommandAsync(`/loot spawn ${loc.x} ${loc.y} ${loc.z} loot "podcrash/block/mole_seeds"`);
                    }
                }
            }
        }
        catch (err) { }
    }
});
//# sourceMappingURL=Mole.js.map