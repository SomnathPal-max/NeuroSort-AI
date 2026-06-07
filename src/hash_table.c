#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "hash_table.h"

// djb2 hash function
static unsigned long djb2_hash(unsigned char *str) {
    unsigned long hash = 5381;
    int c;
    while ((c = *str++))
        hash = ((hash << 5) + hash) + c; // hash * 33 + c
    return hash;
}

HashTable* create_hash_table() {
    HashTable *ht = (HashTable*)malloc(sizeof(HashTable));
    for (int i = 0; i < HASH_SIZE; i++) {
        ht->buckets[i] = NULL;
    }
    return ht;
}

void insert_hash(HashTable *ht, FileRecord *file) {
    unsigned long int hashval = djb2_hash((unsigned char*)file->filename);
    int bucket = hashval % HASH_SIZE;

    // Search for duplicate
    HashNode *curr = ht->buckets[bucket];
    while (curr != NULL) {
        if (strcmp(curr->filename, file->filename) == 0) {
            file->is_duplicate = 1;
            return; // Duplicate found, stop
        }
        curr = curr->next;
    }

    // Insert new logic
    HashNode *new_node = (HashNode*)malloc(sizeof(HashNode));
    strcpy(new_node->filename, file->filename);
    new_node->next = ht->buckets[bucket];
    ht->buckets[bucket] = new_node;
}

void free_hash_table(HashTable *ht) {
    for (int i = 0; i < HASH_SIZE; i++) {
        HashNode *curr = ht->buckets[i];
        while (curr != NULL) {
            HashNode *temp = curr;
            curr = curr->next;
            free(temp);
        }
    }
    free(ht);
}
