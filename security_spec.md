# Security Specification - Mappa Mundi

## 1. Data Invariants
- A contact document must have a `userId` field that matches the authenticated user ID (`request.auth.uid`).
- A user can only read, write, create, or delete their own contacts or country color preferences.
- Document IDs must conform to alphanumeric constraints and be strictly bounded to prevent wallet abuse.
- Input fields including notes, names, titles, and paths are constrained in character size to safeguard against Denial of Wallet attacks.

## 2. The "Dirty Dozen" Payloads and Test Scenarios

### Scenario 1: Identity Spoofing (Create Contact with other owner's UID)
- **Path**: `/contacts/contact_123`
- **Payload**: `{ id: "contact_123", userId: "attacker_uid", name: "Bob", countryId: "840", countryName: "USA", city: "NYC", contactInfo: "t@t.com", notes: "...", createdAt: "2026-05-28T08:00:00Z" }`
- **Result**: `PERMISSION_DENIED`

### Scenario 2: Unauthenticated Write
- **Path**: `/contacts/contact_123`
- **Payload**: `{ id: "contact_123", userId: "user_123", name: "Bob", countryId: "840", ... }` with `request.auth == null`
- **Result**: `PERMISSION_DENIED`

### Scenario 3: Unauthorized Read of Other User's Contact
- **Path**: `/contacts/contact_of_victim` (owned by `victim_uid`)
- **Query / Get**: `get()` as `attacker_uid`
- **Result**: `PERMISSION_DENIED`

### Scenario 4: Blanket Read Search Query Attack
- **Path**: `/contacts`
- **Query**: Select all contacts without filtering by `userId` in the query
- **Result**: `PERMISSION_DENIED`

### Scenario 5: Poison Document ID Injection
- **Path**: `/contacts/junk$$%%??!`
- **Payload**: Conforms to Contact schema
- **Result**: `PERMISSION_DENIED` (fails Regex check)

### Scenario 6: Extra Field Shadow Injection (Ghost Field)
- **Path**: `/contacts/contact_123`
- **Payload**: `{ id: "contact_123", userId: "user_123", name: "Bob", isVerifiedAdmin: true, ... }`
- **Result**: `PERMISSION_DENIED` (ghost field is blocked)

### Scenario 7: Value Poisoning (Exceeding String Size Limit)
- **Path**: `/contacts/contact_123`
- **Payload**: `{ id: "contact_123", userId: "user_123", notes: "A" * 5000, ... }` (Notes size exceeds 2000 chars)
- **Result**: `PERMISSION_DENIED`

### Scenario 8: Unauthorized Color Modification
- **Path**: `/users/victim_uid/colors/840`
- **Payload**: `{ userId: "victim_uid", countryId: "840", color: "#FF0000" }` written by `attacker_uid`
- **Result**: `PERMISSION_DENIED`

### Scenario 9: Country Color Type Poisoning
- **Path**: `/users/user_123/colors/840`
- **Payload**: `{ userId: "user_123", countryId: "840", color: true }` (color is boolean, not string)
- **Result**: `PERMISSION_DENIED`

### Scenario 10: Email Spoofing (Email matched but unverified)
- **Auth**: `{ email: "jrmenhd@gmail.com", email_verified: false }`
- **Write**: Create contact
- **Result**: `PERMISSION_DENIED`

### Scenario 11: Immutable Field Tampering (Changing userId on update)
- **Path**: `/contacts/contact_123`
- **Payload**: `{ id: "contact_123", userId: "attacker_uid", name: "Bob", ... }` targeting existing contact owned by `user_123`
- **Result**: `PERMISSION_DENIED`

### Scenario 12: Super-Size ID Denial of Wallet
- **Path**: `/contacts/` + "A" * 1000
- **Payload**: Valid contact fields
- **Result**: `PERMISSION_DENIED`

## 3. Test Runner Definition
Verification tests are executed as an automated validation suite via ESLint Security rules and runtime validation simulation inside the dev environment.
