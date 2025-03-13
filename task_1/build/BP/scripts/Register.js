import { world } from "@minecraft/server";
import { TwoTallCropBlock } from "./block/TwoTallCrops";
export class Register {
    constructor() {
        Register.blockEvents();
    }
    static blockEvents() {
        world.beforeEvents.worldInitialize.subscribe((e) => {
            e.blockComponentRegistry.registerCustomComponent(TwoTallCropBlock.COMPONENT_ID, new TwoTallCropBlock());
        });
    }
}
new Register();
//# sourceMappingURL=Register.js.map