
import { createAudioAnnotationSource } from "./annotation_object_creation";
import { fetchAllAudioFiles } from "./cloud";
import { getAllAnnotations } from "./cloud";
import { AnnotationObject } from "./annotation_object";
import { updateUserTextRecords } from "./user_text_records";

export const loadAnnotationObjects = async (scene, anchor) => {
    console.log("Loading annotation objects ...");

    // username.
    const annotations = await getAllAnnotations();
    const audioAnnotations = annotations.filter(annotation => annotation.type === 'audio');
    console.log(audioAnnotations);

    const audioRecords = await fetchAllAudioFiles();
    console.log(audioRecords);
    // username.
    // url.

    for (let i = 0; i < annotations.length; i++) {
        const annotation = audioAnnotations[i];
        if (!annotation) {
            continue;
        }

        const username = annotation.username;

        // Find the audio record that matches this annotation's username.
        const audioRecord = audioRecords.find(record => record.username === username);
        if (!audioRecord) {
            continue;
        }

        const annotationObject = new AnnotationObject(scene, anchor, username, annotation.position, annotation.orientation);
        annotationObject.setState("complete");

        // const audioSource =
            await createAudioAnnotationSource(username, audioRecord.url, annotation.position);

        // For testing only.
        // annotationObject.setState("playing");
        // audioSource.play();

        updateUserTextRecords();
    }

    console.log("Loading annotation objects - done");
}
