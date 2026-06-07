#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include "file_record.h"
#include "ai_engine.h"
#include "sorting.h"
#include "avl_tree.h"
#include "hash_table.h"
#include "undo_stack.h"
#include "report.h"

// Extract extension
void get_extension(const char *filename, char *ext) {
    const char *dot = strrchr(filename, '.');
    if (!dot || dot == filename) {
        strcpy(ext, "");
    } else {
        strcpy(ext, dot); // including dot
    }
}

// Queue for BFS-like scanning
typedef struct {
    FileRecord **data;
    int head;
    int tail;
    int size;
    int capacity;
} Queue;

Queue* create_queue(int cap) {
    Queue *q = (Queue*)malloc(sizeof(Queue));
    q->capacity = cap;
    q->size = 0;
    q->head = 0;
    q->tail = -1;
    q->data = (FileRecord**)malloc(cap * sizeof(FileRecord*));
    return q;
}

void enqueue(Queue *q, FileRecord *val) {
    if (q->size == q->capacity) return;
    q->tail = (q->tail + 1) % q->capacity;
    q->data[q->tail] = val;
    q->size++;
}

FileRecord* dequeue(Queue *q) {
    if (q->size == 0) return NULL;
    FileRecord *val = q->data[q->head];
    q->head = (q->head + 1) % q->capacity;
    q->size--;
    return val;
}

void free_queue(Queue *q) {
    free(q->data);
    free(q);
}

int main() {
    print_welcome_banner();

    int mode;
    printf("Select Input Mode:\n");
    printf("1. Read from files.txt\n");
    printf("2. Manual entry\n");
    printf("Choice: ");
    if (scanf("%d", &mode) != 1) mode = 1;
    while(getchar() != '\n'); // clear buffer

    FileRecord *master_array = (FileRecord*)malloc(MAX_FILES * sizeof(FileRecord));
    int file_count = 0;

    if (mode == 1) {
        FILE *fp = fopen("files.txt", "r");
        if (!fp) {
            printf("Error opening files.txt\n");
            free(master_array);
            return 1;
        }
        char line[512];
        while (fgets(line, sizeof(line), fp)) {
            if (file_count >= MAX_FILES) break;
            char fn[256], dt[20];
            int sz;
            if (sscanf(line, "%255s %d %19s", fn, &sz, dt) == 3) {
                FileRecord *fr = &master_array[file_count++];
                strcpy(fr->filename, fn);
                fr->size_kb = sz;
                strcpy(fr->date, dt);
                fr->is_duplicate = 0;
                get_extension(fn, fr->extension);
            }
        }
        fclose(fp);
    } else {
        printf("Enter files (format: filename.ext size_kb YYYY-MM-DD).\nType 'done' to finish.\n");
        while (file_count < MAX_FILES) {
            char fn[256], dt[20];
            int sz;
            printf("> ");
            if (scanf("%255s", fn) != 1) break;
            if (strcmp(fn, "done") == 0) {
                while(getchar() != '\n');
                break;
            }
            if (scanf("%d %19s", &sz, dt) == 2) {
                FileRecord *fr = &master_array[file_count++];
                strcpy(fr->filename, fn);
                fr->size_kb = sz;
                strcpy(fr->date, dt);
                fr->is_duplicate = 0;
                get_extension(fn, fr->extension);
            }
        }
    }

    if (file_count == 0) {
        printf("No files to process.\n");
        free(master_array);
        return 0;
    }

    // Process Queue (Simulator)
    Queue *q = create_queue(MAX_FILES);
    for (int i = 0; i < file_count; i++) enqueue(q, &master_array[i]);

    HashTable *ht = create_hash_table();
    UndoStack *undo = create_undo_stack();

    // Classification and duplicate detection
    while (q->size > 0) {
        FileRecord *fr = dequeue(q);
        insert_hash(ht, fr); // Detect duplicate
        classify_file(fr);
        calculate_priority(fr);
        set_urgency(fr);
    }
    
    display_files_table(master_array, file_count);
    display_duplicates(master_array, file_count);
    display_category_weight_chart(master_array, file_count);

    // Sorting block (benchmark)
    FileRecord *temp_arr = malloc(file_count * sizeof(FileRecord));
    double times[6];
    
    memcpy(temp_arr, master_array, file_count * sizeof(FileRecord));
    times[0] = bubble_sort(temp_arr, file_count);
    
    memcpy(temp_arr, master_array, file_count * sizeof(FileRecord));
    times[1] = selection_sort(temp_arr, file_count);
    
    memcpy(temp_arr, master_array, file_count * sizeof(FileRecord));
    times[2] = insertion_sort(temp_arr, file_count);
    
    memcpy(temp_arr, master_array, file_count * sizeof(FileRecord));
    times[3] = merge_sort_wrapper(temp_arr, file_count);
    
    memcpy(temp_arr, master_array, file_count * sizeof(FileRecord));
    times[4] = quick_sort_wrapper(temp_arr, file_count);
    
    memcpy(temp_arr, master_array, file_count * sizeof(FileRecord));
    times[5] = radix_sort(temp_arr, file_count);
    
    // Sort main array with quicksort (by size)
    quick_sort_wrapper(master_array, file_count);
    
    display_benchmark(times);

    // AVL Tree build and log moves to Undo Stack
    AVLNode *avl_root = NULL;
    for (int i = 0; i < file_count; i++) {
        avl_root = insert_avl(avl_root, &master_array[i]);
        push_undo(undo, &master_array[i]);
    }
    
    printf("+------------------------------------------------------+\n");
    printf("|                AVL TREE FOLDER INDEX                 |\n");
    printf("+------------------------------------------------------+\n");
    inorder_avl(avl_root);
    printf("+------------------------------------------------------+\n\n");

    display_undo_stack(undo);

    printf("\nPress 'U' or 'u' to undo the last move, or any other key to continue: ");
    char c = getchar();
    if (c == 'U' || c == 'u') {
        FileRecord *popped = pop_undo(undo);
        if (popped) {
            printf("\nUndo Successful. Removed %s from %s Category.\n", popped->filename, popped->category);
        }
        display_undo_stack(undo);
    }
    
    // Generate Final Report
    generate_report_file(master_array, file_count, times);
    printf("\n--- Processing Complete. Final output saved to report.txt ---\n");

    // Cleanup
    free_queue(q);
    free_hash_table(ht);
    free_undo_stack(undo);
    free_avl(avl_root);
    free(master_array);
    free(temp_arr);

    return 0;
}
