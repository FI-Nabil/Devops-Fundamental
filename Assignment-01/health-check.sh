#!/bin/bash

threshold=0
logfile="health-check.log"

while [ $# -gt 0 ]
do
    if [ "$1" = "--threshold" ]; then
        threshold="$2"
        shift 2

    elif [ "$1" = "--log" ]; then
        logfile="$2"
        shift 2

    else
        echo "Unknown option: $1"
        echo "Usage: ./health-check.sh --threshold <value> --log <logfile>"
        exit 1
    fi
done

{
  echo "==="
  echo "Health check run at: $(date)"
  echo "==="

  echo "==Disk Usage=="
  df -h /
  disk_usage=$(df -h / | awk 'NR==2 {gsub("%","",$5); print $5}')

  if [ "$disk_usage" -gt "$threshold" ]; then
        echo "WARNING: Disk usage above ${threshold}%! Current: ${disk_usage}%"
    else
        echo "Disk usage is within threshold."
    fi

  echo ""

  echo "==Memory Usage=="
  free -h
   memory_usage=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')

    if [ "$memory_usage" -gt "$threshold" ]; then
        echo "WARNING: Memory usage above ${threshold}%! Current: ${memory_usage}%"
    else
        echo "Memory usage is within threshold."
    fi
  echo ""

  echo "==CPU Load=="
  uptime
  echo ""

  echo "==Top 5 memory consumed porcesses=="
  ps -eo pid,user,%mem,command --sort=-%mem | head -n 6
  echo ""
} >> $logfile