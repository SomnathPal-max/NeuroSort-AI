#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include "report.h"

void print_welcome_banner() {
    printf("========================================================\n");
    printf("    NEUROSORT AI - Smart File Organizer                 \n");
    printf("========================================================\n\n");
}

void display_files_table(FileRecord *arr, int n) {
    printf("+----+-------------------------+-------+--------+------------------+----------+---------+\n");
    printf("| No | Filename                | Ext   | Size   | Category         | Priority | Urgency |\n");
    printf("+----+-------------------------+-------+--------+------------------+----------+---------+\n");
    for (int i = 0; i < n; i++) {
        char urg_str[10];
        if (arr[i].urgency == 3) strcpy(urg_str, "HIGH");
        else if (arr[i].urgency == 2) strcpy(urg_str, "MEDIUM");
        else strcpy(urg_str, "LOW");

        printf("| %-2d | %-23s | %-5s | %-6d | %-16s | %-8d | %-7s |\n", 
            i+1, arr[i].filename, arr[i].extension, arr[i].size_kb, 
            arr[i].category, arr[i].priority_score, urg_str);
    }
    printf("+----+-------------------------+-------+--------+------------------+----------+---------+\n\n");
}

void display_benchmark(double times[6]) {
    printf("+------------------------------------------------------+\n");
    printf("|               ALGORITHM BENCHMARK TABLE              |\n");
    printf("+----------------+-------------+------------+----------+\n");
    printf("| Algorithm      | Time (ms)   | Complexity | Best For |\n");
    printf("+----------------+-------------+------------+----------+\n");
    printf("| Bubble Sort    | %-11.4f | O(n^2)     | Small    |\n", times[0]);
    printf("| Selection Sort | %-11.4f | O(n^2)     | Small    |\n", times[1]);
    printf("| Insertion Sort | %-11.4f | O(n^2)     | Small    |\n", times[2]);
    printf("| Merge Sort     | %-11.4f | O(n log n) | Large    |\n", times[3]);
    printf("| Quick Sort     | %-11.4f | O(n log n) | Large    |\n", times[4]);
    printf("| Radix Sort     | %-11.4f | O(nk)      | Int keys |\n", times[5]);
    printf("+----------------+-------------+------------+----------+\n\n");
}

void display_category_weight_chart(FileRecord *arr, int n) {
    printf("+------------------------------------------------------+\n");
    printf("|               CATEGORY WEIGHT CHART                  |\n");
    printf("+------------------------------------------------------+\n");
    
    char categories[10][50] = {
        "Documents", "Images", "Videos", "Audio", "Code", "Archives", "Programs", "Spreadsheets", "Others"
    };
    int counts[9] = {0};

    for (int i = 0; i < n; i++) {
        for (int c = 0; c < 9; c++) {
            if (strcmp(arr[i].category, categories[c]) == 0) {
                counts[c]++;
                break;
            }
        }
    }

    for (int c = 0; c < 9; c++) {
        if (counts[c] > 0) {
            printf("| %-15s | ", categories[c]);
            for (int k = 0; k < counts[c]; k++) printf("#");
            printf(" (%d)\n", counts[c]);
        }
    }
    printf("+------------------------------------------------------+\n\n");
}

void display_duplicates(FileRecord *arr, int n) {
    printf("+------------------------------------------------------+\n");
    printf("|                  DUPLICATES PANEL                    |\n");
    printf("+------------------------------------------------------+\n");
    int found = 0;
    for (int i = 0; i < n; i++) {
        if (arr[i].is_duplicate) {
            printf("| Duplicate: %-25s (%d KB)\n", arr[i].filename, arr[i].size_kb);
            found++;
        }
    }
    if (found == 0) printf("| No duplicates found.\n");
    printf("+------------------------------------------------------+\n\n");
}

void generate_report_file(FileRecord *arr, int n, double times[6]) {
    FILE *fp = fopen("report.txt", "w");
    if (fp == NULL) return;

    time_t now = time(NULL);
    fprintf(fp, "========================================================\n");
    fprintf(fp, "    NEUROSORT AI - FINAL REPORT\n");
    fprintf(fp, "    Scan Date: %s", ctime(&now));
    fprintf(fp, "========================================================\n\n");

    fprintf(fp, "--- FILES GROUPED & SORTED (Priority Desc) ---\n");
    
    // Sort array by priority descending
    FileRecord *temp = malloc(n * sizeof(FileRecord));
    for(int i=0; i<n; i++) temp[i] = arr[i];
    for(int i=0; i<n-1; i++){
        for(int j=0; j<n-i-1; j++){
            if(temp[j].priority_score < temp[j+1].priority_score){
                FileRecord t = temp[j]; temp[j] = temp[j+1]; temp[j+1] = t;
            }
        }
    }
    
    char current_cat[50] = "";
    for (int c = 0; c < 9; c++) {
        char categories[10][50] = {
            "Documents", "Images", "Videos", "Audio", "Code", "Archives", "Programs", "Spreadsheets", "Others"
        };
        int printed_cat = 0;
        for (int i = 0; i < n; i++) {
            if (strcmp(temp[i].category, categories[c]) == 0) {
                if (!printed_cat) {
                    fprintf(fp, "\n[%s]\n", categories[c]);
                    printed_cat = 1;
                }
                fprintf(fp, "  - %-25s [Pri: %3d] [Urg: %d] [%d KB]\n", 
                    temp[i].filename, temp[i].priority_score, temp[i].urgency, temp[i].size_kb);
            }
        }
    }
    free(temp);

    fprintf(fp, "\n--- DUPLICATES ---\n");
    int dup = 0;
    for(int i=0; i<n; i++) {
        if(arr[i].is_duplicate) {
            fprintf(fp, "  - %s (%d KB)\n", arr[i].filename, arr[i].size_kb);
            dup = 1;
        }
    }
    if(!dup) fprintf(fp, "  None.\n");

    fprintf(fp, "\n--- BENCHMARK RESULTS ---\n");
    fprintf(fp, "Bubble Sort   : %.4f ms\n", times[0]);
    fprintf(fp, "Selection Sort: %.4f ms\n", times[1]);
    fprintf(fp, "Insertion Sort: %.4f ms\n", times[2]);
    fprintf(fp, "Merge Sort    : %.4f ms\n", times[3]);
    fprintf(fp, "Quick Sort    : %.4f ms\n", times[4]);
    fprintf(fp, "Radix Sort    : %.4f ms\n", times[5]);

    fclose(fp);
}
