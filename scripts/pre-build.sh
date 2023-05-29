set -x

echo "Building the User Interface bundle"
cd user-interface
npx ng build
cd ..

echo "Setting up the required structure"
rm -rf dist && mkdir dist
cp -r mongo-migrator dist/
cp -r migrator-task dist/mongo-migrator/
cp -r user-interface/dist/user-interface dist/mongo-migrator/static

echo "Done with the pre-build!"
