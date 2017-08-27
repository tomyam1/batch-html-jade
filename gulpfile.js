'use strict';
const Gulp = require('gulp');
const Through2 = require('through2');
const Html2Jade = require('html2jade');
const Bluebird = require('bluebird');
const Jade = require('jade');
const Del = require('del');
const RunSequence = require('run-sequence');
const HtmlDIffer = require('html-differ');
const Chalk = require('chalk');


Bluebird.promisifyAll(Html2Jade);


const differ = new HtmlDIffer.HtmlDiffer({

});

// Given a diffs from html-differ determine if the two html files are equal
const isEqual = (diffs) => {
    return diffs.every((diff) => {
        if (!diff.added && !diff.removed) return true;

        // Jade adds / to self-closing tags
        // Ignore this (didn't see this as an option in html-diff
        if (diff.added === true && diff.value === '/') return true;
    });
};

Gulp.task('default', (done) => {
    RunSequence(
        'clean',
        'convert',
        done
    );
});

Gulp.task('clean', () => {
    return Del([
        'dest',
        'diff-src',
        'diff-dest'
    ]);
});

Gulp.task('convert', () => {
    const results = {
        equal: [],
        notEqual: []
    };

    return Gulp.src('src/**/*.html')
        .pipe(Through2.obj((file, enc, cb) => {
            const srcHtml = file.contents.toString();

            file.srcHtml = srcHtml;

            Html2Jade.convertHtmlAsync(srcHtml, {
                bodyless: true,
                noemptypipe: true
            }).then((jade) => {
                // rename .html to .jade
                file.contents = new Buffer(jade);
                file.path = file.path.replace(/\.html$/, '.jade');
                return file;
            }).asCallback(cb);
        }))
        .pipe(Gulp.dest('dest'))
        .pipe(Through2.obj((file, enc, cb) => {
            const jade = file.contents.toString();
            file.path = file.path.replace(/\.jade$/, '.html');
            const compiledHtml = Jade.compile(jade, {
                pretty: true
            })();
            file.contents = new Buffer(compiledHtml);
            file.compiledHtml = compiledHtml;
            cb(null, file);
        }))
        .pipe(Through2.obj(
            (file, enc, cb) => {
                const diffs = differ.diffHtml(file.srcHtml, file.compiledHtml);
                if (isEqual(diffs)) {
                    results.equal.push(file.path);
                    cb(null);
                } else {
                    results.notEqual.push({
                        path: file.path,
                        diffs: diffs
                    });
                    cb(null, file);
                }
            },
            (cb) => {
                console.log(`A total of ${results.equal.length + results.notEqual.length} where converted`);
                console.log(`For ${results.equal.length} files html=>jade=>html equals the source html`);
                console.log(`The following ${results.notEqual.length} files should be checked because they had differences:`);
                results.notEqual.forEach((itr) => {
                    console.log(Chalk.cyan(itr.path));
                    console.log(JSON.stringify(itr.diffs, null, 2));
                    console.log('\n');
                });
                cb();
            }
        ))
        .pipe(Gulp.dest('diff-dest'))
        .pipe(Through2.obj(
            (file, enc, cb) => {
                file.contents = new Buffer(file.srcHtml);
                cb(null, file);
            }
        ))
        .pipe(Gulp.dest('diff-src'));
});

