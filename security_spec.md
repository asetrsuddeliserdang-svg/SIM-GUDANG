# Security Specification for SIMPERGUD RSUD

## 1. Data Invariants
- A transaction item (detail) cannot exist without a valid parent transaction header.
- Stok updates must be accompanied by a mutation record.
- Users can only access functionality based on their role (Admin, Gudang, Unit, Direktur).
- Prices and quantities must be positive numbers.
- Timestamps must be server-validated.

## 2. The Dirty Dozen Payloads (Test Scenarios)
1.  **Identity Spoofing**: Attempt to create a transaction with `user_input` as someone else's UID.
2.  **Role Escalation**: A user with role 'UNIT' tries to update a transaction status to 'APPROVED'.
3.  **Price Poisoning**: Attempt to save a negative price in transaction detail.
4.  **Quantity Overflow**: Attempt to save an excessively large quantity (e.g., 10^12) to cause resource exhaustion.
5.  **Orphan Detail**: Attempt to create a `trx_barang_masuk/{id}/items` without a header at `trx_barang_masuk/{id}`.
6.  **Immutable Bypass**: Attempt to change the `created_at` or `kode_barang` of an existing mutation record.
7.  **Shadow Field Injection**: Adding an `isAdmin` field to a user profile update.
8.  **Empty Transaction**: Saving a header with $0 total but having items.
9.  **Stok Jump**: Directly updating `stok_sekarang` in `barang` collection without a transaction.
10. **PII Leak**: A 'UNIT' user tries to list all user profiles in the `users` collection.
11. **Status Skipping**: Trying to set a transaction directly to 'APPROVED' without the 'PENDING' phase.
12. **ID Poisoning**: Using a 1MB string as a document ID for a new item.

## 3. Implementation Plan
- Robust `isValid[Entity]` helpers for all collections.
- `exists()` checks for relational integrity.
- `affectedKeys()` for granular update permissions.
- `isAdmin()` and `isRole()` helpers for ABAC.
