
import { AnnotationObject } from "./annotation_object";
import { Auth } from "aws-amplify";
import { fetchAudioUrlByUser } from "./cloud";
import { fetchPreSignedUrl } from "./fetchurl";
import { getUserAnnotations } from "./cloud";
import { putUserAnnotation } from "./cloud";

const MAX_SOUND_DURATION_SECONDS = 10;
const MAX_RECORDING_ATTEMPTS = 3;

// let annotationObject = null;
// let annotationSound = null;
let recordingAttempt = 0;

export const startPlacingAnnotationObject = async (scene, primaryAnchor, hitTestTarget) => {
    if (!primaryAnchor) {
        console.log("No primaryAnchor, returning");
        return;
    }

    console.log("Creating new object at ", hitTestTarget.position, " with quaternion ", hitTestTarget.quaternion);
    new AnnotationObject(scene, hitTestTarget.position, hitTestTarget.quaternion);

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
    recordAnnotationSound();
}

const recordAnnotationSound = async () => {
    if (recordingAttempt >= MAX_RECORDING_ATTEMPTS) {
        return;
    }
    recordingAttempt++;

    console.log("Recording annotation sound ...");

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
                const audioFileUrl = await fetchAudioUrlByUser(username);

                const audioAnnotation = annotations.filter(annotation => annotation.type === 'audio')[0];

                createAudioAnnotationSource(audioFileUrl, audioAnnotation.position, audioAnnotation.orientation);
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
        }, MAX_SOUND_DURATION_SECONDS * 1000);

    } catch (error) {
        console.error('Recording annotation sound failed: ', error);
        recordAnnotationSound();
    }
}

const createAudioAnnotationSource = async (audioFileUrl, position) => {
    const audioSource = window.audioEngine.createSource();

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
    audioSource.play();
}
