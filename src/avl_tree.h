#ifndef AVL_TREE_H
#define AVL_TREE_H

#include "file_record.h"

// Node for a linked list of files within a category
typedef struct FileNode {
    FileRecord *file;
    struct FileNode *next;
} FileNode;

typedef struct AVLNode {
    char category[50];
    int file_count;
    int total_size_kb;
    FileNode *file_list;
    struct AVLNode *left;
    struct AVLNode *right;
    int height;
} AVLNode;

AVLNode* insert_avl(AVLNode *node, FileRecord *file);
void inorder_avl(AVLNode *root);
void free_avl(AVLNode *root);

#endif
