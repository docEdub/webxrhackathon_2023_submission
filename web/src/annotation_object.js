
import {
    DoubleSide,
    Mesh,
    MeshBasicMaterial,
	SphereGeometry,
} from 'three';

export class AnnotationObject {
    constructor(scene, position, quaternion) {
        const geometry = new SphereGeometry(0.1);
        const material = new MeshBasicMaterial({color: 0x222222, side: DoubleSide});
        const sphere = new Mesh(geometry, material);
        sphere.position.copy(position);
        sphere.quaternion.copy(quaternion);
        scene.add(sphere)

        this._geometry = geometry;
        this._material = material;
        this._scene = scene;
        this._sphere = sphere;
    }

    dispose() {
        this._geometry.dispose();
        this._material.dispose();
        this._scene.remove(this._sphere);
    }

    setState(state) {
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
    }
}
