

if [ -d dist ]; then
  rm -rf dist
fi


tsc

if [ !  -d dist ]; then
  echo "ERROR: dist directory not found"
  exit 1
fi



echo "build successful"
