
import { fetchAllAudioFiles } from "./cloud";
import { getAllAnnotations } from "./cloud";

export const loadAnnotationObjects = async (/*primaryAnchor*/) => {
    const annotations = await getAllAnnotations();
    const audioAnnotations = annotations.filter(annotation => annotation.type === 'audio');
    console.log(audioAnnotations);

    const audioFiles = await fetchAllAudioFiles();
    console.log(audioFiles);

    // TODO: How to we tie annotations to audio files?
}
