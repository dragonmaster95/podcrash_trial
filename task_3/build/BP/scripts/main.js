import { world, InputPermissionCategory, system, EasingType } from "@minecraft/server";
class CutsceneKeyframe {
    constructor(position, angle, easing) {
        this.position = position;
        this.angle = angle;
        this.easing = easing;
    }
}
class Cutscene {
    constructor(points) {
        this.duration = 0;
        this.cutsceneTimer = -1;
        this.keyframeTimer = -1;
        this.progress = -1;
        this.isRunning = false;
        this.keyframes = points;
    }
    play() {
        world.beforeEvents.playerLeave.subscribe(this.onPlayerLeave.bind(this));
        //don't make the cutscene play several instances
        if (this.isRunning)
            return;
        else
            this.isRunning = true;
        // Play cutscene for all currently active players (ignores players spawning during the cutscene)
        this.players = world.getPlayers();
        if (this.players.length == 0)
            return;
        //Store last keyframe position as player location in case they leave during the cutscene so they end up in the right location.
        for (const player of this.players) {
            player.setDynamicProperty("cutscenePos", this.keyframes[this.keyframes.length - 1].position);
        }
        this.movetoNextFrame();
    }
    movetoNextFrame() {
        this.progress += 1;
        world.sendMessage(`Frame: ${this.progress}`);
        if (this.keyframes.length < this.progress)
            this.end();
        const currentFrame = this.keyframes[this.progress];
        for (const player of this.players) {
            // Disable player movement
            setPlayerMovement(player, false);
            player.camera.setCamera("minecraft:free", { "location": currentFrame.position, "rotation": currentFrame.angle, "easeOptions": currentFrame.easing });
        }
        this.keyframeTimer = system.runTimeout(() => this.movetoNextFrame(), currentFrame.easing.easeTime);
    }
    end() {
        //clear timer in case this is getting called before the cutscene ended
        system.clearRun(this.keyframeTimer);
        this.keyframeTimer = -1;
        if (this.players == undefined)
            return;
        const lastKeyframe = this.keyframes[this.keyframes.length];
        for (const player of this.players) {
            player.teleport(lastKeyframe.position, { rotation: lastKeyframe.angle });
            player.setDynamicProperty("cutscenePos");
            setPlayerMovement(player, true);
        }
    }
    wait(milliseconds, callback) {
        // Simple wait function using setTimeout
        setTimeout(callback, milliseconds);
    }
    onPlayerLeave(e) {
        const player = e.player;
    }
}
function setPlayerMovement(player, bool) {
    player.inputPermissions.setPermissionCategory(InputPermissionCategory.Camera, bool);
    player.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, bool);
}
world.afterEvents.playerSpawn.subscribe((e) => {
    const player = e.player;
    try {
        const test = player.getDynamicProperty("cutscenePos");
        if (test == undefined)
            return;
        else {
            player.teleport(test, { keepVelocity: false });
            player.setDynamicProperty("cutscenPos");
        }
    }
    catch (err) { }
});
system.afterEvents.scriptEventReceive.subscribe(e => {
    const entity = e.sourceEntity;
    if ((entity === null || entity === void 0 ? void 0 : entity.typeId) != "minecraft:player")
        return;
    if (e.id == "podcrash:start_cutscene") {
        try {
            //setup cutscene keyframes:
            const keyframes = [
                new CutsceneKeyframe({ x: 0, y: 50, z: 0 }, { x: 0, y: 0 }, { easeTime: 0, easeType: EasingType.Linear }),
                new CutsceneKeyframe({ x: 10, y: 50, z: 10 }, { x: 30, y: 0 }, { easeTime: 1, easeType: EasingType.Linear }),
                new CutsceneKeyframe({ x: 20, y: 50, z: 0 }, { x: 0, y: 20 }, { easeTime: 3, easeType: EasingType.Linear })
            ];
            //create and play cutscene
            const cutscene = new Cutscene(keyframes);
            cutscene.play();
        }
        catch (err) { }
    }
});
//# sourceMappingURL=main.js.map