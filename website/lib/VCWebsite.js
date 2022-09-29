// const fs = require("fs");
// const fsPromises = fs.promises;
// const directusClient = require("./DirectusClient");
// console.log("directusClient", directusClient);
// const liquidjs = require("liquidjs");
import * as vclib from "vc-lib";
// const PrismaDatabase = vclib.PrismaDatabase;
const DirectusDatabase = vclib.DirectusDatabase;
// console.log("PrismaDatabase", PrismaDatabase, PrismaDatabase.constructor.name);
// const prismaDb = new PrismaDatabase();
const directusDb = new DirectusDatabase();
// console.log("Liquid", Liquid);

// const config = {
//   templateDir: "templates"
// };

// const liquidEngine = new liquidjs.Liquid({
//   cache: false,
//   root: config.templateDir + "/pages",
//   layouts: config.templateDir + "/layouts",
//   partials: config.templateDir + "/partials",
//   extname: ".html"
// });

let vcWebsite = {
  // config: config,
  // liquidEngine: liquidEngine,

  getWebPageDataFromRequest(data, req, websiteRoot) {
    console.log("XXX getWebPageDataFromRequest");
    let reqHeaders = req.headers || {};
    let hostname = reqHeaders.host || "";
    // let x_forwarded_for = reqHeaders["x-forwarded-for"] || "";
    console.log("XXX hostname [%s] url [%s]", hostname, req.url);
    let matches;
    if ((matches = hostname.match(/^([0-9\.]+)(:[0-9]+)?$/))) {
      // console.log("XXX A MATCH", hostname);
      data.origHostname = hostname;
      data.origDomain = matches[1];
      hostname = "localhost:3000";
      data.domain = "localhost";
      data.hostname = hostname;
    } else if (
      (matches = hostname.match(/^(.*\.elasticbeanstalk\.com)(:[0-9]+)?$/))
    ) {
      // console.log("XXX B MATCH", hostname);
      data.origHostname = hostname;
      data.origDomain = matches[1];
      hostname = "localhost:3000";
      data.domain = "localhost";
      data.hostname = hostname;
    } else if (
      (matches = hostname.match(/^([_a-zA-Z][_a-zA-Z0-9\.-]*)(:[0-9]+)$/))
    ) {
      // console.log("XXX C MATCH", hostname);
      data.origHostname = hostname;
      data.origDomain = matches[1];
      hostname = "localhost:3000";
      data.hostname = hostname;
      data.domain = "localhost";
    } else {
      // console.log("XXX D MATCH", hostname);
      data.origHostname = hostname;
      data.domain = hostname;
      data.origDomain = hostname;
      data.hostname = hostname;
    }
    // console.log("XXX hostname 2", hostname);
    let url = req.url || "/";
    data.httpVersion = req.httpVersion || "";
    data.method = req.method || "";

    // /_next/data/development/seekers.json?slug=seekers
    // /_next/data/1bYyMFhMYVk9-c9hrc7Ey/seekers.json?slug=seekers
    // http://localhost:3000/_next/data/qoaLaMD4ZZz1Mm_59MJrM/christians.json?slug=christians
    // if (url.match(/_next/)) console.log("NEXT url [%s]", url);
    if ((matches = url.match(/^\/_next\/data\/([^/]+)(.*)\.json(\?.*)?$/))) {
      // console.log("XXX url1 A", url);
      url = matches[2];
      // console.log("XXX url1 B", url);
      if (!url || url === "/index") url = "/";
    } else if ((matches = url.match(/^.*(\/.*)\.json.*?$/))) {
      console.log("XXX url2 A", url);
      url = matches[1];
      console.log("XXX url2 B", url);
      if (!url || url === "/index") url = "/";
    }

    data.url = url;
    if (url && websiteRoot) {
      let re = new RegExp(`^${websiteRoot}\\b`);
      url = url.replace(re, "");
    }
    data.pageHostPath = hostname + (url || "/");
    // console.log("XXX pageHostPath", data.pageHostPath);
    // console.log(
    //   "XXX getWebPageDataFromRequest: pageHostPath [%s]",
    //   data.pageHostPath
    // );
    // data.headers = reqHeaders,
    data.query = req.query || {};
    data.cookies = req.cookies || {};
    // console.log("XXX getWebPageDataFromRequest", data);
  },

  // async getWebPageDataFromDatabase(data, pageHostPath) {
  //   console.log("XXX getWebPageDataFromDatabase BEFORE");
  //   await vcWebsite.getWebPageDataFromAPI(data, pageHostPath); // TEMPORARY
  //   console.log("XXX getWebPageDataFromDatabase AFTER");
  // },

  async getWebPageDataFromDB(dbname, data, pageHostPath) {
    // const db = (dbname === "directus") ? directusDb : prismaDb;
    const db = directusDb;
    if (data.url && data.url.match(/^\/_/)) {
      return;
    }

    data.page = await db.getObject(
      "ws_page",
      { pageHostPath: pageHostPath },
      [ "id", "pageHostPath", "htmlTitle",
        "pageMetaTitle", "pageMetaDescription", "websiteId", "isLoginRequired",
        "pageMetaImage.filename_disk", "pageMetaImage.title", "pageMetaImage.width", "pageMetaImage.height" ] // pageMetaImage.id", "pageMetaImage.filename_download", "pageMetaImage.folder,
    );

    let websiteParams = {};
    let hostPath = "";
    if (!data.page) {
      data.page = {};
      hostPath = data.hostname + "/";
      websiteParams = { hostPath: hostPath };
    } else {
      websiteParams = data.page.websiteId;
    }
    // console.log("page pageHostPath [%s]", data.page?.pageHostPath);
    // console.log("page", JSON.stringify(data.page, null, 2));
    // console.log("XXX websiteParams %j", websiteParams);

    //if (data.page && data.page.websiteId) {
    let website = await db.getObject(
      "ws_website",
      websiteParams,
      [ "domain", "baseUrl", "baseApiUrl", "copyrightName", "htmlTitleSuffix", "twitterCardType", "twitterUsername",
        "links.id", "links.sort", "links.linkType", "links.text", "links.url", "links.newTab",
        // "templates.templateName", "templates.templateText",
        "pages.pageShortName", "pages.pagePath", "pages.isPrimaryNav", "pages.isLoginRequired",
        "favicon.filename_disk", "favicon.title", "favicon.width", "favicon.height", // favicon.id", "favicon.filename_download", "favicon.folder,
        "landscapeLogo.filename_disk", "landscapeLogo.title", "landscapeLogo.width", "landscapeLogo.height", // landscapeLogo.id", "landscapeLogo.filename_download", "landscapeLogo.folder,
        "footerLandscapeLogo.filename_disk", "footerLandscapeLogo.title", "footerLandscapeLogo.width", "footerLandscapeLogo.height" ]
    );
    // console.log("XXX hostname [%s] origDomain [%s]", data.hostname, data.origDomain);
    // console.log("XXX A baseUrl [%s] baseApiUrl [%s]", website.baseUrl, website.baseApiUrl);
    if (website && data.domain !== data.origDomain) {
      website.baseUrl = website.baseUrl.replace(
        data.hostname,
        data.origHostname
      );
      website.baseApiUrl = website.baseApiUrl.replace(
        data.domain,
        data.origDomain
      );
    }
    // console.log("XXX B baseUrl [%s] baseApiUrl [%s]", website.baseUrl, website.baseApiUrl);

    // if (!website && hostname !== "localhost") {
    //   data.hostname = hostname;
    //   data.pageHostPath = hostname + (url || "/");
    //   hostPath = data.hostname + (data.url || "/");
    //   websiteParams =  { hostPath: hostPath };
    //   website = await db.getObject(
    //     "ws_website",
    //     websiteParams,
    //     "domain", "baseUrl", "baseApiUrl", "copyrightName", "htmlTitleSuffix", "twitterCardType", "twitterUsername",
    //       "links.id", "links.sort", "links.linkType", "links.text", "links.url", "links.newTab",
    //       // "templates.templateName", "templates.templateText",
    //       "pages.pageShortName", "pages.pagePath", "pages.isPrimaryNav", "pages.isLoginRequired",
    //       "favicon.filename_disk", "favicon.title", "favicon.width", "favicon.height", // favicon.id", "favicon.filename_download", "favicon.folder,
    //       "landscapeLogo.filename_disk", "landscapeLogo.title", "landscapeLogo.width", "landscapeLogo.height", // landscapeLogo.id", "landscapeLogo.filename_download", "landscapeLogo.folder,
    //       "footerLandscapeLogo.filename_disk", "footerLandscapeLogo.title", "footerLandscapeLogo.width", "footerLandscapeLogo.height"
    //   );
    // }

    data.website = website;
    data.site = { baseUrl: website.baseUrl, baseApiUrl: website.baseApiUrl };
    vcWebsite.makeFooterLinkColumns(data);
    // console.log("website baseUrl [%s]", data.website?.baseUrl);
    // console.log("website", JSON.stringify(data.website, null, 2));
    //}

    if (data.page && data.page.id) {
      data.sections = await db.getObjects(
        "ws_section",
        { pageId: data.page.id },
        [ "id", "sectionType", "sectionTitle", "sectionSubtitle", "sectionText", "sectionText2,templateName",
          "sectionLinkUrl", "sectionLinkText", "sectionLinkNewTab",
          "sectionImage2.filename_disk", "sectionImage.filename_disk", "sectionImage.title", "sectionImage.width", "sectionImage.height", // sectionImage.id", "sectionImage.filename_download", "sectionImage.folder,
          "items.id", "items.itemType", "items.itemTitle", "items.itemTitle2,items.itemSubtitle", "items.itemSubtitle2,items.itemText",
          "items.itemLinkUrl", "items.itemLinkText", "items.itemLinkNewTab",
          "items.itemImage.filename_disk", "items.itemImage.title", "items.itemImage.width", "items.itemImage.height" ] // items.itemImage.id", "items.itemImage.filename_download", "items.itemImage.folder,
      );
      // console.log("sections [%s]", data.sections?.length);
      // console.log("sections", JSON.stringify(data.sections, null, 2));
    }
  },

  // async handleExpressTemplate(req, res, next) {
  //   let data = {};
  //   vcWebsite.getWebPageDataFromRequest(data, req);
  //   // console.log("data", data);
  //   // let hostname = (data.hostname === "localhost:3000") ? data.hostname : "www.virtualchristianity.org";
  //   // if (url === "/test") url = "/";

  //   let url = data.url;
  //   if (url.match(/^\/_+next/)) next();
  //   else {
  //     let pageHostPath = data.hostname + data.url;
  //     try {
  //       await vcWebsite.getWebPageDataFromAPI(data, pageHostPath);
  //     } catch (err) {
  //       next();
  //       // res.send("Error: " + err.message);
  //     }
  //     if (data.page) {
  //       let templateName =
  //         data.page.templateName ||
  //         (!url || url === "/" ? "index" : url.substring(1));
  //       let pathname = config.templateDir + "/pages/" + templateName + ".html";
  //       // console.log("Testing pathname %s", pathname);
  //       try {
  //         await fsPromises.access(pathname);
  //       } catch (err) {
  //         // console.log("Pathname not found. Falling back to index.html");
  //         templateName = "index";
  //         pathname = config.templateDir + "/pages/" + templateName + ".html";
  //       }
  //       let html = await liquidEngine.renderFile(templateName, data);
  //       res.send(html);
  //     } else {
  //       next();
  //     }
  //   }
  // },

  makeFooterLinkColumns(data) {
    let website = data.website;
    if (website) {
      if (!website.footer) website.footer = {};
      let links = website.links;
      if (links && links.length > 0) {
        let columns = [];
        let columnByPageType = {};
        website.footer.columns = columns;
        // console.log("links", links);
        for (let link of links) {
          let column = columnByPageType[link.linkType];
          if (!column) {
            column = {
              heading: link.linkType,
              links: [link]
            };
            columnByPageType[link.linkType] = column;
            columns.push(column);
          } else {
            column.links.push(link);
          }
        }
        // console.log("website.footer.columns", website.footer.columns);
      }
    }
  }
};

module.exports = vcWebsite;
