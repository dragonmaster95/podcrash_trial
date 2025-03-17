import { world, Player, Vector3, Vector2, InputPermissionCategory, system, CameraEaseOptions, EasingType, PlayerSpawnAfterEvent, TicksPerSecond } from "@minecraft/server";

class CutsceneKeyframe {
  public position: Vector3;
  public angle: Vector2;
  public easing: CameraEaseOptions;

  constructor(position: Vector3, angle: Vector2, easing: CameraEaseOptions) {
    this.position = position;
    this.angle = angle;
    this.easing = easing;
  }
}

class Cutscene {
    private keyframes: CutsceneKeyframe[];
    private players!: Player[];
    private keyframeTimer = -1;
    private progress = -1;
    private isRunning = false;

    constructor(points: CutsceneKeyframe[]) {
        this.keyframes = points;
    }

    public play() {
        //don't make the cutscene play several instances
        if (this.isRunning) return;
        else this.isRunning = true;

        // Play cutscene for all currently active players (ignores players spawning during the cutscene)
        this.players = world.getPlayers();
        if (this.players.length == 0) return;

        //Store last keyframe position as player location in case they leave during the cutscene so they end up in the right location.
        for (const player of this.players) {
          player.setDynamicProperty("cutscenePos", this.keyframes[this.keyframes.length-1].position);
        }
        this.movetoNextFrame();
    }

    public movetoNextFrame() {
      this.progress += 1;
      world.sendMessage(`Frame: ${this.progress}/${this.keyframes.length}`)
      if (this.keyframes.length <= this.progress) {
        this.end();
      } else {
        const currentFrame = this.keyframes[this.progress];
        const pos = currentFrame.position
        world.sendMessage(`${pos.x} ${pos.y} ${pos.z}`);
        for (const player of this.players) {
			    player.teleport(this.keyframes[0].position);
          // Disable player movement
          setPlayerMovement(player, false);
          player.camera.setCamera("minecraft:free",{"location":currentFrame.position,"rotation":currentFrame.angle,"easeOptions":currentFrame.easing})
        }
        this.keyframeTimer = system.runTimeout(() => this.movetoNextFrame(), currentFrame.easing.easeTime as number *TicksPerSecond);
      }
    }

    public end() {
      world.sendMessage("cutscene end");
      //clear timer in case this is getting called before the cutscene ended
      system.clearRun(this.keyframeTimer);
      this.keyframeTimer = -1;

      if (this.players == undefined) return;
      const lastKeyframe = this.keyframes[this.keyframes.length-1];
      for (const player of this.players) {
        player.teleport(lastKeyframe.position, {rotation: lastKeyframe.angle})
        player.setDynamicProperty("cutscenePos");
        setPlayerMovement(player,true);
        player.camera.clear();
      }
    }
}

function setPlayerMovement(player: Player, bool: boolean): void {
  player.inputPermissions.setPermissionCategory(InputPermissionCategory.Camera, bool)
  player.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, bool)
} 

//Put player at end of cutscene if they left during the cutscene 
//and teleport them based on their cutscenePos property
world.afterEvents.playerSpawn.subscribe((e: PlayerSpawnAfterEvent) => {
	const player = e.player;
	try {
    const test = player.getDynamicProperty("cutscenePos");
    if (test == undefined) return;
    else {
			player.teleport(test as Vector3, {keepVelocity: false});
      player.setDynamicProperty("cutscenPos");
		}
	} catch (err) {}
});

system.afterEvents.scriptEventReceive.subscribe(e => {
  const entity = e.sourceEntity;
  if (entity?.typeId != "minecraft:player") return;
  if (e.id == "podcrash:start_cutscene") {
    try {

      //setup cutscene keyframes:
      const keyframes = [
        new CutsceneKeyframe({x: 0.5, y:80, z: 0.5}, {x: 0,y: 0}, {easeTime:0, easeType: EasingType.Linear}),
        new CutsceneKeyframe({x:10.5, y:90, z:10.5}, {x:30,y: 0}, {easeTime:3, easeType: EasingType.Linear}),
        new CutsceneKeyframe({x:20.5, y:70, z: 0.5}, {x: 0,y:20}, {easeTime:1, easeType: EasingType.Linear})
      ];

      //create and play cutscene
      const cutscene = new Cutscene(keyframes);
      cutscene.play()

    }
  catch (err) {}
}
});