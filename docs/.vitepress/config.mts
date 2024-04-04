import { defineConfig } from "vitepress";
import typedocSidebar from "../api/typedoc-sidebar.json";
import packageConfig from "../../scripts/getConfig.mjs";
import path from "node:path";


const { longName, repoUrl, description, license, summary, tagline } = packageConfig;

const parsedUrl = new URL(repoUrl);
const lastPart = path.basename(parsedUrl.pathname).replace(".git", "");

const base = "/" + lastPart + "/";
const favicon = "logo-48.png";
const logo = "logo-205.png";
const heroImage = "logo-2048.webp";
const year = new Date().getFullYear();

const heroActions = [
    { theme: 'brand', text: 'API Docs', link: '/api/GithubExtractor/' },
    { theme: 'alt', text: 'Quickstart', link: '/quickstart.md' },
    { theme: 'alt', text: 'Github', link: repoUrl },
    { theme: 'alt', text: 'CLI', link: "./cli" },
];


const features = [
    {
        "icon": "🤔",
        "title": "Selective",
        "details": "Download whole repos or individual files. Select using globs or multiple paths."
    },
    {
        "icon": "🤓",
        "title": "Fast",
        "details": "Doesn't download the whole repo for just a few files, and ~200% faster than clone depth=1 for a whole repo."
    },
    {
        "icon": "🐇",
        "title": "Learn more",
        "linkText": "Get started",
        "link": "./quickstart"
    }
]


// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: longName,
    description,
    base,
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        logo: { src: `/${logo}`, alt: longName },
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
            { text: "API", link: "/api/index/",  },
            { text: "CLI", link: "/cli",  },
        ],
        docFooter: {
            prev: false,
            next: false,
        },
        sidebar: [
            {
                text: "API",
                link: "/api/index/",
                items: typedocSidebar,
                collapsed: false,
            },
            {
                text: "Quickstart",
                link: "/quickstart",
            },
            {
                text: "CLI",
                link: "/cli",
            },
        ],
        socialLinks: [
            {
                icon: "github",
                link: repoUrl,
                ariaLabel: `Link to the ${longName} github repo`
            },
        ],
        footer: {
            message: `Released under the ${license} License.`,
            copyright: `Copyright © ${year} bn-l`
        },
    },
    // https://vitepress.dev/reference/site-config#transformpagedata
    // don't mutate siteConfig
    transformPageData(pageData, { siteConfig }) {
        if(pageData.frontmatter.layout === "home") {
            pageData.frontmatter = {
                ...pageData.frontmatter,
                hero: {
                    name: longName,
                    text: summary,
                    tagline,
                    image: {
                        src: `/${heroImage}`,
                        alt: longName
                    },
                    actions: heroActions
                },
                features
            };
        }
    },
    head: [
        ['link', { rel: "icon", type: "image/png", href: base + favicon }],
        [
          'script',
          { async: '', src: `https://www.googletagmanager.com/gtag/js?id=G-C50L7SYJ2S` }
        ],
        [
          'script',
          {},
          `window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-C50L7SYJ2S');`
        ]
    ]
});