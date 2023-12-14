#!/bin/bash


# Check if jq and curl are installed
command -v jq >/dev/null 2>&1 || { echo >&2 "jq is required but not installed. Aborting."; exit 1; }
command -v curl >/dev/null 2>&1 || { echo >&2 "curl is required but not installed. Aborting."; exit 1; }

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
echo "Script directory: $SCRIPT_DIR"


# Check if data.json exists
if [ ! -f "data.json" ]; then
  echo "Error: data.json not found."
  exit 1
fi



dateFolder=$(date +%Y-%m-%d_%H-%M-%S)

if [ ! -d "results" ]; then
  echo "Creating results folder."
  mkdir "results"
fi



if [ ! -d "results/${dateFolder}" ]; then
  echo "Creating results folder."
  mkdir "results/${dateFolder}"
fi


jq -c '.[]' data.json | while read -r item; do
  # Extract url and url_id
  url=$(echo "$item" | jq -r '.url')
  name=$(echo "$item" | jq -r '.name')

if [ ! -d "results/${dateFolder}/${name}" ]; then
  echo "Creating ${name} folder."
  mkdir "results/$dateFolder/$name"
fi

for i in 1 2 3 4 5; do
echo "starting the process for the GET ID request to ${name} with url ${url}"
./ab.exe -s 45 -k -n 5000000 -t 10 -c 10 -H "Accept-Encoding: gzip" -g "results/${dateFolder}/${name}/${name}_${i}.csv" "${url}" < /dev/null > "results/${dateFolder}/${name}/${name}_${i}_stats.txt" 2>&1 
done
done
cd "$SCRIPT_DIR" || exit 1

python3 data.py

python3 printData.py
