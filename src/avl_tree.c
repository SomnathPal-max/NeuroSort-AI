#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "avl_tree.h"

// Helper to get max
static int max(int a, int b) {
    return (a > b) ? a : b;
}

// Helper to get height
static int height(AVLNode *N) {
    if (N == NULL) return 0;
    return N->height;
}

// Helper to create a new file node
static FileNode* create_file_node(FileRecord *f) {
    FileNode *n = (FileNode*)malloc(sizeof(FileNode));
    n->file = f;
    n->next = NULL;
    return n;
}

// Helper to create an AVL node
static AVLNode* new_node(FileRecord *file) {
    AVLNode *node = (AVLNode*)malloc(sizeof(AVLNode));
    strcpy(node->category, file->category);
    node->file_count = 1;
    node->total_size_kb = file->size_kb;
    node->file_list = create_file_node(file);
    node->left = NULL;
    node->right = NULL;
    node->height = 1;
    return node;
}

// Right rotate
static AVLNode* right_rotate(AVLNode *y) {
    AVLNode *x = y->left;
    AVLNode *T2 = x->right;

    x->right = y;
    y->left = T2;

    y->height = max(height(y->left), height(y->right)) + 1;
    x->height = max(height(x->left), height(x->right)) + 1;

    return x;
}

// Left rotate
static AVLNode* left_rotate(AVLNode *x) {
    AVLNode *y = x->right;
    AVLNode *T2 = y->left;

    y->left = x;
    x->right = T2;

    x->height = max(height(x->left), height(x->right)) + 1;
    y->height = max(height(y->left), height(y->right)) + 1;

    return y;
}

// Get balance factor
static int get_balance(AVLNode *N) {
    if (N == NULL) return 0;
    return height(N->left) - height(N->right);
}

AVLNode* insert_avl(AVLNode *node, FileRecord *file) {
    if (node == NULL)
        return new_node(file);

    int cmp = strcmp(file->category, node->category);

    if (cmp < 0) {
        node->left = insert_avl(node->left, file);
    } else if (cmp > 0) {
        node->right = insert_avl(node->right, file);
    } else {
        // Equal category, add to linked list
        node->file_count++;
        node->total_size_kb += file->size_kb;
        FileNode *fn = create_file_node(file);
        fn->next = node->file_list;
        node->file_list = fn;
        return node;
    }

    node->height = 1 + max(height(node->left), height(node->right));

    int balance = get_balance(node);

    // Left Left
    if (balance > 1 && strcmp(file->category, node->left->category) < 0)
        return right_rotate(node);

    // Right Right
    if (balance < -1 && strcmp(file->category, node->right->category) > 0)
        return left_rotate(node);

    // Left Right
    if (balance > 1 && strcmp(file->category, node->left->category) > 0) {
        node->left = left_rotate(node->left);
        return right_rotate(node);
    }

    // Right Left
    if (balance < -1 && strcmp(file->category, node->right->category) < 0) {
        node->right = right_rotate(node->right);
        return left_rotate(node);
    }

    return node;
}

static void print_indent(int level) {
    for (int i = 0; i < level; i++) printf("  ");
}

static void inorder_avl_helper(AVLNode *root, int level) {
    if (root != NULL) {
        inorder_avl_helper(root->left, level + 1);
        print_indent(level);
        printf("|-- Category: %-15s (Files: %d, Size: %d KB)\n", root->category, root->file_count, root->total_size_kb);
        inorder_avl_helper(root->right, level + 1);
    }
}

void inorder_avl(AVLNode *root) {
    inorder_avl_helper(root, 0);
}

void free_avl(AVLNode *root) {
    if (root != NULL) {
        free_avl(root->left);
        free_avl(root->right);
        FileNode *curr = root->file_list;
        while (curr != NULL) {
            FileNode *temp = curr;
            curr = curr->next;
            free(temp);
        }
        free(root);
    }
}
