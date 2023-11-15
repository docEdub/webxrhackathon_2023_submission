import { GlobalComponent } from './global';
import { System } from '@lastolivegames/becsy';

export class ControllersSystem extends System {
    constructor() {
        super();

        this.globalEntity = this.query((q) => q.current.with(GlobalComponent).write);
    }

	execute() {
		const global = this.globalEntity.current[0].write(GlobalComponent);

        if (!this._controllerR) {
            this._buttonPressStates = [[], []];
            this._controllerL = global.renderer.xr.getController(1);
            this._controllerR = global.renderer.xr.getController(0);

            this._controllerL.addEventListener('connected', (e) => {
                const controller = e.data;
                this._buttonsL = controller.gamepad.buttons;
                for (const button of this._buttonsL) {
                    this._buttonPressStates[1].push(button.pressed);
                }
            });

            this._controllerR.addEventListener('connected', (e) => {
                const controller = e.data;
                this._buttonsR = controller.gamepad.buttons;
                for (const button of this._buttonsR) {
                    this._buttonPressStates[0].push(button.pressed);
                }
            });
        }

        if (this._buttonsR) {
            for (let i = 0; i < this._buttonsR.length; i++) {
                const button = this._buttonsR[i];
                const pressed = button.pressed;
                if (pressed !== this._buttonPressStates[0][i]) {
                    if (pressed) {
                        console.log(`controller 0: button ${i} pressed`);
                    } else {
                        console.log(`controller 0: button ${i} released`);
                    }
                    this._buttonPressStates[0][i] = pressed;
                }
            }
        }
        if (this._buttonsL) {
            for (let i = 0; i < this._buttonsL.length; i++) {
                const button = this._buttonsL[i];
                const pressed = button.pressed;
                if (pressed !== this._buttonPressStates[1][i]) {
                    if (pressed) {
                        console.log(`controller 1: button ${i} pressed`);
                    } else {
                        console.log(`controller 1: button ${i} released`);
                    }
                    this._buttonPressStates[1][i] = pressed;
                }
            }
        }
    }
}
