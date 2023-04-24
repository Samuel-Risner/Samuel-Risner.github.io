export default {
    /**
     * The folder containing all the templates.
     */
    templatesFolder: "./templates",
    /**
     * When the templates are rendered for being published, they are saved in this folder.
     */
    renderedTemplatesFolder: "./renderedTemplates",
    /**
     * Where the template base files (parents) are. To get the complete path prepend "templatesFolder".
     */
    baseTemplateFolder: "/base",
    /**
     * The folder for the templates which have a special function. To get the complete path prepend "templatesFolder".
     */
    specialTemplatesFolder: "/special",
    /**
     * The folder for the templates that will be used for the page. To get the complete path prepend "templatesFolder".
     */
    normalTemplatesFolder: "/templates"
}
