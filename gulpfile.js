/**
 * Popular Tasks
 * -------------
 *
 * compile: compiles the .less files of the specified packages
 * lint: runs jshint on all .js files
 */

var merge = require('merge-stream'),
    gulp = require('gulp'),
    header = require('gulp-header'),
    less = require('gulp-less'),
    rename = require('gulp-rename'),
    eslint = require('gulp-eslint'),
    fs = require('fs'),
    path = require('path');

// paths of the packages for the compile-task
var pkgs = [
    {path: 'app/installer/', data: '../../composer.json'},
    {path: 'app/system/modules/theme/', data: '../../../../composer.json'},
    {path: 'themes/one/', data: 'composer.json'}
];

// banner for the css files
var banner = "/*! <%= data.title %> <%= data.version %> | (c) 2014 Pagekit | MIT License */\n";

var cldr = path.join(__dirname, 'node_modules/cldr-localenames-modern/main/');
var formats = path.join(__dirname, 'vendor/assets/vue-intl/dist/locales/');
var languages = path.join(__dirname, 'app/system/languages/');

gulp.task('default', ['compile']);

/**
 * Compile all less files
 */
gulp.task('compile', function () {

    return merge.apply(null, pkgs.map(function (pkg) {
        return gulp.src(pkg.path + '**/less/*.less', {base: pkg.path})
            .pipe(less({compress: true, relativeUrls: true}))
            .pipe(header(banner, {data: require('./' + pkg.path + pkg.data)}))
            .pipe(rename(function (file) {
                // the compiled less file should be stored in the css/ folder instead of the less/ folder
                file.dirname = file.dirname.replace('less', 'css');
            }))
            .pipe(gulp.dest(pkg.path));
    }));

});

/**
 * Watch for changes in files
 */
gulp.task('watch', function () {
    gulp.watch('**/*.less', ['compile']);
});

/**
 * Lint all script files
 */
gulp.task('lint', function () {
    return gulp.src([
        'app/modules/**/*.js',
        'app/system/**/*.js',
        'extensions/**/*.js',
        'themes/**/*.js',
        '!**/bundle/*',
        '!**/vendor/**/*'
    ])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failOnError());
});

gulp.task('cldr', function () {

    fs.readdirSync(languages)
        .filter(function (file) {
            return fs.statSync(path.join(languages, file)).isDirectory();
        })
        .forEach(function (src) {

            var id = src.replace('_', '-'), shortId = id.substr(0, id.indexOf('-')), found;

            ['languages', 'territories'].forEach(function (name) {

                found = false;
                [id, shortId, 'en'].forEach(function (locale) {
                    var file = cldr + locale + '/' + name + '.json';
                    if (!found && fs.existsSync(file)) {
                        found = true;
                        fs.writeFileSync(languages + src + '/' + name + '.json', JSON.stringify(JSON.parse(fs.readFileSync(file, 'utf8')).main[locale].localeDisplayNames[name]));
                    }
                });

            });

            found = false;
            [id.toLowerCase(), shortId, 'en'].forEach(function (locale) {
                var file = formats + locale + '.json';
                if (!found && fs.existsSync(file)) {
                    found = true;
                    fs.writeFileSync(languages + src + '/formats.json', fs.readFileSync(file, 'utf8'));
                }
            });

        });
});
