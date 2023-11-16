
import {
    DoubleSide,
    Mesh,
    MeshBasicMaterial,
	SphereGeometry,
} from 'three';

export class AnnotationObject {
    constructor(scene, anchor, position, quaternion) {
        const geometry = new SphereGeometry(0.1);
        const material = new MeshBasicMaterial({color: 0x222222, side: DoubleSide});
        const sphere = new Mesh(geometry, material);
        sphere.position.copy(position);
        sphere.quaternion.copy(quaternion);
        anchor.add(sphere)

        this._anchor = anchor;
        this._geometry = geometry;
        this._material = material;
        this._scene = scene;
        this._sphere = sphere;
    }

    dispose() {
        this._geometry.dispose();
        this._material.dispose();
        this._anchor.remove(this._sphere);
    }

    setState(state) {
        this.state = state;

        if (state == "placed") {
            this._material.color.setHex(0xffff00);
        }
        else if (state == "recording") {
            this._material.color.setHex(0xff0000);
        }
        else if (state == "recording-done") {
            this._material.color.setHex(0x00ffff);
        }
        else if (state == "complete") {
            this._material.color.setHex(0x00ff00);
        }
        else if (state == "error") {
            this._material.color.setHex(0xff00ff);
        }
    }
}
