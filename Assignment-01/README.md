# Linux fundamental

* `#!/bin/bash` --> this tells operating system to execute this file using the bash shell
* `echo` --> it prints text to the standard output, we used to create headers and balnk spaces inside the log file
* `$(date)` --> it executes the date command to stamp the log with the exact time the script ran.
* `df -h /` --> disk free, and -h is a human readable flag (displays the data in Gb, Mb). It checks the available storage on root path (/)
* `free -h` --> it dispalys total used and available ram.
* `uptime` --> It displays how long the system is running and the cpu load over the last 1,5,15 minutes
* `ps -eo pid,user,%mem,command --sort=-%mem` --> it shows every process (-e), formats the columns(-0) and sort them by top memory consumption
* `| head -n 6` --> | is pipe, it catches the output of the previous command, head -n 6 takes the output from the top and takes first 6 rows, first row is the column header.
