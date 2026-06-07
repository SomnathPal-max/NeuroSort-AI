CC = gcc
CFLAGS = -Wall -Wextra -O2

SRCS = src/main.c src/ai_engine.c src/sorting.c src/avl_tree.c src/hash_table.c src/undo_stack.c src/report.c
OBJS = $(SRCS:.c=.o)
TARGET = neurosort

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CC) $(CFLAGS) -o $(TARGET) $(OBJS) -lm

clean:
	rm -f $(OBJS) $(TARGET)
