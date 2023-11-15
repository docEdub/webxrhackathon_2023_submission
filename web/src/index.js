/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import './styles/index.css';
import {Amplify} from 'aws-amplify';
import amplifyConfig from './amplifyconfigure';
import fetchPreSignedUrl from './fetchurl';
import { Auth } from 'aws-amplify';

Amplify.configure(amplifyConfig);

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

export async function recordAndUploadWebMAudio() {
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
                await fetchAndPlayWebMAudioByUser();
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

(async () => {
    await recordAndUploadWebMAudio();
})();
