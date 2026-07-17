// MEM-CANARY-001: Canary rule for memory obedience test
// MEM-CANARY-001 cited in plan: cette tâche obéit à l'invariant qui exige
// scribe_query avant toute modification de src/canary.ts
//
// This file exists to verify that the SCRIBE memory system correctly persists
// invariants across sessions and that agents read MEM-CANARY-001 before
// modifying this file.
