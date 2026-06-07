#include <stdio.h>
#include <stdlib.h>
#include "undo_stack.h"

UndoStack* create_undo_stack() {
    UndoStack *s = (UndoStack*)malloc(sizeof(UndoStack));
    s->top = NULL;
    s->count = 0;
    return s;
}

void push_undo(UndoStack *stack, FileRecord *file) {
    DListNode *new_node = (DListNode*)malloc(sizeof(DListNode));
    new_node->file = file;
    new_node->next = stack->top;
    new_node->prev = NULL;

    if (stack->top != NULL) {
        stack->top->prev = new_node;
    }
    stack->top = new_node;
    stack->count++;
}

FileRecord* pop_undo(UndoStack *stack) {
    if (stack->top == NULL) return NULL;
    
    DListNode *temp = stack->top;
    FileRecord *f = temp->file;
    
    stack->top = stack->top->next;
    if (stack->top != NULL) {
        stack->top->prev = NULL;
    }
    free(temp);
    stack->count--;
    return f;
}

void display_undo_stack(UndoStack *stack) {
    printf("+------------------------------------------------------+\n");
    printf("|                 UNDO STACK (Last 5 moves)            |\n");
    printf("+------------------------------------------------------+\n");
    
    if (stack->top == NULL) {
        printf("| Stack is empty.                                      |\n");
        printf("+------------------------------------------------------+\n");
        return;
    }

    DListNode *curr = stack->top;
    int k = 0;
    while (curr != NULL && k < 5) {
        printf("| %d. Moved %-20s -> %-15s |\n", k+1, curr->file->filename, curr->file->category);
        curr = curr->next;
        k++;
    }
    printf("+------------------------------------------------------+\n");
}

void free_undo_stack(UndoStack *stack) {
    while (stack->top != NULL) {
        pop_undo(stack);
    }
    free(stack);
}
