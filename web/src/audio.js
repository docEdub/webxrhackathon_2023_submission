
import {
    Quaternion,
    Vector3
} from "three";

export class AudioEngine {
    constructor() {
        this.audioContext = new AudioContext();
        this.listener = new AudioListener(this);

        this._destinationNode = this.audioContext.destination;
        this._rampDuration = 0.25; // seconds
        this._recordingDuration = 10; // seconds
        this._sources = [];

        document.onclick = () => {
            this.audioContext.resume();
        }
    }

    createSource() {
        const source = new AudioSource(this);
        this._sources.push(source);
        source.getOutputNode().connect(this._destinationNode);
        return source;
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
    constructor(audioEngine) {
        this._audioEngine = audioEngine;
        this._position = new Vector3();

        this._gainNode = new GainNode(this._audioEngine.audioContext);
        this._pannerNode = new PannerNode(this._audioEngine.audioContext);

        this._gainNode.connect(this._pannerNode);
    }

    async load(blob) {
        this._blob = blob;

        const arrayBuffer = await blob.arrayBuffer();
        const audioBuffer = await this._audioEngine.audioContext.decodeAudioData(arrayBuffer);
        this._audioBufferSourceNode = new AudioBufferSourceNode(this._audioEngine.audioContext, { buffer: audioBuffer });
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
    }

    stop() {
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
