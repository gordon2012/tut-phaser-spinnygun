import Phaser from 'phaser';

export default {
    type: Phaser.AUTO,
    backgroundColor: 0x222222,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: 'thegame',
        width: 750,
        height: 1334,
    },
};
