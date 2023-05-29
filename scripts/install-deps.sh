set -x

USE_YARN=true

if [ "$USE_YARN" == true ]; then 
  echo "Using Yarn to Install dependencies"
  cd migrator-task && yarn && cd ..
  cd mongo-migrator && yarn && cd ..
  cd user-interface && yarn && cd ..
else
  echo "Using NPM to Install dependencies"
  cd migrator-task && npm install . && cd ..
  cd mongo-migrator && npm install . && cd ..
  cd user-interface && npm install . && cd ..
fi

echo "Dependencies installed!"
