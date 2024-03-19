// Import necessary modules
import fs from 'fs';
import path from 'path';
import rehypeParse from 'rehype-parse';
import rehypeRemark from 'rehype-remark';
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { md2tid } from 'md-to-tid';

// Define the folder containing .tid files
const folderPath = '/Users/linonetwo/Desktop/wiki/private-wiki/';

// Function to process each .tid file
async function processFile(filePath) {
  console.log(`Processing file: ${filePath}`)
  // Read the file content
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Split the content to separate metadata from the HTML part
  const parts = content.split('\n\n');
  if (parts.length < 2) {
    console.error(`Skipping file due to unexpected format: ${filePath}`);
    return;
  }

  // The first part is the metadata, the second is the HTML content
  const [metadata, ...htmls] = parts;
  const html = htmls.join('\n\n');
  if (!html.includes('<div style=') && !html.includes('<div class=') && !html.includes('<div>') && !html.includes('<p>')) {
    console.log(`Skipping file due to no HTML: ${filePath}`);
    return;
  }

  let markdown
  // Use the unified pipeline to convert HTML to Markdown
  try {
    markdown = await unified()
    .use(rehypeParse, { fragment: true })
    .use(remarkGfm)
    .use(rehypeRemark)
    .use(remarkStringify)
    .process(html.replaceAll('<br/>', '\n'));
    markdown = markdown.value //.replaceAll('\\[\\[', '[[').replaceAll('\\[img\\[', '[img[').replaceAll('\\_', '_');
  } catch (error) {
    console.log(`Failed to convert HTML to Markdown in ${filePath}`, error)
  }

  if (!markdown) {
    console.log(`Skipping file due to no md content: ${filePath}`);
    return;
  }

  // Convert the Markdown to Tid format
  let tidText;
  try {
    tidText = await md2tid(markdown);
    tidText = tidText.replaceAll('\\[\\[', '[[').replaceAll('\\[img\\[', '[img[').replaceAll('\\_', '_')
  } catch (error) {
    console.log(`Failed to md2tid in ${filePath}`, error)
  }
  const transformResult = tidText || markdown || '';
  if (!transformResult) {
    console.log(`Skipping file due to no content: ${filePath}`);
    return;
  }
  // Combine metadata with the converted content
  const result = `${metadata}\n\n${transformResult}`;

  // Write the result to the file or to a new file
  fs.writeFileSync(filePath, result, 'utf-8');
  console.log(`Processed file: ${filePath}`);
}

// Read all files in the folder
fs.readdir(folderPath, (err, files) => {
  if (err) {
    console.error('Error reading the folder:', err);
    return;
  }

  // Filter .tid files and process each one
  files.filter(file => file.endsWith('.tid')).forEach(file => {
    const filePath = path.join(folderPath, file);
    processFile(filePath).catch(console.error);
  });
});

// processFile('/Users/linonetwo/Desktop/wiki/private-wiki/.net_web开发经典图书总结_-_2012_书单.tid')
