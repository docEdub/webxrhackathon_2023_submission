
import { AnnotationObject } from "./annotation_object";

// let annotationObject = null;

export const startPlacingObject = (scene, primaryAnchor, hitTestTarget) => {
    if (!primaryAnchor) {
        console.log("No primaryAnchor, returning");
        return;
    }

    console.log("Creating new object at ", hitTestTarget.position, " with quaternion ", hitTestTarget.quaternion);
    new AnnotationObject(scene, hitTestTarget.position, hitTestTarget.quaternion);
}
