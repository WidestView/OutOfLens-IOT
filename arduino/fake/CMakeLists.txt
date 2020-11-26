
cmake_minimum_required(VERSION 3.17)
project(fake_arduino C)

set(CMAKE_C_STANDARD 99)

# Preprocessor
# set(CMAKE_C_FLAGS "-E")

include_directories(control)
include_directories(model)

add_executable(fake_arduino main.c)

# add_library(
#     lib
#     libfile.c
#     libfile.h
# )
# target_link_libraries(fake_arduino lib)

