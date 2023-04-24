import fs from "fs";

import express, { Request, Response } from "express";
import nunjucks from "nunjucks";

import { settings } from "./settings.js";

// Create app:
const app = express();

// Setup nunjucks:
nunjucks.configure(settings.templates.templatesFolder, {autoescape: true, express: app, noCache: true});

// Setup static content:
app.use(settings.static.staticVirtualPrefix, express.static(settings.static.staticFolder));

const languageData = JSON.parse(fs.readFileSync(settings.otherPaths.pathTranslationFile, { encoding:"utf-8" }));

/**
 * Translates the passed path into another language.
 * @param path The path that is to be translated (it should start with a "/" but not end with a "/", examples: "/" -> OK; "file" -> NOT ok; "/file" -> OK; "/file/" -> NOT ok).
 * @param languageAbbreviation Tha language abbreviation into which the path will be translated.
 * @returns The translated path (or not translated at all if no translation exists or only partially translated if the translation stopped).
 */
function getTranslationForPath(path: string, languageAbbreviation: string): string {
    /**
     * The translation data for the abbreviation.
     */
    const dataForAbbreviation = languageData[languageAbbreviation];
    // If no translation data exists the path is returned unchanged:
    if (dataForAbbreviation === undefined) {
        console.error(`There is no data for the abbreviation: "${languageAbbreviation}"!`);
        return path;
    }

    // If the language should not have any translations at all:
    if (dataForAbbreviation["index"] === "#") {
        console.log("foo");
        return path;
    }

    /**
     * The path is split into its sup-paths.
     */
    const pathParts = path.split("/");
    /**
     * The new path starts with a "/", just like the old one. The "/" is set instead of "" to prevent unnecessary checks in the for loop.
     */
    let newPath = "/";

    /**
     * When a translation was not completed (either because of missing data or because it does not matter) this function is used to complete the path with the remaining non-translated parts of "pathParts".
     * @param skipFrom The index from which the non-translated parts should be used.
     * @returns The finished path.
     */
    function skip(skipFrom: number): string {
        return `${newPath}${pathParts.slice(skipFrom).join("/")}`;
    }

    /**
     * The next part in the translation data needed for translating the next part.
     */
    let progressData = dataForAbbreviation;

    // Translate the path: ("i" starts at 1, so that the leading "" is skipped, by doing this a check can be ignored.)
    for (let i = 1; i < pathParts.length; i++) {
        /**
         * The part which is to be translated.
         */
        const part = pathParts[i];

        /**
         * The data for translating the part.
         */
        let newPart = progressData[part];

        // No data exists for this part. The translation is cancelled.
        if (newPart === undefined) {
            console.error(`There is no corresponding path for the path: "${path}" and the language: "${languageAbbreviation}"!`);
            return skip(i);
        }

        // Save the next part in the translation data for the next iteration:
        progressData = newPart;
        // Get the translation for the part:
        newPart = newPart["index"];

        // No translation exists for this part. The translation is cancelled.
        if (newPart === undefined) {
            console.error(`There is no corresponding path for the path: "${path}" and the language: "${languageAbbreviation}"!`);
            return skip(i);
        }

        // If the translation is a "#" it means, that no translation should be used and that the rest of the path should be the same as the passed one. The translation is cancelled.
        if (newPart === "#") {
            return skip(i);
        }

        // Increase the translated path with the translated part:
        newPath += `${newPart}/`;

    }

    // Return the translated path without the trailing "/".
    return newPath.substring(0, newPath.length - 1);
}

/**
 * 
 * @param path Should start with "./"
 * @param removeFromStart 
 */
function loadPageFiles(path: string, removeFromStart: number) {
    /**
     * The files in the directory under "path". Example: ["file0.html", "file1.html", "file2.html"].
     */
    const files: string[] = fs.readdirSync(path, {withFileTypes: true})
        .filter(item => !item.isDirectory())
        .map(item => item.name);
    
    /**
     * The subdirectories under "path". Example: ["subdirectory0", "subdirectory1", "subdirectory2"].
     */
    const subDirs: string[] = fs.readdirSync(path, {withFileTypes: true})
        .filter(item => item.isDirectory())
        .map(item => item.name);
    
    // Calls this function recursively for each subdirectory:
    for (const subDir of subDirs) {
        loadPageFiles(`${path}${subDir}/`, removeFromStart);
    }

    // Add the files to the app:
    for (const file of files) {
        /** 
         * The path to the file within the templates folder. Example: "/path/to/the/file.html". Note that the template folder path is not included ("settings.templates.templatesFolder"). The -1 is there because of the "." in "path".
         */
        const filePath: string = `${path.substring(removeFromStart - 1)}${file}`;
        
        /**
         * The url for accessing the file. Example for the file "/dir/file.html": "/dir/file".
         */
        let url = filePath.substring(0, filePath.length - 5); // Remove ".html" from the end.

        // Adds the page to the app for each abbreviation.
        for (const abbr of settings.temp.languageAbbreviations) {
            // If the file is an "index.html" file, "index" is removed from the urls end. Example for the url "/dir/index": "/dir/".
            if (file === "index.html") {
                                                        // Remove "/index" from the end.     // Add the trailing "/" again.
                url = `${getTranslationForPath(url = url.substring(0, url.length - 6), abbr)}/`;
            } else {
                url = getTranslationForPath(url, abbr);
            }

            console.log(`>>> /${abbr}${url}`);

            app.get(`/${abbr}${url}`, (req: Request, res: Response) => {
                res.render(`${settings.templates.normalTemplatesFolder.substring(1)}${filePath}`, { language: abbr, languages: settings.temp.languageAbbreviations});
            });
        }
    }
}

// /**
//  * 
//  * @param path 
//  * @param removeFromStart 
//  */
// function loadFromDir(path: string, removeFromStart: number) {
//     /**
//      * The files in the directory under `path`. Example: ["file1.html", "file2.html"].
//      */
//     const files: string[] = fs.readdirSync(path, {withFileTypes: true})
//         .filter(item => !item.isDirectory())
//         .map(item => item.name);
    
//     /**
//      * The subdirectorys under `path`. Example: ["subdir1", "subdir2"].
//      */
//     const subDirs: string[] = fs.readdirSync(path, {withFileTypes: true})
//         .filter(item => item.isDirectory())
//         .map(item => item.name);
    
//     // Calls this function recursively for each subdirectory.
//     for (const subDir of subDirs) {
//         loadFromDir(`${path}${subDir}/`, removeFromStart);
//     }

//     // Add the files to the app.
//     for (const file of files) {
//         /** 
//          * The path to the file within the templates folder. Example: "/path/to/the/file.html". Note that the template folder path is not included (`TEMPLATES_FOLDER`).
//          */
//         const filePath: string = `${path.substring(removeFromStart)}${file}`;
        
//         // Files in the `TEMPLATES_FOLDER` that should not be available to the user.
//         if (HTML_FILES_TO_IGNORE.includes(filePath)) {
//             continue;
//         }

//         /**
//          * The url for accessing the file. Example for the file "/dir/file.html": "/dir/file".
//          */
//         let url = filePath.substring(0, filePath.length - 5); // Remove ".html" from the end.
        
//         // If the file is an "index.html" file, "index" is removed from the urls end. Example for the url "/dir/index": "/dir/".
//         if (file == "index.html") {
//             url = url.substring(0, url.length - 5);
//         }

//         // If the page is the language selection page `SELECT_LANGUAGE_PAGE` it is added as to the app with the url "/".
//         if (filePath == SELECT_LANGUAGE_PAGE) {
//             app.get("/", (req: Request, res: Response) => {
//                 res.render(filePath, {languages: LANGUAGE_ABBREVIATIONS}); // Remove "/" from the start.
//             });
//             continue;
//         }

//         // Adds the page to the app for each abbreviation.
//         for (const abbr of LANGUAGE_ABBREVIATIONS) {
//             app.get(`/${abbr}${url}`, (req: Request, res: Response) => {
//                 res.render(filePath, { language: abbr, languages: LANGUAGE_ABBREVIATIONS}); // Remove "/" from the start.
//             });
//         }
//     }
// }

loadPageFiles(`${settings.templates.templatesFolder}${settings.templates.normalTemplatesFolder}/`, `${settings.templates.templatesFolder}${settings.templates.normalTemplatesFolder}/`.length);

// // start the server
app.listen(settings.server.port, () => console.log(`App available on http://localhost:${settings.server.port}`));

// console.log(getLanguagePathForPath("/test", "en"));
// console.log(getLanguagePathForPath("/test2", "de"));
// // console.log(getLanguagePathForPath("/test2/u", "de"));
// // console.log(getLanguagePathForPath("/test2/u/v", "de"));
// // console.log(getLanguagePathForPath("/test2/u/w", "de"));
// console.log(getLanguagePathForPath("/test2/u/w/x/y/z", "de"));
// console.log(getLanguagePathForPath("/test3", "gg"));
