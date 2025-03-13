import {
  world,
  BlockCustomComponent,
  BlockPermutation,
  EquipmentSlot,
  GameMode,
  BlockComponentPlayerPlaceBeforeEvent,
  BlockComponentPlayerDestroyEvent,
  PlayerInteractWithBlockAfterEvent,
  BlockComponentPlayerInteractEvent,
  EntityComponentTypes,
  EntityEquippableComponent,
  Player,
  ContainerSlot,
  Block,
} from "@minecraft/server";

export class TwoTallCrops implements BlockCustomComponent {
  public static COMPONENT_ID = "dm95:two_tall_crop";
  public static MAX_GROWTH = 7;

  constructor() {
    this.beforeOnPlayerPlace = this.beforeOnPlayerPlace.bind(this);
    this.onPlayerDestroy = this.onPlayerDestroy.bind(this);
    //this.onPlayerInteract = this.onPlayerInteract.bind(this);
  }

  public beforeOnPlayerPlace({block,player,permutationToPlace,cancel}: BlockComponentPlayerPlaceBeforeEvent): void {
    if (!player) return;
    cancel = placeBlock(block, player, permutationToPlace);
  }

  public onPlayerDestroy({block,destroyedBlockPermutation,}: BlockComponentPlayerDestroyEvent): void {
    breakBlock(block, destroyedBlockPermutation);
  }

  public onPlayerInteract({block,player,}: BlockComponentPlayerInteractEvent): void {
    if (!player) return;

    const test = TwoTallCrops.MAX_GROWTH;

    let growth = block.permutation.getState("dm95:growth") as number;

    //Check for bone_meal
    if (growth < TwoTallCrops.MAX_GROWTH) {
      const equippable = player.getComponent(
        EntityComponentTypes.Equippable
      ) as EntityEquippableComponent;
      if (!equippable) return;

      const mainhand = equippable.getEquipmentSlot(EquipmentSlot.Mainhand);
      if (mainhand.hasItem() && mainhand.typeId == "minecraft:bone_meal")
        growCrop(block, growth, player, mainhand);

      //Check if fruit is ripe
    } else {
      const loc = block.center();

      block.dimension.runCommandAsync(
        `loot spawn ${loc.x} ${loc.y} ${loc.z} loot "dm95/block/tomato_mature"`
      );

      block.setPermutation(
        block.permutation.withState("dm95:growth", growth - 3)
      );

      const isTopHalf = block.permutation.getState("dm95:top");
      const blockToChange = isTopHalf ? block.below() : block.above();
      blockToChange?.setPermutation(
        blockToChange?.permutation.withState("dm95:growth", growth - 3)
      );
    }
  }
}

function growCrop(block: Block, growth: number, player: Player, mainhand: ContainerSlot) {
  // Grow crop fully in creative, otherwise give random amount
  growth =
    player.getGameMode() === GameMode.creative
      ? 7
      : (growth += randomInt(1, TwoTallCrops.MAX_GROWTH - growth));
  block.setPermutation(block.permutation.withState("dm95:growth", growth));

  const isTopHalf = block.permutation.getState("dm95:top");
  if (isTopHalf) {
    const belowBlock = block.below();
    belowBlock?.setPermutation(
      belowBlock?.permutation.withState("dm95:growth", growth)
    );
  } else {
    const aboveBlock = block.above();
    if (!aboveBlock?.matches(block.typeId)) {
      block.setType("minecraft:air");
      return true;
    }
    aboveBlock?.setPermutation(
      aboveBlock?.permutation.withState("dm95:growth", growth)
    );
  }
  const loc = block.above()?.location;

  // Decrement stack
  if (mainhand.amount > 1) mainhand.amount--;
  else mainhand.setItem(undefined);

  // Play effects
  const dim = block.dimension;
  const effectLocation = block.center();
  dim.playSound("item.bone_meal.use", effectLocation);
  dim.spawnParticle("minecraft:crop_growth_emitter", effectLocation);
  if (isTopHalf) effectLocation.y = effectLocation.y - 1;
  else effectLocation.y = effectLocation.y + 1;
  dim.spawnParticle("minecraft:crop_growth_emitter", effectLocation);
  return false;
}

function placeBlock(block: Block, player: Player, permutationToPlace: BlockPermutation): boolean {
  const upBlock = block.above();
  if (!upBlock?.isAir) {
    player?.onScreenDisplay.setActionBar({
      translate: "warning.dm95:actionbar.insufficient_space.crops",
    });
    return true;
  }
  const loc = block.location;

  if (loc.y + 1 >= 320) {
    player?.onScreenDisplay.setActionBar({
      translate: "warning.dm95:actionbar.build_limit.crops",
    });
    return true;
  }

  upBlock?.setPermutation(permutationToPlace);
  upBlock?.setPermutation(upBlock?.permutation.withState("dm95:top", true));
  return false;
}

function breakBlock(block: Block, destroyedBlockPermutation: BlockPermutation) {
  //Determine which block to remove
  let blockToDestroy = !destroyedBlockPermutation.getState("dm95:top")
    ? block.above()
    : block.below();
  blockToDestroy?.setPermutation(BlockPermutation.resolve("minecraft:air"));
}

world.afterEvents.pistonActivate.subscribe(({ piston, block }) => {
  /*piston.getAttachedBlocksLocations().forEach((loc) => {
    world.sendMessage(`${loc.x}, ${loc.y}, ${loc.z}`);
  });*/
  piston.getAttachedBlocks().forEach((crop) => {
    if (crop.hasTag("dm95.two_tall_crop"))
      breakBlock(crop, crop.permutation);
  });
});

world.afterEvents.blockExplode.subscribe(({ block }) => {
  if (block.hasTag("dm95.two_tall_crop"))
    breakBlock(block, block.permutation);
});

export function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
