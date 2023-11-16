
import { createAudioAnnotationSource } from "./annotation_object_creation";
import { fetchAllAudioFiles } from "./cloud";
import { getAllAnnotations } from "./cloud";
import { AnnotationObject } from "./annotation_object";

export const loadAnnotationObjects = async (scene, anchor) => {
    console.log("Loading annotation objects ...");

    const annotations = await getAllAnnotations();
    const audioAnnotations = annotations.filter(annotation => annotation.type === 'audio');
    console.log(audioAnnotations);

    const audioFiles = await fetchAllAudioFiles();
    console.log(audioFiles);

    // TODO: How to we tie annotations to audio files?
    // Just load the first of each one for now.
    const audioFile = audioFiles[0];
    const annotation = audioAnnotations[0];

    const annotationObject = new AnnotationObject(scene, anchor, annotation.position, annotation.orientation);
    annotationObject.setState("complete");

    const audioSource =
        await createAudioAnnotationSource(audioFile, annotation.position);

    // For testing only.
    annotationObject.setState("playing");
    audioSource.play();

    console.log("Loading annotation objects - done");
}
