import fs from "fs";

import express, { Request, Response } from "express";
import nunjucks from "nunjucks";

const PORT = 5000;
const TEMPLATES_FOLDER = "./templates";
const HTML_FILES_TO_IGNORE = ["/base.html"]; // Add the full path to the file after `TEMPLATES_FOLDER`.
const SELECT_LANGUAGE_PAGE = "/select_language.html"; // Same as ^.
const LANGUAGE_ABBREVIATIONS = ["en", "de"];

// create app
const app = express();

// setup nunjucks
nunjucks.configure("templates/", {autoescape: true, express: app, noCache: true});

// static content
app.use("static/", express.static("static/"));

// load templates
function loadFromDir(path: string, removeFromStart: number) {
    /**
     * The files in the directory under `path`. Example: ["file1.html", "file2.html"].
     */
    const files: string[] = fs.readdirSync(path, {withFileTypes: true})
        .filter(item => !item.isDirectory())
        .map(item => item.name);
    
    /**
     * The subdirectorys under `path`. Example: ["subdir1", "subdir2"].
     */
    const subDirs: string[] = fs.readdirSync(path, {withFileTypes: true})
        .filter(item => item.isDirectory())
        .map(item => item.name);
    
    // Calls this function recursively for each subdirectory.
    for (const subDir of subDirs) {
        loadFromDir(`${path}/${subDir}`, removeFromStart);
    }

    // Add the files to the app.
    for (const file of files) {
        /** 
         * The path to the file within the templates folder. Example: "/path/to/the/file.html". Note that the template folder path is not included (`TEMPLATES_FOLDER`).
         */
        const filePath: string = `${path.substring(removeFromStart)}/${file}`;
        
        // Files in the `TEMPLATES_FOLDER` that should not be available to the user.
        if (HTML_FILES_TO_IGNORE.includes(filePath)) {
            continue;
        }

        /**
         * The url for accessing the file. Example for the file "/dir/file.html": "/dir/file".
         */
        let url = filePath.substring(0, filePath.length - 5); // Remove ".html" from the end.
        
        // If the file is an "index.html" file, "index" is removed from the urls end. Example for the url "/dir/index": "/dir/".
        if (file == "index.html") {
            url = url.substring(0, url.length - 5);
        }

        // If the page is the language selection page `SELECT_LANGUAGE_PAGE` it is added as to the app with the url "/".
        if (filePath == SELECT_LANGUAGE_PAGE) {
            app.get("/", (req: Request, res: Response) => {
                res.render(filePath.substring(1), {languages: LANGUAGE_ABBREVIATIONS}); // Remove "/" from the start.
            });
            continue;
        }

        // Adds the page to the app for each abbreviation.
        for (const abbr of LANGUAGE_ABBREVIATIONS) {
            app.get(`/${abbr}${url}`, (req: Request, res: Response) => {
                res.render(filePath.substring(1), { language: abbr, languages: LANGUAGE_ABBREVIATIONS}); // Remove "/" from the start.
            });
        }
    }
}

loadFromDir(TEMPLATES_FOLDER, TEMPLATES_FOLDER.length);

// start the server
app.listen(PORT, () => console.log(`App available on http://localhost:${PORT}`));