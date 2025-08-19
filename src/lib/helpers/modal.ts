/**
 * Control the behavior of the Modal component.
 * We use this class so the Modal can create an instance, and pass it to the parent component via props binding
 */
export interface ModalControls {
    /**
     * Open the modal
     */
    open(): void;

    /**
     * Close the modal
     */
    close(): void;
}
