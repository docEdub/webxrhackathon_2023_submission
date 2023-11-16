
import { AnnotationObject } from "./annotation_object";

// let annotationObject = null;
// let annotationSound = null;

export const startPlacingAnnotationObject = (scene, primaryAnchor, hitTestTarget) => {
    if (!primaryAnchor) {
        console.log("No primaryAnchor, returning");
        return;
    }

    console.log("Creating new object at ", hitTestTarget.position, " with quaternion ", hitTestTarget.quaternion);
    new AnnotationObject(scene, hitTestTarget.position, hitTestTarget.quaternion);
}

export const recordAnnotationObjectSound = () => {
    console.log("Recording sound");
}
