
import {
    DoubleSide,
    Mesh,
    MeshBasicMaterial,
	SphereGeometry,
} from 'three';

export class AnnotationObject {
    constructor(scene, position, quaternion) {
        const geometry = new SphereGeometry(0.1);
        const material = new MeshBasicMaterial({color: 0xff0000, side: DoubleSide});
        const sphere = new Mesh(geometry, material);
        sphere.position.copy(position);
        sphere.quaternion.copy(quaternion);
        scene.add(sphere)
    }
}
