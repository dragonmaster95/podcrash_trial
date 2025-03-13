import { world } from "@minecraft/server";
import { TwoTallCrops } from "./block/TwoTallCrops";
import { CropGrowth } from "./block/RandomCropGrowth";
export class Register {
    constructor() {
        Register.blockEvents();
    }
    static blockEvents() {
        world.beforeEvents.worldInitialize.subscribe((e) => {
            e.blockComponentRegistry.registerCustomComponent(TwoTallCrops.COMPONENT_ID, new TwoTallCrops());
            e.blockComponentRegistry.registerCustomComponent(CropGrowth.COMPONENT_ID, new CropGrowth());
        });
    }
}
new Register();
//# sourceMappingURL=Register.js.map