import Phaser from 'phaser';
import firelineImg from '../assets/fireline.png';
import tileImg from '../assets/tile.png';
import turretImg from '../assets/turret.png';

import config from '../config/config';

const gameOptions = {
    pathWidth: 500,
    pathHeight: 800,
    curveRadius: 50,

    gunSpeed: 5000,
    gunFriction: 0.9,
    maxGunSpeedMultiplier: 11,
    gunThrust: 2,

    targets: 5,
    targetSize: {
        min: 100,
        max: 200,
    },
    targetSpeed: {
        min: 6000,
        max: 10000,
    },
};

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    preload() {
        this.load.image('fireline', firelineImg);
        this.load.image('tile', tileImg);
        this.load.image('turret', turretImg);
    }

    create() {
        let offset = new Phaser.Math.Vector2(
            (config.scale.width - gameOptions.pathWidth) / 2,
            (config.scale.height - gameOptions.pathHeight) / 2
        );

        // TODO: utility function for drawing these kinds of boxes?
        // lines/arcs for path
        this.path = new Phaser.Curves.Path(
            offset.x + gameOptions.curveRadius,
            offset.y
        );
        this.path.lineTo(
            offset.x + gameOptions.pathWidth - gameOptions.curveRadius,
            offset.y
        );
        this.path.ellipseTo(
            -gameOptions.curveRadius,
            -gameOptions.curveRadius,
            90,
            180,
            false,
            0
        );
        this.path.lineTo(
            offset.x + gameOptions.pathWidth,
            offset.y + gameOptions.pathHeight - gameOptions.curveRadius
        );
        this.path.ellipseTo(
            -gameOptions.curveRadius,
            -gameOptions.curveRadius,
            180,
            270,
            false,
            0
        );
        this.path.lineTo(
            offset.x + gameOptions.curveRadius,
            offset.y + gameOptions.pathHeight
        );
        this.path.ellipseTo(
            -gameOptions.curveRadius,
            -gameOptions.curveRadius,
            270,
            0,
            false,
            0
        );
        this.path.lineTo(offset.x, offset.y + gameOptions.curveRadius);
        this.path.ellipseTo(
            -gameOptions.curveRadius,
            -gameOptions.curveRadius,
            0,
            90,
            false,
            0
        );

        // draw path
        this.graphics = this.add.graphics();
        this.graphics.lineStyle(4, 0xffff00, 1);
        this.path.draw(this.graphics);

        // targets
        this.targets = this.add.group();
        for (let i = 0; i < gameOptions.targets; i++) {
            let target = this.add.follower(
                this.path,
                offset.x + gameOptions.curveRadius,
                offset.y,
                'tile'
            );
            target.alpha = 0.8;
            target.displayWidth = Phaser.Math.RND.between(
                gameOptions.targetSize.min,
                gameOptions.targetSize.max
            );
            this.targets.add(target);

            target.startFollow({
                duration: Phaser.Math.RND.between(
                    gameOptions.targetSpeed.min,
                    gameOptions.targetSpeed.max
                ),
                repeat: -1,
                rotateToPath: true,
                verticalAdjust: true,
                startAt: Phaser.Math.RND.frac(),
            });
        }

        // rotating gun
        this.gun = this.add.sprite(
            config.scale.width / 2,
            config.scale.height / 2,
            'turret'
        );
        this.gun.setScale(2);
        this.gun.setDepth(1);
        this.gunTween = this.tweens.add({
            targets: [this.gun],
            angle: 360,
            duration: gameOptions.gunSpeed,
            repeat: -1,
            callbackScope: this,
            onRepeat: function() {
                this.gunTween.timeScale = Math.max(
                    1,
                    this.gunTween.timeScale * gameOptions.gunFriction
                );
            },
        });

        // fireline (aka bullet)
        this.fireline = this.add.sprite(
            config.scale.width / 2,
            config.scale.height / 2,
            'fireline'
        );
        this.fireline.setOrigin(0, 0.5);
        this.fireline.displayWidth = 700;
        this.fireline.displayHeight = 8;
        this.fireline.visible = false;

        // user input
        this.input.on('pointerdown', pointer => {
            if (!this.fireline.visible) {
                this.fireline.visible = true;
                this.fireline.angle = this.gun.angle + 270;

                // gun angular increase
                this.gunTween.timeScale = Math.min(
                    gameOptions.maxGunSpeedMultiplier,
                    this.gunTween.timeScale * gameOptions.gunThrust
                );

                // line gone after 50 ms
                this.time.addEvent({
                    delay: 50,
                    callback: () => {
                        this.fireline.visible = false;
                    },
                });

                // calc line
                let radians = Phaser.Math.DegToRad(this.fireline.angle);
                let fireStartX = config.scale.width / 2;
                let fireStartY = config.scale.height / 2;
                let fireEndX =
                    fireStartX + (config.scale.height / 2) * Math.cos(radians);
                let fireEndY =
                    fireStartY + (config.scale.height / 2) * Math.sin(radians);
                let lineOfFire = new Phaser.Geom.Line(
                    fireStartX,
                    fireStartY,
                    fireEndX,
                    fireEndY
                );

                // check for hits
                this.targets.getChildren().forEach(target => {
                    if (target.visible) {
                        let bounds = target.getBounds();
                        if (
                            Phaser.Geom.Intersects.LineToRectangle(
                                lineOfFire,
                                bounds
                            )
                        ) {
                            target.visible = false;
                            this.time.addEvent({
                                delay: 3000,
                                callback: () => {
                                    target.visible = true;
                                },
                            });
                        }
                    }
                });
            }
        });
    }
}
