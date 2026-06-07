#ifndef REPORT_H
#define REPORT_H

#include "file_record.h"

void print_welcome_banner();
void display_files_table(FileRecord *arr, int n);
void display_benchmark(double times[6]);
void display_category_weight_chart(FileRecord *arr, int n);
void display_duplicates(FileRecord *arr, int n);
void generate_report_file(FileRecord *arr, int n, double times[6]);

#endif
