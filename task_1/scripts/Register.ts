import { WorldInitializeBeforeEvent, world } from "@minecraft/server";
import { TwoTallCropBlock } from "./block/TwoTallCrops"

export class Register {
	constructor() {
		Register.blockEvents();
	}

	static blockEvents() {
		world.beforeEvents.worldInitialize.subscribe((e: WorldInitializeBeforeEvent) => {
			e.blockComponentRegistry.registerCustomComponent(TwoTallCropBlock.COMPONENT_ID, new TwoTallCropBlock());
		});
	}
}

new Register();
