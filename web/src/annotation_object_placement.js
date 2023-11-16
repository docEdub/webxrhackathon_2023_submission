
import { AnnotationObject } from "./annotation_object";
import { fetchPreSignedUrl } from "./fetchurl";

const MAX_SOUND_DURATION_SECONDS = 10;

// let annotationObject = null;
// let annotationSound = null;

export const startPlacingAnnotationObject = (scene, primaryAnchor, hitTestTarget) => {
    if (!primaryAnchor) {
        console.log("No primaryAnchor, returning");
        return;
    }

    console.log("Creating new object at ", hitTestTarget.position, " with quaternion ", hitTestTarget.quaternion);
    new AnnotationObject(scene, hitTestTarget.position, hitTestTarget.quaternion);

    recordAnnotationSound();
}

const recordAnnotationSound = async () => {
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
                //uncomment to immediately test retrieval
                //await fetchAndPlayWebMAudioByUser();
            } else {
                console.error('Audio upload failed');
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
    }
}
