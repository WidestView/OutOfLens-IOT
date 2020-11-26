
#include <stdio.h>
#include <unistd.h>

_Noreturn void operate(int file)
{
    char read_buffer[1];
    char write_buffer[2] = {'s', '\n'};


    write(file, write_buffer, 2);

    for (;;)
    {
        int output = read(file, read_buffer, 1);

        if (output < 0)
        {
            _exit(99);
        }

        char data = *read_buffer;

        if (output != 0)
        {
            if (data == 'a')
            {
                *write_buffer = 'a';
            }
            else
            {
                *write_buffer = 'b';
            }

            write(file, write_buffer, 2);
        }

        usleep(100);
    }

}

int main(int argument_count, const char *arguments[])
{
    const char *usage = "\nUsage: fake_arduino PTY_PATH\n";

    if (argument_count < 2)
    {
        fputs("Missing required argument\n", stderr);
        fputs(usage, stderr);

        return 1;
    }
    else if (argument_count > 2)
    {
        fputs("Invalid argument count\n", stderr);
        fputs(usage, stderr);

        return 1;
    }

    FILE *file = fopen(arguments[1], "r+");

    if (file == NULL)
    {
        perror("Error while reading file");

        return 2;
    }

    operate(fileno(file));
}
