#!/bin/bash

logfile="health-check.log"

{
  echo "==="
  echo "Health check run at: $(date)"
  echo "==="

  echo "==Disk Usage=="
  df -h /
  echo ""

  echo "==Memory Usage=="
  free -h
  echo ""

  echo "==CPU Load=="
  uptime
  echo ""

  echo "==Top 5 memory consumed porcesses=="
  ps -eo pid,user,%mem,command --sort=-%mem | head -n 6
  echo ""
} >> $logfile