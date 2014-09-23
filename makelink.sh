cd src
rm node_modules
ln -s ../src node_modules
cd ../server/mocha
rm chai-as-promised.js
rm chai.js
ln -s ../../node_modules/chai-as-promised/lib/chai-as-promised.js chai-as-promised.js
ln -s ../../node_modules/chai/chai.js chai.js
cd ../..