set -x

cd dist
tar czf mongo-migrator.tgz .

echo "Build compressed at ./dist/mongo-migrator.tgz"
