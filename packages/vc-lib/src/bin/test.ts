// import { Config } from '../services/Config';
import { ArgvOptionParser } from '../classes/ArgvOptionParser';
import { PrismaDatabase } from '../services/PrismaDatabase';
import { DirectusDatabase } from '../services/DirectusDatabase';
import { DatabaseFileManager } from '../services/DatabaseFileManager';
import { IDatabase } from '../services/IDatabase';
import * as fs from 'fs';
const fsPromises = fs.promises;
// import * as lodash from 'lodash';

// let config = new Config();
let prismaDb: PrismaDatabase = new PrismaDatabase();
let directusDb: DirectusDatabase = new DirectusDatabase();

let appOptionDefs = {
  // op: {
  //   description: "Operations [check,test,update]"
  // },
  table: {
    description: "Restrict the operation to a single table"
  },
  // columns: {
  //   description: "Column names for get"
  // },
  // orderBy: {
  //   description: "orderBy for get"
  // },
  // distinct: {
  //   description: "Distinct for get"
  // },
  // offset: {
  //   description: "Offset for get"
  // },
  // limit: {
  //   description: "Limit for get"
  // },
  uploadDir: {
    description: "Path to the files"
  },
  pathname: {
    description: "Path name for export/import"
  },
  dirname: {
    description: "Directory name (if pathname not given) for export/import"
  },
  filedate: {
    description: "File date (or file tag) (if pathname not given) for export/import"
  },
  fileext: {
    description: "File extension (if pathname not given) for export/import"
  },
  show_sql: {
    description: "Show the SQL statements"
  },
  verbose: {
    description: "Print diagnostic statements"
  }
};

let appOptions = {
  // op: "test",
  table: "",
  // columns: "",
  // orderBy: "",
  // distinct: "",
  // offset: "",
  // limit: "",
  pathname: "",
  uploadDir: "../../api/uploads",
  dirname: "data",
  filedate: "dev",     // "prod" for production
  fileext: "json",
  update: 0,
  show_sql: 0,
  verbose: 1,
  args: [],
};

function printUsage () {
  console.log();
  console.log("Usage: node dist/bin/test.js [--options] <cmd> [<args>]");
  console.log();
  console.log("       node dist/bin/test.js [--options] test        (capture a test of the system state)");
  console.log("       node dist/bin/test.js [--options] check       (check latest snapshot against current system state)");
  console.log("       node dist/bin/test.js [--options] update      (update current system state to the latest snapshot)");
  console.log();
  for (let option in appOptionDefs) {
    let optionDef = appOptionDefs[option];
    console.log("  --%s=<%s>                 ", option, option, optionDef.description);
  }
}

new ArgvOptionParser(appOptions, appOptionDefs);

if (appOptions.filedate && appOptions.dirname) {
  appOptions.dirname = appOptions.dirname + "/" + appOptions.filedate;  // automatically append the tag. "prod" for production.
}
if (appOptions.dirname) {
  try { fs.mkdirSync(appOptions.dirname); }
  catch (err) {}
}

let fmgr = new DatabaseFileManager();

class Main {

  async run () {
    // console.log("appOptions", appOptions);
    let args = appOptions.args;
    let op: string;
    if (args && args.length > 0) {
      op = args[0];
      args.shift();
    }
    else {
      op = "test";
    }
    let table = appOptions.table;
    let matches: any;
    // let columns: string[] = (appOptions.columns ? appOptions.columns.split(/,/) : undefined) as string[];
    let options: any = {};
    if (appOptions.pathname) options.pathname = appOptions.pathname;
    else {
      if (appOptions.dirname) options.dirname = appOptions.dirname;
      if (appOptions.filedate) options.filedate = appOptions.filedate;
      if (appOptions.fileext) options.fileext = appOptions.fileext;
    }

    if (op === "test") {
      await this.test();
    }
    else {
      console.log("ERROR: Unknown op [%s]", op);
      printUsage();
    }
  }

  // DIRECTUS STRUCTURES: npx directus migrate   # COMPARE directus_migrations
  // DATABASE STRUCTURES: npx prisma db pull     # EXCLUDE DIRECTUS TABLES !!!
  // DIRECTUS DATA:       exportFile(directus_*)
  // DIRECTUS FILES:      cp -r ../api/uploads ../directus/prod-files
  async test () {
    // console.log("test");

    let hostPath = "localhost:3000/";
    let pageHostPath = "localhost:3000/";

    // let dPage: any = await directusDb.getObject(
    //   "ws_page",
    //   { pageHostPath: pageHostPath },
    //   ("id,pageHostPath,htmlTitle," +
    //     "pageMetaTitle,pageMetaDescription,websiteId,isLoginRequired," +
    //     "pageMetaImage,pageMetaImage.filename_disk,pageMetaImage.title,pageMetaImage.width,pageMetaImage.height").split(/,/)
    // );
    // console.log("dPage", dPage);

    // let pPage: any = await prismaDb.getObject(
    //   "ws_page",
    //   { pageHostPath: pageHostPath },
    //   ("id,pageHostPath,htmlTitle," +
    //     "pageMetaTitle,pageMetaDescription,websiteId,isLoginRequired," +
    //     // "userCreated.email,userCreated.currentGroup.groupDisplayName," +
    //     "pageMetaImage,pageMetaImage.filename_disk,pageMetaImage.title,pageMetaImage.width,pageMetaImage.height").split(/,/)
    // );
    // console.log("pPage", pPage);

    let websiteParams = { id: 1 };
    // let websiteParams = { id: dPage.websiteId };
    let dWebsite: any = await directusDb.getObject(
      "ws_website",
      websiteParams,
      ("domain,baseUrl,baseApiUrl,copyrightName,htmlTitleSuffix,twitterCardType,twitterUsername," +
        "links.id,links.sort,links.linkType,links.text,links.url,links.newTab," +
        // "templates.templateName,templates.templateText," +
        "pages.pageShortName,pages.pagePath,pages.isPrimaryNav,pages.isLoginRequired," +
        "favicon.filename_disk,favicon.title,favicon.width,favicon.height," + // favicon.id,favicon.filename_download,favicon.folder,
        "landscapeLogo.filename_disk,landscapeLogo.title,landscapeLogo.width,landscapeLogo.height," + // landscapeLogo.id,landscapeLogo.filename_download,landscapeLogo.folder,
        "footerLandscapeLogo.filename_disk,footerLandscapeLogo.title,footerLandscapeLogo.width,footerLandscapeLogo.height").split(/,/)
    );
    console.log("dWebsite", dWebsite);

    let pWebsite: any = await prismaDb.getObject(
      "ws_website",
      websiteParams,
      ("domain,baseUrl,baseApiUrl,copyrightName,htmlTitleSuffix,twitterCardType,twitterUsername," +
        "links.id,links.sort,links.linkType,links.text,links.url,links.newTab," +
        // "templates.templateName,templates.templateText," +
        "pages.pageShortName,pages.pagePath,pages.isPrimaryNav,pages.isLoginRequired," +
        "favicon.filename_disk,favicon.title,favicon.width,favicon.height," + // favicon.id,favicon.filename_download,favicon.folder,
        "landscapeLogo.filename_disk,landscapeLogo.title,landscapeLogo.width,landscapeLogo.height," + // landscapeLogo.id,landscapeLogo.filename_download,landscapeLogo.folder,
        "footerLandscapeLogo.filename_disk,footerLandscapeLogo.title,footerLandscapeLogo.width,footerLandscapeLogo.height").split(/,/)
    );
    console.log("pWebsite", pWebsite);

    // let dPage = { id: 12 };
    // let pPage = { id: 12 };

    // let dSections = await directusDb.getObjects(
    //   "ws_section",
    //   { pageId: dPage.id },
    //   ("id,sectionType,sectionTitle,sectionSubtitle,sectionText,sectionText2," +
    //     "sectionLinkUrl,sectionLinkText,sectionLinkNewTab," +
    //     "sectionImage2.filename_disk,sectionImage.filename_disk,sectionImage.title,sectionImage.width,sectionImage.height," + // sectionImage.id,sectionImage.filename_download,sectionImage.folder,
    //     "items.id,items.itemTitle,items.itemTitle2,items.itemSubtitle,items.itemSubtitle2,items.itemText," +
    //     "items.itemLinkUrl,items.itemLinkText,items.itemLinkNewTab," +
    //     "items.itemImage.filename_disk,items.itemImage.title,items.itemImage.width,items.itemImage.height").split(/,/)
    // );
    // console.log("dSections", dSections);

    // let pSections = await prismaDb.getObjects(
    //   "ws_section",
    //   { pageId: pPage.id },
    //   ("id,sectionType,sectionTitle,sectionSubtitle,sectionText,sectionText2," +
    //     "sectionLinkUrl,sectionLinkText,sectionLinkNewTab," +
    //     "sectionImage2.filename_disk,sectionImage.filename_disk,sectionImage.title,sectionImage.width,sectionImage.height," + // sectionImage.id,sectionImage.filename_download,sectionImage.folder,
    //     "items.id,items.itemTitle,items.itemTitle2,items.itemSubtitle,items.itemSubtitle2,items.itemText," +
    //     "items.itemLinkUrl,items.itemLinkText,items.itemLinkNewTab," +
    //     "items.itemImage.filename_disk,items.itemImage.title,items.itemImage.width,items.itemImage.height").split(/,/)
    // );
    // console.log("pSections", pSections);

  }

}

let main = new Main();
main.run().then(() => {});

