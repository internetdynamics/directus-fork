export var config = {
  sysadmin: {
    "spadkins@gmail.com": 1,
    "sbobal@gmail.com": 1
  },
  apiBaseUrl: "https://idmx.co",
  https: true,
  //logtype: "dev",
  mysql: {
    connectionLimit : 2,
    host     : "host1234",
    user     : "user",
    password : "pass1234",
    database : "instance_db",
  },
  // https://codeburst.io/sending-an-email-using-nodemailer-gmail-7cfa0712a799
  // https://myaccount.google.com/lesssecureapps
  nodemailer: {  // transport options
    host: "email-smtp.us-east-1.amazonaws.com",
    port: 465,
    secure: true,
    auth: {
      user: "XXXXXXXXXXXXXXXXXXXX",
      pass: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    },
    logger: true,
    // debug: true,
  },
  // rootDir: "../root",   // "../root" is the default
  appModule: {
    base:           { tables: [ "Session", "Visitor", "HttpLog", ], },
    login:          { tables: [ "User", ], },
    group:          { tables: [ "Group", "GroupMemb", ], },
    std:            { tables: [ "Company", "FileVersion", ], },
    geo:            { tables: [ "GeoCountry", "GeoPostalArea", "GeoState", ], },
    bi:             { tables: [ "DCode", "DCodeType", "DDate", "DSeq", ], },
    message:        { tables: [ "Message", "MessageThread", "MessageUserThread", ], },
    ov:             { tables: [ "Person", "PersonEmail", "PersonEvent", "PersonMessage", "PersonMessageControl",
                                "Project", "ProjectExpense", "ProjectIssue", "ProjectMember", "ProjectTask", ], },
    vc:             { tables: [ "BibleBook", "BibleChapter", "BibleTranslation", "BibleTranslationChapter", "BibleUserGroupSummary",
                                "BibleUserTopic", "BibleUserTopicVerse", "BibleUserVerse", "BibleVerseRef", ], },
  },
  domain: {
    // "localhost": { primaryDomain: "officevision.com" },

    "default": {
      schemaName: "instance_db",
      appModules: { base: { schemaName: "id_idmx" }, },
    },

    "idmx.co": {
      schemaName: "id_idmx",
      appModules: { base: { schemaName: "id_idmx" }, login: {}, group: {}, std: {}, geo: { schemaName: "id_geo" }, },
      nodemailerMessageDefaults: { from: 'spadkins@gmail.com', },
    },
    "*.idmx.co": { primaryDomain: "idmx.co" },

    "dbfoundry.com": {
      schemaName: "id_dbf",
      appModules: { base: { schemaName: "id_idmx" }, login: {}, group: {}, std: {}, geo: { schemaName: "id_geo" }, },
      nodemailerMessageDefaults: { from: 'spadkins@gmail.com', },
      groupSystemType: "PERS",
    },
    "*.dbfoundry.com": { primaryDomain: "dbfoundry.com" },

    "officevision.com": {
      schemaName: "id_ov",
      appModules: { base: { schemaName: "id_idmx" }, login: {}, group: {}, std: {}, geo: { schemaName: "id_geo" }, },
      nodemailerMessageDefaults: { from: 'spadkins@gmail.com', },
      groupSystemType: "PERS",
    },
    "*.officevision.com": { primaryDomain: "officevision.com" },

    "virtualchristianity.org": {
      schemaName: "id_vc",
      appModules: { base: { schemaName: "id_idmx" }, login: {}, group: {}, std: {}, geo: { schemaName: "id_geo" }, vc: {}, },
      nodemailerMessageDefaults: { from: 'spadkins@gmail.com', },
      groupSystemType: "PERS",
    },
    "*.virtualchristianity.org": { primaryDomain: "virtualchristianity.org" },

    "webcollectr.com": {
      schemaName: "id_webc",
      appModules: { base: { schemaName: "id_idmx" }, login: {}, group: {}, std: {}, geo: { schemaName: "id_geo" }, },
      nodemailerMessageDefaults: { from: 'spadkins@gmail.com', },
      groupSystemType: "PERS",
    },
    "*.webcollectr.com": { primaryDomain: "webcollectr.com" },
  },
};
