import {
	getDesktopGameConfig,
	getMobileGameConfig,
} from "../configs/game.config";
import { GameSceneTag } from "../enums/game-scene-tag.enum";
import { PlayerTag } from "../enums/player-tag.enum";
import { SoundTag } from "../enums/sound.enum";
import { SpriteName } from "../enums/sprite-name.enum";
import { DebugHelper } from "../helpers/debug.helper";
import { DragonComp, ObsticleComp } from "../types/ennemy.type";
import { GameConfig } from "../types/game-config.type";
import { PlayerComp } from "../types/player.type";

export class Player {
	public ref: PlayerComp;
	public jumps = 2;

	private _config: GameConfig = DebugHelper.isMobile
		? getMobileGameConfig()
		: getDesktopGameConfig();

	constructor() {}

	public init(): void {
		this.ref = add([
			sprite(SpriteName.PLAYER),
			pos(80, height() - this._config.platformHeight - 48),
			area(),
			body(),
			anchor("botleft"),
			PlayerTag.PLAYER,
			z(99),
		]);

		this.ref.play("idle");

		onKeyPress(["space"], () => this.jump());

		onMousePress((button) => {
			// for some reason, mouse press is triggered on mobile touch
			if (DebugHelper.isMobile) {
				return;
			}

			switch (button) {
				case "left":
					this.jump();
					break;
				case "right":
					this.fire();
					break;
			}
		});

		onKeyPress(["enter"], () => this.fire());

		onTouchStart((pos) => {
			if (pos.x < width() / 2) {
				this.jump();
			} else {
				this.fire();
			}
		});

		this.ref.onCollide(GameSceneTag.GROUND, () => {
			this.jumps = 2;
			this.ref.play("idle");
		});
	}

	private jump(): void {
		if (this.ref.isGrounded() || this.jumps > 0) {
			this.ref.play("jump");
			this.ref.jump(700);

			if (this.jumps === 2) {
				play(SoundTag.JUMP, {
					volume: 0.7,
				});
			} else {
				play(SoundTag.DOUBLE_JUMP, {
					volume: 0.7,
				});
			}

			this.jumps--;
		}
	}

	private fire(): void {
		play(SoundTag.FIRE, {
			volume: 0.7,
		});

		const bullet = add([
			sprite(SpriteName.BULLET),
			pos(this.ref.pos.x, this.ref.pos.y - this.ref.height / 2),
			area(),
			move(RIGHT, 1000),
			PlayerTag.BULLET,
		]);

		bullet.play("move");

		bullet.onCollide(GameSceneTag.OBSTICLE, (obsticle: ObsticleComp) => {
			play(SoundTag.IMPACT_INVINCIBLE, {
				volume: 0.8,
			});

			const impact = add([
				sprite(SpriteName.INVINCIBLE_IMPACT),
				pos(bullet.pos.x, bullet.pos.y - bullet.height),
				area(),
				move(LEFT, obsticle.speed),
			]);

			impact.onAnimEnd(() => impact.destroy());

			impact.play("impact");
			destroy(bullet);
		});

		bullet.onCollide(GameSceneTag.DRAGON, (dragon: DragonComp) => {
			play(SoundTag.IMPACT, {
				volume: 0.7,
			});

			dragon.hurt(30);

			const dragonIsDead = dragon.hp() <= 0;

			const impact = add([
				sprite(SpriteName.BULLET_IMPACT),
				pos(bullet.pos.x, bullet.pos.y - bullet.height),
				area(),
				move(LEFT, dragon.speed),
			]);

			if (dragonIsDead) {
				dragon.destroy();
			}

			impact.play("impact");
			impact.onAnimEnd(() => impact.destroy());
			destroy(bullet);
		});
	}
}
