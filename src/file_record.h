#ifndef FILE_RECORD_H
#define FILE_RECORD_H

#define MAX_FILES 1000
#define MAX_CATEGORY_LEN 50
#define HASH_SIZE 101

typedef struct {
    char filename[256];
    char extension[10];
    char category[MAX_CATEGORY_LEN];
    int size_kb;
    int priority_score;
    int urgency; /* 1=LOW, 2=MEDIUM, 3=HIGH */
    char date[20];
    int is_duplicate;
} FileRecord;

#endif
