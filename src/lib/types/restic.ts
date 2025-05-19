export interface ResticError {
    message_type: string;
    code: number;
    message: string;
}

export interface ResticStats {
    message_type: 'stats';
    total_size: number;
    total_file_count: number;
    total_blob_count: number;
    snapshots_count: number;
    total_uncompressed_size: number;
    compression_ratio: number;
    compression_progress: number;
    compression_space_saving: number;
}

export interface ResticInit {
    message_type: 'initialized';
    id: string;
    repository: string;
}

export interface ResticBackupStatus {
    message_type: 'status',
    seconds_remaining?: number,
    percent_done: number,
    total_files: number,
    files_done?: number,
    bytes_done?: number,
    current_files?: string[],
}

export interface ResticBackupSummary {
    message_type: 'summary',
    files_new: number,
    files_changed: number,
    files_unmodified: number,
    dirs_new: number,
    dirs_changed: number,
    dirs_unmodified: number,
    data_blobs: number,
    tree_blobs: number,
    data_added: number,
    data_added_packed: number,
    total_files_processed: number,
    total_bytes_processed: number,
    total_duration: number,
    backup_start: string,
    backup_end: string,
    snapshot_id: string,
}

export interface ResticSnapshot {
    time: string,
    tree: string,
    paths: string[ ],
    hostname: string,
    username: string,
    tags: string[],
    program_version: string,
    summary: {
        backup_start: string,
        backup_end: string,
        files_new: number,
        files_changed: number,
        files_unmodified: number,
        dirs_new: number,
        dirs_changed: number,
        dirs_unmodified: number,
        data_blobs: number,
        tree_blobs: number,
        data_added: number,
        data_added_packed: number,
        total_files_processed: number,
        total_bytes_processed: number,
    },
    id: string,
    short_id: string,
}

export interface ResticLock {
    time: string,
    exclusive: boolean,
    hostname: string,
    username: string,
    pid: number,
}

export interface ResticForget {
    tags: string[] | null,
    host: string,
    paths: string[],
    keep: ResticSnapshot[],
    remove: ResticSnapshot[],
    reasons: Array<{
        snapshot: ResticSnapshot,
        matches: string[],
    }>
}
