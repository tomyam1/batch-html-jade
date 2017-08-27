# batch-html-jade
> Utility for batch conversion of HTML files to Jade

## Usage

1. Clone or download the package.
1. Install dependencies with `npm install`.
1. Create a `src` directory with the HTML files.
1. Run `gulp`.
1. Jade files will be at the `dist` directory
1. To make sure we converted from HTML to Jade correctly,
we convert all the Jade files to HTML and compare them to the source HTML using html-differ.
If there are differences, the source and final HTML files will be saved to `diff-src` and `diss-dest`
directories so you can compare them manually.
