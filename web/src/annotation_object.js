
import { loadAsset } from './fetchurl.js';

import {
    Group,
    Mesh,
    MeshBasicMaterial,
	SphereGeometry,
} from 'three';

export const annotationObjects = [];

export class AnnotationObject {
    constructor(scene, anchor, position, quaternion) {
        const group = new Group();
        group.position.copy(position);
        group.quaternion.copy(quaternion);
        anchor.add(group);
        group.position.sub(anchor.position);
        group.scale.set(0.5, 0.5, 0.5);

        const geometry = new SphereGeometry(0.5);
        const material = new MeshBasicMaterial({color: 0x222222});
        const mesh = new Mesh(geometry, material);
        mesh.annotationObject = this;
        mesh.rotation.x = Math.PI / 2;
        mesh.scale.z = 0.001;
        group.add(mesh);

        loadAsset('gltf', 'assets/disk.glb', (gltf) => {
            console.log("Loaded disk glb: ", gltf);

            const root = gltf.scene.children[0];
            root.position.set(0, 0, 0);
            root.rotation.set(0, 0, 0);

            const firstChild = root.children[0];
            firstChild.position.set(0, 0, 0);
            firstChild.rotation.set(0, 0, 0);

            group.add(gltf.scene);

            this._gltf = gltf.scene;
        });

        this._anchor = anchor;
        this._geometry = geometry;
        this._group = group;
        this._material = material;
        this._mesh = mesh;
        this._scene = scene;

        annotationObjects.push(this);
    }

    dispose() {
        this._geometry.dispose();
        this._material.dispose();
        this._anchor.remove(this._group);

        annotationObjects.splice(annotationObjects.indexOf(this), 1);
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
            this._material.color.setHex(0xff00ff);
        }
        else if (state == "playing") {
            this._material.color.setHex(0x00ff00);
        }
        else if (state == "error") {
            this._material.color.setHex(0xaaaaaa);
        }
    }

    update() {
        if (this.state == "playing" && this._gltf) {
            this._gltf.rotation.y += 0.1;
        }
    }
}
