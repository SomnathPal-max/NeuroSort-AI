#ifndef AI_ENGINE_H
#define AI_ENGINE_H

#include "file_record.h"

void classify_file(FileRecord *f);
void calculate_priority(FileRecord *f);
void set_urgency(FileRecord *f);

#endif
