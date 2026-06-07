#ifndef SORTING_H
#define SORTING_H

#include "file_record.h"

double bubble_sort(FileRecord *arr, int n);
double selection_sort(FileRecord *arr, int n);
double insertion_sort(FileRecord *arr, int n);
double merge_sort_wrapper(FileRecord *arr, int n);
double quick_sort_wrapper(FileRecord *arr, int n);
double radix_sort(FileRecord *arr, int n);

#endif
