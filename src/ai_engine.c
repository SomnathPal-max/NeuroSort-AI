#include <stdio.h>
#include <string.h>
#include <ctype.h>
#include "ai_engine.h"

// Helper to convert string to lowercase
static void to_lowercase(char *str) {
    for (int i = 0; str[i]; i++) {
        str[i] = tolower((unsigned char)str[i]);
    }
}

void classify_file(FileRecord *f) {
    char ext[10];
    strcpy(ext, f->extension);
    to_lowercase(ext);

    if (strcmp(ext, ".pdf") == 0 || strcmp(ext, ".doc") == 0 || strcmp(ext, ".docx") == 0 || 
        strcmp(ext, ".txt") == 0 || strcmp(ext, ".ppt") == 0 || strcmp(ext, ".pptx") == 0) {
        strcpy(f->category, "Documents");
    } else if (strcmp(ext, ".jpg") == 0 || strcmp(ext, ".jpeg") == 0 || strcmp(ext, ".png") == 0 || 
               strcmp(ext, ".gif") == 0 || strcmp(ext, ".bmp") == 0 || strcmp(ext, ".svg") == 0) {
        strcpy(f->category, "Images");
    } else if (strcmp(ext, ".mp4") == 0 || strcmp(ext, ".mkv") == 0 || strcmp(ext, ".avi") == 0 || 
               strcmp(ext, ".mov") == 0 || strcmp(ext, ".wmv") == 0) {
        strcpy(f->category, "Videos");
    } else if (strcmp(ext, ".mp3") == 0 || strcmp(ext, ".wav") == 0 || strcmp(ext, ".aac") == 0 || 
               strcmp(ext, ".flac") == 0) {
        strcpy(f->category, "Audio");
    } else if (strcmp(ext, ".c") == 0 || strcmp(ext, ".cpp") == 0 || strcmp(ext, ".py") == 0 || 
               strcmp(ext, ".java") == 0 || strcmp(ext, ".js") == 0 || strcmp(ext, ".html") == 0 || 
               strcmp(ext, ".css") == 0) {
        strcpy(f->category, "Code");
    } else if (strcmp(ext, ".zip") == 0 || strcmp(ext, ".rar") == 0 || strcmp(ext, ".tar") == 0 || 
               strcmp(ext, ".gz") == 0 || strcmp(ext, ".7z") == 0) {
        strcpy(f->category, "Archives");
    } else if (strcmp(ext, ".exe") == 0 || strcmp(ext, ".msi") == 0 || strcmp(ext, ".apk") == 0 || 
               strcmp(ext, ".dmg") == 0) {
        strcpy(f->category, "Programs");
    } else if (strcmp(ext, ".xls") == 0 || strcmp(ext, ".xlsx") == 0 || strcmp(ext, ".csv") == 0) {
        strcpy(f->category, "Spreadsheets");
    } else {
        strcpy(f->category, "Others");
    }
}

void calculate_priority(FileRecord *f) {
    int score = 0;
    
    if (f->size_kb > 500) score += 30;
    else if (f->size_kb > 100) score += 15;
    
    if (strcmp(f->category, "Code") == 0) score += 25;
    if (strcmp(f->category, "Documents") == 0) score += 20;
    if (strcmp(f->category, "Videos") == 0) score += 10;
    
    char ext[10];
    strcpy(ext, f->extension);
    to_lowercase(ext);
    if (strcmp(ext, ".pdf") == 0) score += 10;
    
    if (f->is_duplicate == 1) score -= 20;
    
    if (score < 0) score = 0;
    if (score > 100) score = 100;
    
    f->priority_score = score;
}

void set_urgency(FileRecord *f) {
    if (f->priority_score >= 70) f->urgency = 3;
    else if (f->priority_score >= 40) f->urgency = 2;
    else f->urgency = 1;
}
