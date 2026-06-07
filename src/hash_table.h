#ifndef HASH_TABLE_H
#define HASH_TABLE_H

#include "file_record.h"

typedef struct HashNode {
    char filename[256];
    struct HashNode *next;
} HashNode;

typedef struct {
    HashNode *buckets[HASH_SIZE];
} HashTable;

HashTable* create_hash_table();
void insert_hash(HashTable *ht, FileRecord *file);
void free_hash_table(HashTable *ht);

#endif
