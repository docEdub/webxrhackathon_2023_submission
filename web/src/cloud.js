import { Auth } from 'aws-amplify';
import {fetchPreSignedUrl, fetchAllPreSignedUrls} from './fetchurl';
import amplifyConfig from './amplifyconfigure';

const API_GATEWAY_URL = amplifyConfig.Api.url;

/**
* Gets the current user's annotations
* @returns {Object[]}   The user's annotations
*/
export async function getUserAnnotations() {
    try {
        const session = await Auth.currentSession();
        const idToken = session.getIdToken().getJwtToken();

        const response = await fetch(`${API_GATEWAY_URL}annotation`, {
            headers: {
                Authorization: idToken,
                'Content-Type': 'application/json',
            },
            method: 'GET',
        });
        const responseData = await response.json();
        console.log("User Annotations:", JSON.stringify(responseData, null, 2));
        return responseData;
    } catch (err) {
        console.error('Failed to fetch user annotations:', err.message);
        throw err;
    }
}
/**
* Puts an annotation for the current user
* @param {Object} annotationData    The annotation data to be put
* @param {string} annotationData.type   The type of annotation ('audio', 'object', or 'sketch')
* @param {Object} annotationData.position   The position of the annotation
* @param {number} annotationData.position.x   The x position of the annotation
* @param {number} annotationData.position.y   The y position of the annotation
* @param {number} annotationData.position.z   The z position of the annotation
* @param {Object} annotationData.orientation   The orientation of the annotation
* @param {number} annotationData.orientation.x   The x orientation of the annotation
* @param {number} annotationData.orientation.y   The y orientation of the annotation
* @param {number} annotationData.orientation.z   The z orientation of the annotation
* @param {number} annotationData.orientation.w   The w orientation of the annotation
* @returns {boolean}   Whether the annotation was successfully put
*/
export async function putUserAnnotation(annotationData) {
    try {
        const session = await Auth.currentSession();
        const idToken = session.getIdToken().getJwtToken();

        const response = await fetch(`${API_GATEWAY_URL}annotation`, {
            headers: {
                Authorization: idToken,
                'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify(annotationData),
        });
        console.log("Put Annotation Response:", JSON.stringify(response, null, 2));
        return response.status === 200;
    } catch (err) {
        console.error('Failed to put user annotation:', err.message);
        throw err;
    }
}

/**
* Gets the current user's annotations
* @returns {Object[]}   The user's annotations
*/
export async function getAllAnnotations() {
    try {
        const session = await Auth.currentSession();
        const idToken = session.getIdToken().getJwtToken();

        const response = await fetch(`${API_GATEWAY_URL}annotations/all`, {
            headers: {
                Authorization: idToken,
                'Content-Type': 'application/json',
            },
            method: 'GET',
        });
        const responseData = await response.json();
        console.log("All Annotations:", JSON.stringify(responseData, null, 2));
        return responseData;
    } catch (err) {
        console.error('Failed to fetch all annotations:', err.message);
        throw err;
    }
}

export async function fetchAndPlayWebMAudioByUser() {
    try {
        // Get the current user's username
        const user = await Auth.currentAuthenticatedUser();
        const username = user.username;

        // Construct the asset key using the username and file name
        const assetKey = `${username}/sound.webm`;

        // Fetch the pre-signed URL for the audio file
        const preSignedUrl = await fetchPreSignedUrl(assetKey, 'GET');

        // Create an audio element and set its source to the pre-signed URL
        const audio = new Audio(preSignedUrl);
        audio.load();

        // Play the audio file
        audio.play().then(() => {
            console.log('Playing audio');
        }).catch(error => {
            console.error('Error playing audio:', error);
        });

    } catch (error) {
        console.error('Failed to fetch and play audio:', error);
    }
}

export async function fetchAudioUrlByUser(username) {
    try {
        // Construct the asset key using the username and file name
        const assetKey = `${username}/sound.webm`;

        // Fetch the pre-signed URL for the audio file
        const preSignedUrl = await fetchPreSignedUrl(assetKey, 'GET');
        return preSignedUrl;
    } catch (error) {
        console.error('Failed to fetch and play audio:', error);
    }
}

export async function fetchAllAudioFiles() {
    try {
        // Common asset key name
        const assetKey = 'sound.webm';

        // Fetch the pre-signed URLs for the audio files
        const preSignedUrls = await fetchAllPreSignedUrls(assetKey);

        console.log(preSignedUrls);

        return preSignedUrls;

    } catch (error) {
        console.error('Failed to fetch audio files:', error);
    }
}

export async function fetchAllTextFiles() {
    try {
        // Common asset key name
        const assetKey = 'sound.txt';

        // Fetch the pre-signed URLs for the audio files
        const preSignedUrls = await fetchAllPreSignedUrls(assetKey);

        console.log(preSignedUrls);

        // Map each URL to a fetch request and wait for all of them to complete
        const textFetchPromises = preSignedUrls.map(async (url) => {
            const textUrl = await fetch(url.url);
            const text = await textUrl.text();
            return { username: url.username, text: text };
        });

        const mappedToText = await Promise.all(textFetchPromises);
        return mappedToText;

    } catch (error) {
        console.error('Failed to fetch text files:', error);
    }
}

export async function recordAndUploadWebMAudio(hearAudio = false) {
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
                if(hearAudio){
                    await fetchAndPlayWebMAudioByUser();
                }
            } else {
                console.error('Audio upload failed');
            }
        });

        // Start recording
        mediaRecorder.start();

        // Stop recording after a desired duration
        setTimeout(() => {
            mediaRecorder.stop();
        }, 5000);  // Adjust this duration as needed

    } catch (error) {
        console.error('Recording failed:', error);
    }
}

export async function testAnnotations() {
    function getRandomInt() {
        return Math.floor(Math.random() * 50) / 10;
    }
    try {
        // Create annotations of each type
        await putUserAnnotation({ type: 'audio', position: { x: getRandomInt(), y: getRandomInt(), z: getRandomInt() }, orientation: { x: 0, y: 0, z: 0, w: 1 } });
        await putUserAnnotation({ type: 'object', position: { x: 4, y: 5, z: 6 }, orientation: { x: 1, y: 1, z: 1, w: 0 } });
        await putUserAnnotation({ type: 'sketch', position: { x: 7, y: 8, z: 9 }, orientation: { x: 0.5, y: 0.5, z: 0.5, w: 0.5 } });

        console.log('Annotations created.');

        // Verify by getting the user's annotations
        const userAnnotations = await getUserAnnotations();
        console.log('User Annotations:', userAnnotations);

        // Verify by getting all annotations
        const allAnnotations = await getAllAnnotations();
        console.log('All Annotations:', allAnnotations);
    } catch (err) {
        console.error('Error:', err.message);
    }
}

export async function testAudio() {
    await recordAndUploadWebMAudio(true);
}
