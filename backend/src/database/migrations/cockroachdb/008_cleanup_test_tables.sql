-- Migration 008: Cleanup Test Tables (CockroachDB Compatible)

DROP TABLE IF EXISTS test_child;
DROP TABLE IF EXISTS test_parent;
DROP TABLE IF EXISTS test_enum;
DROP TABLE IF EXISTS test_table;