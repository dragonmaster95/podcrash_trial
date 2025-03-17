export class CropGrowth {
    constructor() {
        this.onRandomTick = this.onRandomTick.bind(this);
    }
    onRandomTick({ block }) {
        randomTick(block);
    }
}
CropGrowth.MAX_GROWTH = 7;
CropGrowth.COMPONENT_ID = "dm95:crop_growth";
;
function randomTick(block) {
    const growthChance = 0.35;
    if (Math.random() > growthChance)
        return;
    const upBlock = block.above();
    //Fallback check in case there is a roundabout way to have the pieces separate so it doesn't cause errors.
    if (!upBlock.matches(block.typeId)) {
        //using /setblock command instead of .setType to cause relevant loot tables, particles etc. to trigger
        const loc = block.location;
        block.dimension.runCommand(`/setblock ${loc === null || loc === void 0 ? void 0 : loc.x} ${loc === null || loc === void 0 ? void 0 : loc.y} ${loc === null || loc === void 0 ? void 0 : loc.z} air destroy`);
    }
    const growth = block.permutation.getState("dm95:growth");
    if (growth >= CropGrowth.MAX_GROWTH)
        return;
    block.setPermutation(block.permutation.withState("dm95:growth", Math.min(growth + 1, 7)));
    upBlock.setPermutation(upBlock.permutation.withState("dm95:growth", Math.min(growth + 1, 7)));
}
//# sourceMappingURL=RandomCropGrowth.js.map