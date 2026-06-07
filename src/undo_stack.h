#ifndef UNDO_STACK_H
#define UNDO_STACK_H

#include "file_record.h"

typedef struct DListNode {
    FileRecord *file;
    struct DListNode *next;
    struct DListNode *prev;
} DListNode;

typedef struct {
    DListNode *top;
    int count;
} UndoStack;

UndoStack* create_undo_stack();
void push_undo(UndoStack *stack, FileRecord *file);
FileRecord* pop_undo(UndoStack *stack);
void display_undo_stack(UndoStack *stack);
void free_undo_stack(UndoStack *stack);

#endif
