
import os
import sys

num_of_lines=0
print(sys.argv[1])
name = sys.argv[1] if len(sys.argv) > 1 else '.'
if os.path.isdir(name):
    for root, dirs, files in os.walk(name):
        for file in files:
            with open(os.path.join(root,file)) as open_file:
                for i,l in enumerate(open_file):
                    if not l.isspace():
                        num_of_lines+=1;
    print(num_of_lines)
elif os.path.isfile(name):
    pass;
    with open(name) as file:
        for i, l in enumerate(file):
            if not l.isspace():
                num_of_lines+=1
    print(num_of_lines)
else:
    print('%s is not a file or a directory' %(name))

    