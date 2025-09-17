export const RESTORE_DESTINATION = [ 'current', 'other' ] as const;
export const RESTORE_STEPS = [ 'check_backup', 'check_destination', 'drop_db', 'restore' ] as const;
