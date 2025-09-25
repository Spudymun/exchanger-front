-- Check enum values for WalletStatus
SELECT unnest(enum_range(NULL::"WalletStatus")) AS enum_value;