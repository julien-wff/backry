export type ApiResponse<T extends object> = {
    error: null;
    data: T;
} | {
    error: string;
    data: null;
}
