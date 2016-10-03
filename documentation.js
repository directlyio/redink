const Promise = require('bluebird');
const path = require('path');
const fs = require('fs-promise');
const acorn = require('acorn-object-spread');
const doctrine = require('doctrine');

const filesToParse = [
  'Model.js',
  'ModelArray.js',
  'Redink.js',
  'Resource.js',
  'ResourceArray.js',
];

const root = path.resolve(__dirname, 'src');

fs.readdir(root)

  /**
   * Extract the text from all the files to parse into an objet with the keys being the class name,
   * and the value being the extracted text.
   */
  .then(files => {
    const readFile = (file) => fs.readFile(`${root}/${file}`, { encoding: 'utf8' });
    const isFileToParse = (file) => filesToParse.includes(file);

    return Promise.props(
      files.filter(isFileToParse).reduce((prev, next) => ({
        ...prev,
        [next.split('.')[0]]: readFile(next),
      }), {})
    );
  })

  /**
   * Convert the text of every class into an array of its JSDoc ASTs.
   */
  .then(classes => {
    const classesWithComments = { ...classes };

    Object.keys(classesWithComments).forEach(className => {
      const comments = [];

      acorn.parse(classesWithComments[className], {
        sourceType: 'module',
        ecmaVersion: 8,
        plugins: { objectSpread: true },
        onComment: (block, text) => block && comments.push(text),
      });

      classesWithComments[className] = comments.map(comment =>
        doctrine.parse(comment, {
          unwrap: true,
          sloppy: true,
        }),
      );
    });

    return classesWithComments;
  })

  /**
   * Write the JSON file to disk.
   */
  .then(classesWithComments => {
    const file = JSON.stringify(classesWithComments);

    return fs.writeFile(path.resolve(__dirname, 'docs/src/api/api.json'), file);
  })

  .then(() => console.log('Done creating docs!'))
  .catch(console.error);
