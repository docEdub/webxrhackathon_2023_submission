
import {
    Quaternion,
    Vector3
} from "three";

export class AudioEngine {
    constructor() {
        this.audioContext = new AudioContext();
        this.listener = new AudioListener(this);

        document.onclick = () => {
            this.audioContext.resume();
        }
    }
}

export class AudioListener {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.position = new Vector3();
        this.orientation = new Quaternion();
    }

    setOrientation(quat) {
        if (this.orientation.equals(quat)) return;
        this.orientation.copy(quat);
    }

    setPosition(vec3) {
        if (this.position.equals(vec3)) return;
        this.position.copy(vec3);
    }
}

export class AudioSource {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.position = new Vector3();
    }

    load(blob) {
        this.blob = blob;
    }

    setPosition(vec3) {
        if (this.position.equals(vec3)) return;
        this.position.copy(vec3);
    }

    play() {

    }

    stop() {

    }
}

export class AudioRecorder {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
    }

    start() {

    }

    stop() {

    }

    getBlob() {

    }
}
