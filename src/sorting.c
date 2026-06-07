#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include "sorting.h"

// Swaps two records
static void swap(FileRecord *a, FileRecord *b) {
    FileRecord temp = *a;
    *a = *b;
    *b = temp;
}

// O(n^2) Bubble Sort
double bubble_sort(FileRecord *arr, int n) {
    clock_t start = clock();
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j].size_kb > arr[j + 1].size_kb) {
                swap(&arr[j], &arr[j + 1]);
            }
        }
    }
    clock_t end = clock();
    return ((double)(end - start) / CLOCKS_PER_SEC) * 1000.0;
}

// O(n^2) Selection Sort
double selection_sort(FileRecord *arr, int n) {
    clock_t start = clock();
    for (int i = 0; i < n - 1; i++) {
        int min_idx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j].size_kb < arr[min_idx].size_kb) {
                min_idx = j;
            }
        }
        swap(&arr[min_idx], &arr[i]);
    }
    clock_t end = clock();
    return ((double)(end - start) / CLOCKS_PER_SEC) * 1000.0;
}

// O(n^2) Insertion Sort
double insertion_sort(FileRecord *arr, int n) {
    clock_t start = clock();
    for (int i = 1; i < n; i++) {
        FileRecord key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j].size_kb > key.size_kb) {
            arr[j + 1] = arr[j];
            j = j - 1;
        }
        arr[j + 1] = key;
    }
    clock_t end = clock();
    return ((double)(end - start) / CLOCKS_PER_SEC) * 1000.0;
}

// Merge Sort Helper
static void merge(FileRecord *arr, int l, int m, int r) {
    int n1 = m - l + 1;
    int n2 = r - m;
    FileRecord *L = (FileRecord *)malloc(n1 * sizeof(FileRecord));
    FileRecord *R = (FileRecord *)malloc(n2 * sizeof(FileRecord));
    
    for (int i = 0; i < n1; i++) L[i] = arr[l + i];
    for (int j = 0; j < n2; j++) R[j] = arr[m + 1 + j];
    
    int i = 0, j = 0, k = l;
    while (i < n1 && j < n2) {
        if (L[i].size_kb <= R[j].size_kb) {
            arr[k++] = L[i++];
        } else {
            arr[k++] = R[j++];
        }
    }
    while (i < n1) arr[k++] = L[i++];
    while (j < n2) arr[k++] = R[j++];
    
    free(L);
    free(R);
}

static void merge_sort(FileRecord *arr, int l, int r) {
    if (l < r) {
        int m = l + (r - l) / 2;
        merge_sort(arr, l, m);
        merge_sort(arr, m + 1, r);
        merge(arr, l, m, r);
    }
}

// O(n log n) Merge Sort Wrapper
double merge_sort_wrapper(FileRecord *arr, int n) {
    clock_t start = clock();
    merge_sort(arr, 0, n - 1);
    clock_t end = clock();
    return ((double)(end - start) / CLOCKS_PER_SEC) * 1000.0;
}

// Quick Sort Helper
static int partition(FileRecord *arr, int low, int high) {
    int pivot = arr[high].size_kb;
    int i = (low - 1);
    for (int j = low; j <= high - 1; j++) {
        if (arr[j].size_kb < pivot) {
            i++;
            swap(&arr[i], &arr[j]);
        }
    }
    swap(&arr[i + 1], &arr[high]);
    return (i + 1);
}

static void quick_sort(FileRecord *arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quick_sort(arr, low, pi - 1);
        quick_sort(arr, pi + 1, high);
    }
}

// O(n log n) Quick Sort Wrapper
double quick_sort_wrapper(FileRecord *arr, int n) {
    clock_t start = clock();
    quick_sort(arr, 0, n - 1);
    clock_t end = clock();
    return ((double)(end - start) / CLOCKS_PER_SEC) * 1000.0;
}

// Radix Sort Helper - return max size
static int get_max(FileRecord *arr, int n) {
    if (n == 0) return 0;
    int mx = arr[0].size_kb;
    for (int i = 1; i < n; i++) {
        if (arr[i].size_kb > mx) mx = arr[i].size_kb;
    }
    return mx;
}

static void count_sort(FileRecord *arr, int n, int exp) {
    FileRecord *output = (FileRecord *)malloc(n * sizeof(FileRecord));
    int count[10] = {0};
    
    for (int i = 0; i < n; i++) count[(arr[i].size_kb / exp) % 10]++;
    for (int i = 1; i < 10; i++) count[i] += count[i - 1];
    
    for (int i = n - 1; i >= 0; i--) {
        output[count[(arr[i].size_kb / exp) % 10] - 1] = arr[i];
        count[(arr[i].size_kb / exp) % 10]--;
    }
    for (int i = 0; i < n; i++) arr[i] = output[i];
    
    free(output);
}

// O(nk) Radix Sort
double radix_sort(FileRecord *arr, int n) {
    clock_t start = clock();
    if (n > 0) {
        int m = get_max(arr, n);
        for (int exp = 1; m / exp > 0; exp *= 10) {
            count_sort(arr, n, exp);
        }
    }
    clock_t end = clock();
    return ((double)(end - start) / CLOCKS_PER_SEC) * 1000.0;
}
