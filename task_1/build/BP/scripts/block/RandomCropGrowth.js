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
    const growthChance = 1 / 3;
    if (Math.random() > growthChance)
        return;
    const upBlock = block.above();
    const growth = block.permutation.getState("dm95:growth");
    if (growth >= CropGrowth.MAX_GROWTH)
        return;
    block.setPermutation(block.permutation.withState("dm95:growth", Math.min(growth + 1, 7)));
    //Fallback check in case there is a roundabout way to have the pieces separate so it doesn't cause errors.
    if (upBlock === null || upBlock === void 0 ? void 0 : upBlock.matches(block.typeId))
        upBlock === null || upBlock === void 0 ? void 0 : upBlock.setPermutation(upBlock.permutation.withState("dm95:growth", Math.min(growth + 1, 7)));
    else
        block.setType("minecraft:air");
}
//# sourceMappingURL=RandomCropGrowth.js.map