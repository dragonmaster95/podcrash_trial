import { Block, BlockComponentRandomTickEvent, BlockCustomComponent, world } from "@minecraft/server";


export class CropGrowth implements BlockCustomComponent {
    public static MAX_GROWTH = 7;
    public static COMPONENT_ID = "dm95:crop_growth";
    constructor() {
        this.onRandomTick = this.onRandomTick.bind(this);
    }

    public onRandomTick({block}: BlockComponentRandomTickEvent): void {
        randomTick(block);
    }
  
};

function randomTick(block: Block) {
  const growthChance = 0.35;
  if (Math.random() > growthChance) return;

  const upBlock = block.above() as Block;
  
  //Fallback check in case there is a roundabout way to have the pieces separate so it doesn't cause errors.
  if (!upBlock.matches(block.typeId)) {
    //using /setblock command instead of .setType to cause relevant loot tables, particles etc. to trigger
    const loc = block.location;
    block.dimension.runCommand(`/setblock ${loc?.x} ${loc?.y} ${loc?.z} air destroy`);
  }

  const growth = block.permutation.getState("dm95:growth") as number;
  if (growth >= CropGrowth.MAX_GROWTH) return;
  block.setPermutation(block.permutation.withState("dm95:growth", Math.min(growth + 1, 7)));
  upBlock.setPermutation(upBlock.permutation.withState("dm95:growth", Math.min(growth + 1, 7))); 
}