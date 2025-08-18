/**
 * Control the behavior of the Modal component.
 * We use this class so the Modal can create an instance, and pass it to the parent component via props binding
 */
export abstract class ModalControls {
    /**
     * Open the modal
     */
    abstract open(): void;

    /**
     * Close the modal
     */
    abstract close(): void;
}
