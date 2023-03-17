import fs from "fs";

import nunjucks from "nunjucks";

import { TEMPLATES_FOLDER, HTML_FILES_TO_IGNORE, SELECT_LANGUAGE_PAGE, LANGUAGE_ABBREVIATIONS, RENDERED_TEMPLATES_FOLDER } from "./settings.js";

nunjucks.configure(TEMPLATES_FOLDER, {autoescape: true});

// Delete the existing rendered templates and recreate their folder.
function recreateRenderedTemplatesFolder() {
    console.log(`Checking if the output folder for the rendered templates exists (${RENDERED_TEMPLATES_FOLDER})...`);

    if (fs.existsSync(RENDERED_TEMPLATES_FOLDER)) {
        console.log("The folder does exist and will now be deleted...");
        fs.rmSync(RENDERED_TEMPLATES_FOLDER, { recursive: true });
        console.log("The folder is now deleted.");
    } else {
        console.log("The folder does not exist.");
    }

    console.log(`Creating new folder for the rendered templates (${RENDERED_TEMPLATES_FOLDER})...`);
    fs.mkdirSync(RENDERED_TEMPLATES_FOLDER);
    console.log("Successfully created the folder.");
    console.log('Creating the ".gitkeep" file for the folder...');
    fs.writeFileSync(`${RENDERED_TEMPLATES_FOLDER}/.gitkeep`, "");
    console.log("Successfully created the file.");
}

recreateRenderedTemplatesFolder();

// Render the select language page.
function renderSelectLanguage() {
    console.log(`Rendering the select language page (${TEMPLATES_FOLDER}${SELECT_LANGUAGE_PAGE})...`)
    const contents = nunjucks.render(SELECT_LANGUAGE_PAGE);
    console.log(`Finished rendering the page. Saving it to the rendered templates folder as "index.html" (${RENDERED_TEMPLATES_FOLDER}/index.html)...`);
    fs.writeFileSync(`${RENDERED_TEMPLATES_FOLDER}/index.html`, contents);
    console.log("Finished saving the page.");
}

renderSelectLanguage();

// Create the folders for the different languages.
function createLanguageFolders() {
    console.log("Creating the folders for the different languages...");
    for (const lang of LANGUAGE_ABBREVIATIONS) {
        console.log(`Creating folder for the language "${lang}" (${RENDERED_TEMPLATES_FOLDER}/${lang})...`);
        fs.mkdirSync(`${RENDERED_TEMPLATES_FOLDER}/${lang}`);
        console.log("Finished creating the folder.");
    }
    console.log("Finished creating the folders for the different languages.");
}

createLanguageFolders();

// Render the other templates.
function _renderTemplatesRecursively(inputPath: string, outputPath: string, removeFromStart: number, lang: string) {
    // The files in the directory.
    const files: string[] = fs.readdirSync(inputPath, {withFileTypes: true})
        .filter(item => !item.isDirectory())
        .map(item => item.name);
    
    // The folders in the directory.
    const subDirs: string[] = fs.readdirSync(inputPath, {withFileTypes: true})
        .filter(item => item.isDirectory())
        .map(item => item.name);
    
    // Create the folders in the output directory and call this function recursively.
    for (const dir of subDirs) {
        fs.mkdirSync(`${outputPath}${dir}`);
        _renderTemplatesRecursively(`${inputPath}${dir}/`, `${outputPath}/${dir}`, removeFromStart, lang);
    }

    // Render and save the templates.
    for (let file of files) {
        file = `${inputPath.substring(removeFromStart)}${file}`;

        if (HTML_FILES_TO_IGNORE.includes(file) || (file == SELECT_LANGUAGE_PAGE)) {
            continue;
        }

        const rendered = nunjucks.render(file, { lang: lang });
        fs.writeFileSync(`${outputPath}/${file}`, rendered);
    }
}

function renderOtherTemplates() {
    console.log("Rendering the rest of the templates...");

    for (const lang of LANGUAGE_ABBREVIATIONS) {
        console.log(`Starting to render the templates for the language "${lang}"...`);
        _renderTemplatesRecursively(`${TEMPLATES_FOLDER}/`, `${RENDERED_TEMPLATES_FOLDER}/${lang}`, `${TEMPLATES_FOLDER}/`.length, lang);
        console.log(`Finished rendering the templates for the language "${lang}".`);
    }

    console.log("Finished Rendering the templates.");
}

renderOtherTemplates();

console.log("Finished!");