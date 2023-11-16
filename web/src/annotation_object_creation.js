
import { AnnotationObject } from "./annotation_object";
import { Auth } from "aws-amplify";
import { fetchAudioUrlByUser } from "./cloud";
import { fetchPreSignedUrl } from "./fetchurl";
import { getUserAnnotations } from "./cloud";
import { putUserAnnotation } from "./cloud";
import { removeAnnotationObjectsByUsername } from "./annotation_object";

const RECORD_PROMPT_DELAY_SECONDS = 3;
const MAX_RECORDING_ATTEMPTS = 3;
const MAX_SOUND_DURATION_SECONDS = 10;

let recordingAttempt = 0;

let primaryAnchor = null;
let annotationObject = null;

export const startCreatingAnnotationObject = async (scene, anchor, hitTestTarget) => {
    if (!anchor) {
        console.log("No anchor, returning");
        return;
    }

    primaryAnchor = anchor;

    if (annotationObject) {
        if (annotationObject.state != "error" && annotationObject.state != "complete") {
            console.log("Already creating annotation");
            return;
        }

        console.log("Removing existing annotation object");
        annotationObject.dispose();
    }

    if (!hitTestTarget) {
        console.log("No hit test target, returning");
        return;
    }

    const user = await Auth.currentAuthenticatedUser();
    const username = user.username;

    removeAnnotationObjectsByUsername(username);

    console.log("Creating new object at ", hitTestTarget.position, " with quaternion ", hitTestTarget.quaternion, " and username ", username);
    annotationObject = new AnnotationObject(scene, primaryAnchor, username, hitTestTarget.position, hitTestTarget.quaternion);
    annotationObject.setState("placed");

    const annotationData = {
        type: 'audio',
        position: {
            x: hitTestTarget.position.x,
            y: hitTestTarget.position.y,
            z: hitTestTarget.position.z,
        },
        orientation: {
            x: hitTestTarget.quaternion.x,
            y: hitTestTarget.quaternion.y,
            z: hitTestTarget.quaternion.z,
            w: hitTestTarget.quaternion.w,
        }
    }

    putUserAnnotation(annotationData);

    recordingAttempt = 0;
    promptUserAndRecord();
}

const promptUserAndRecord = () => {
    showRecordingPrompt()
    setTimeout(() => {
        hideRecordingPrompt();
        recordAnnotationSound();
    }, RECORD_PROMPT_DELAY_SECONDS * 1000);
}

const showRecordingPrompt = () => {
}

const hideRecordingPrompt = () => {
}

const recordAnnotationSound = async () => {
    if (recordingAttempt >= MAX_RECORDING_ATTEMPTS) {
        annotationObject.setState("error");
        return;
    }
    recordingAttempt++;

    console.log("Recording annotation sound ...");

    annotationObject.setState("recording");

    try {
        // Request access to the microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        let audioChunks = [];

        mediaRecorder.addEventListener('dataavailable', event => {
            audioChunks.push(event.data);
        });

        mediaRecorder.addEventListener('stop', async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const assetKey = 'sound.webm';
            const preSignedUrl = await fetchPreSignedUrl(assetKey, 'PUT');

            // Upload the audio file to S3
            const uploadResponse = await fetch(preSignedUrl, {
                method: 'PUT',
                body: audioBlob,
            });

            if (uploadResponse.ok) {
                console.log('Audio uploaded successfully');
                const annotations = await getUserAnnotations();

                const user = await Auth.currentAuthenticatedUser();
                const username = user.username;
                const audioRecord = await fetchAudioUrlByUser(username);

                const audioAnnotation = annotations.filter(annotation => annotation.type === 'audio')[0];

                await createAudioAnnotationSource(username, audioRecord, audioAnnotation.position, audioAnnotation.orientation);
                annotationObject.setState("complete");
            } else {
                console.error('Audio upload failed');
                recordAnnotationSound();
            }
        });

        // Start recording
        mediaRecorder.start();

        // Stop recording after a desired duration
        setTimeout(() => {
            mediaRecorder.stop();
            annotationObject.setState("recording-done");
        }, MAX_SOUND_DURATION_SECONDS * 1000);

    } catch (error) {
        console.error('Recording annotation sound failed: ', error);
        recordAnnotationSound();
    }
}

export const createAudioAnnotationSource = async (username, audioFileUrl, position) => {
    const audioSource = window.audioEngine.createSource(username);

    console.log("Fetching audio from " + audioFileUrl);
    const response = await fetch(audioFileUrl);
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const blob = await response.blob();
    if (blob.type !== "audio/webm") {
        throw new Error("Fetched file is not a WebM video. Type is " + blob.type + ".");
    }

    await audioSource.load(blob);

    audioSource.setPosition(position);

    // For testing only.
    // annotationObject.setState("playing");
    // audioSource.play();

    return audioSource;
}
