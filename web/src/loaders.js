//loader.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader'

export const LOADERS = {
    'gltf': new GLTFLoader(),
    'png': new THREE.TextureLoader(),
    'exr': new EXRLoader(),
};