import { defineConfig } from "vitepress";
import typedocSidebar from "../api/typedoc-sidebar.json";


const base = "/GithubExtractor/";
const favicon = "logo-mini.png";
const logo = "logo-med-bg.png";
const year = new Date().getFullYear();
const licence = "MIT";



// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "My Docs",
    description: "This is my custom documentation site.",
    base,
    head: [
        ['link', { rel: "icon", type: "image/png", href: `${base}api/media/${favicon}` }]
    ],
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        logo: { src: `/api/media/${logo}`, alt: "GithubExtractor" },
        search: {
            provider: "local",
        },
        outline: {
            level: [2,3],
            label: "Outline"
        },
        aside: true,
        nav: [
            { text: "Home", link: "/" },
            { text: "API", link: "/api/",  },
        ],
        docFooter: {
            prev: false,
            next: false,
        },
        sidebar: [
            {
                text: "API",
                link: "/api/",
                items: typedocSidebar,
                collapsed: false,
            },
        ],
        socialLinks: [
            {
                icon: "github",
                link: "https://github.com/",
                ariaLabel: "Link to the GithubExtractor github repo"
            },
        ],
        footer: {
            message: `Released under the ${licence} License.`,
            copyright: `Copyright © ${year} bn-l`
        },

    },
});