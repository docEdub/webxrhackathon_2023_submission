
import {
    Quaternion,
    Vector3
} from "three";

export class AudioEngine {
    constructor(camera) {
        this._camera = camera;

        this.audioContext = new AudioContext();
        this.listener = new AudioListener(this);

        this._rampDuration = 0.25; // seconds
        this._recordingDuration = 10; // seconds

        this._sources = [];

        this._masterGainNode = new GainNode(this.audioContext, { gain: 0.1 });
        this._destinationNode = this.audioContext.destination;

        document.onclick = () => {
            this.audioContext.resume();
        }
    }

    createSource(id) {
        const source = new AudioSource(this, id);
        this._sources.push(source);
        source.getOutputNode().connect(this._destinationNode);
        return source;
    }

    getSourceById(id) {
        return this._sources.find(source => source._id === id);
    }

    async createRecording() {
        const recorder = new AudioRecorder(this);
        recorder.start();

        return new Promise(resolve => {
            setTimeout(() => {
                recorder.stop();
                resolve(recorder.getBlob());
            }, this.recordingDuration * 1000);
        });
    }

    getRampTime() {
        return this.audioContext.currentTime + this._rampDuration;
    }

    setMasterVolume(volume) {
        this._masterGainNode.gain.linearRampToValueAtTime(volume, this.getRampTime());
    }

    update() {
        // console.log("Setting listener position = " + this._camera.position.toArray() + ", orientation = " + this._camera.quaternion.toArray());
        this.listener.setPosition(this._camera.position);
        this.listener.setOrientation(this._camera.quaternion);
    }
}

export class AudioListener {
    constructor(audioEngine) {
        this._audioEngine = audioEngine;
        this._position = new Vector3();
        this._orientation = new Quaternion();

        this._forwardVector = new Vector3(0, 0, -1);
        this._upVector = new Vector3(0, 1, 0);

        this._listener = audioEngine.audioContext.listener;
    }

    setOrientation(quat) {
        if (this._orientation.equals(quat)) return;
        this._orientation.copy(quat);

        this._forwardVector.set(0, 0, -1).applyQuaternion(quat);
        this._upVector.set(0, 1, 0).applyQuaternion(quat);

        const rampTime = this._audioEngine.getRampTime();
        this._listener.forwardX.linearRampToValueAtTime(this._forwardVector.x, rampTime);
        this._listener.forwardY.linearRampToValueAtTime(this._forwardVector.y, rampTime);
        this._listener.forwardZ.linearRampToValueAtTime(this._forwardVector.z, rampTime);
        this._listener.upX.linearRampToValueAtTime(this._upVector.x, rampTime);
        this._listener.upY.linearRampToValueAtTime(this._upVector.y, rampTime);
        this._listener.upZ.linearRampToValueAtTime(this._upVector.z, rampTime);
    }

    setPosition(vec3) {
        if (this._position.equals(vec3)) return;
        this._position.copy(vec3);

        const rampTime = this._audioEngine.getRampTime();
        this._listener.positionX.linearRampToValueAtTime(vec3.x, rampTime);
        this._listener.positionY.linearRampToValueAtTime(vec3.y, rampTime);
        this._listener.positionZ.linearRampToValueAtTime(vec3.z, rampTime);
    }
}

export class AudioSource {
    constructor(audioEngine, id) {
        this._audioEngine = audioEngine;
        this._id = id;

        this._position = new Vector3();

        this._gainNode = new GainNode(this._audioEngine.audioContext);
        this._pannerNode = new PannerNode(this._audioEngine.audioContext);

        this._gainNode.connect(this._pannerNode);
    }

    async load(blob) {
        this._blob = blob;

        if (!this._audioBuffer) {
            const arrayBuffer = await blob.arrayBuffer();
            this._audioBuffer = await this._audioEngine.audioContext.decodeAudioData(arrayBuffer);
        }
        this._audioBufferSourceNode = new AudioBufferSourceNode(this._audioEngine.audioContext, { buffer: this._audioBuffer });
        this._audioBufferSourceNode.connect(this._gainNode);
    }

    getOutputNode() {
        return this._pannerNode;
    }

    setPosition(vec3) {
        if (this._position.equals(vec3)) return;
        this._position.copy(vec3);

        const rampTime = this._audioEngine.getRampTime();
        this._pannerNode.positionX.linearRampToValueAtTime(vec3.x, rampTime);
        this._pannerNode.positionY.linearRampToValueAtTime(vec3.y, rampTime);
        this._pannerNode.positionZ.linearRampToValueAtTime(vec3.z, rampTime);
    }

    play() {
        this._audioBufferSourceNode.start();
        this._audioBufferSourceNode.onended = () => {
            this._loopTimeoutId = setTimeout(async () => {
                console.log("Looping audio");
                await this.load(this._blob);
                this.play();
            }, 3000);
        };
    }

    stop() {
        this._audioBufferSourceNode.onended = null;
        clearTimeout(this._loopTimeoutId);
        this._audioBufferSourceNode.stop();
    }
}

export class AudioRecorder {
    constructor(audioEngine) {
        this._audioEngine = audioEngine;
    }

    start() {

    }

    stop() {

    }

    getBlob() {

    }
}
