// export var config = {
//     sysadmin: {
//       "spadkins@gmail.com": 1,
//       "sbobal@gmail.com": 1
//     },
//     apiBaseUrl: "http://localhost",
//     mysql: {
//       connectionLimit : 2,
//       host     : 'localhost',
//       user     : 'sbobal',
//       password : '.dbfoundry7',
//       database : 'id_idmx'
//     },
//     module: {
//       base:           { tables: [ "Session", ], },
//       login:          { tables: [ "User", ], },
//       group:          { tables: [ "Group", "GroupMemb", ], },
//       std:            { tables: [ "Company", "FileVersion", ], },
//       geo:            { tables: [ "GeoCountry", "GeoPostalArea", "GeoState", ], },
//       business_intel: { tables: [ "DCode", "DCodeType", "DDate", "DSeq", ], },
//     },
//     domain: {
//       "localhost":                 { primaryDomain: "idmx.co" },
//       "idmx.co":                   { schemaName: "id_idmx", modules: { base: { schemaName: "id_idmx" }, login: {}, group: {}, std: {}, geo: { schemaName: "id_geo" }, }, },
//       "*.idmx.co":                 { primaryDomain: "idmx.co" },

//       "dbfoundry.com":             { schemaName: "id_dbf",  modules: { base: { schemaName: "id_idmx" }, login: {}, group: {}, std: {}, geo: { schemaName: "id_geo" }, }, },
//       "*.dbfoundry.com":           { primaryDomain: "dbfoundry.com" },

//       "officevision.com":          { schemaName: "id_ov",   modules: { base: { schemaName: "id_idmx" }, login: {}, group: {}, std: {}, geo: { schemaName: "id_geo" }, }, },
//       "*.officevision.com":        { primaryDomain: "officevision.com" },

//       "virtualchristianity.org":   { schemaName: "id_vc",   modules: { base: { schemaName: "id_idmx" }, login: {}, group: {}, std: {}, geo: { schemaName: "id_geo" }, }, },
//       "*.virtualchristianity.org": { primaryDomain: "virtualchristianity.org" },

//       "webcollectr.com":           { schemaName: "id_webc", modules: { base: { schemaName: "id_idmx" }, login: {}, group: {}, std: {}, geo: { schemaName: "id_geo" }, }, },
//       "*.webcollectr.com":         { primaryDomain: "webcollectr.com" },
//     },
//   };


  export var config = {
    sysadmin: {
      "spadkins@gmail.com": 1,
      "sbobal@gmail.com": 1
    },
    apiBaseUrl: "http://localhost",
    mysql: {
      connectionLimit : 2,
      host     : 'localhost',
      user     : 'sbobal',
      password : '.dbfoundry7',
      database : 'instance_db'
    },
    //logtype: "dev",
    // https://codeburst.io/sending-an-email-using-nodemailer-gmail-7cfa0712a799
    // https://myaccount.google.com/lesssecureapps
    nodemailer: {  // transport options
      service: 'gmail',
      auth: {
        user: 'sbobal@gmail.com',
        pass: 'XXXXXX'
      }
    },
    // rootDir: "../root",   // "../root" is the default
    appModule: {
      base:           { tables: [ "Session", "Visitor", "HttpLog", ], },
      login:          { tables: [ "User", ], },
      group:          { tables: [ "Group", "GroupMemb", ], },
      std:            { tables: [ "FileVersion", ], },
      geo:            { tables: [ "GeoCountry", "GeoPostalArea", "GeoState", ], },
      bi:             { tables: [ "DCode", "DCodeType", "DDate", "DMonth", "DSeq", ], },
      message:        { tables: [ "Message", "MessageThread", "MessageUserThread", ], },
      ov:             { tables: [ "Company", "CompanyOffice", "Location", "Person", "PersonEmail", "PersonEvent", "PersonMessage", "PersonMessageControl",
                                  "Project", "ProjectExpense", "ProjectMember", "ProjectTask", "WebDomain" ], },
      vc:             { tables: [ "BibleBook", "BibleChapter", "BibleTranslation", "BibleTranslationChapter", "BibleUserGroupSummary",
                                  "BibleUserTopic", "BibleUserTopicVerse", "BibleUserVerse", "BibleVerseRef", ], },
      // rdfu:           { tables: [ ], },
      sonar:          { tables: [ "SourceAgency", "SdDataset", "Sdv", "Material", "SdvRelationship", "MaterialAssociation" ], },
      cdb:            { tables: [ "Address", "AddressH", "CdbCountry", "CdbPerson", "CdbPersonH", "CdbStateProvince", "ChangeLog", "ChangeOp",
                                  "Child", "ChildH", "Citizenship", "CitizenshipH", "Committee", "CommitteeH", "ContactEmail", "ContactEmailH",
                                  "ContactPhoneNumber", "ContactPhoneNumberH", "DeaconStatus", "DeaconStatusH", "DeaconType", "DeaconTypeH",
                                  "Deanery", "DeaneryH", "DiaconalCourse", "DiaconalCourseH", "DiaconalEducation", "DiaconalEducationH",
                                  "Education", "EducationH", "EmergencyContact","EmergencyContactH", "Ethnicity", "EthnicityH", "Faculty", "FacultyH",
                                  "Honorific", "HonorificH", "Language", "LanguageH", "MarriageAnnulment", "MarriageAnnulmentH",
                                  "Organization", "OrganizationH", "PersonChangeLog", "PersonCommittees", "PersonCommitteesH",
                                  "PersonDeaconStatus", "PersonDeaconStatusH", "PersonLanguage", "PersonLanguageH",
                                  "PersonLeave", "PersonLeaveH", "PersonOrder", "PersonOrderH", "PersonPersonStatus", "PersonPersonStatusH",
                                  "PersonPosition", "PersonPositionH", "PersonRite", "PersonRiteH", "PersonSafeEnvironment", "PersonSafeEnvironmentH",
                                  "PersonStatus", "PersonStatusH", "Position", "PositionH", "PriestlyOrder", "PriestlyOrderH",
                                  "PriestType", "PriestTypeH", "ReportSpec", "Retreat", "RetreatH", "Rite", "RiteH",
                                  "Sacrament", "SacramentH", "SacramentType", "SacramentTypeH", "SafeEnvironment", "SafeEnvironmentH",
                                  "Suffix", "SuffixH", "Title", "TitleH", "VisaType", "VisaTypeH", "CdbFile"], },
    },
    domain: {
      //"localhost": { primaryDomain: "otega.io" },
      //"localhost": { primaryDomain: "clergydb.com" },
      "localhost": { primaryDomain: "dbfoundry.com" },
      "default": {
        schemaName: "instance_db",
        appModules: { base: { schemaName: "id_idmx" }, },
      },
      "idmx.co": {
        schemaName: "id_idmx",
        appModules: { base: { schemaName: "id_idmx" }, login: {}, group: {}, std: {}, geo: { schemaName: "id_geo" }, },
        nodemailerMessageDefaults: { from: 'spadkins@gmail.com', },
        groupSystemType: "PERS"
      },
      "*.idmx.co": { primaryDomain: "idmx.co" },
      "dbfoundry.com": {
        schemaName: "id_dbf",
        appModules: { base: { schemaName: "id_idmx" }, login: {}, group: {}, std: {}, geo: { schemaName: "id_geo" }, },
        nodemailerMessageDefaults: { from: 'spadkins@gmail.com', },
        groupSystemType: "PERS"
      },
      "*.dbfoundry.com": { primaryDomain: "dbfoundry.com" },

      "officevision.com": {
        schemaName: "id_ov",
        appModules: { base: { schemaName: "id_idmx" }, login: {}, group: {}, std: {}, geo: { schemaName: "id_geo" }, message: {}, ov: {}, bi: {}, },
        nodemailerMessageDefaults: { from: 'spadkins@gmail.com', },
        groupSystemType: "PERS"
      },
      "*.officevision.com": { primaryDomain: "officevision.com" },

      "virtualchristianity.org": {
        schemaName: "id_vc",
        appModules: { base: { schemaName: "id_idmx" }, login: {}, group: {}, std: {}, geo: { schemaName: "id_geo" }, message: {}, vc: {}, },
        nodemailerMessageDefaults: { from: 'spadkins@gmail.com', },
        groupSystemType: "PERS"
      },
      "*.virtualchristianity.org": { primaryDomain: "virtualchristianity.org" },

      "webcollectr.com": {
        schemaName: "id_webc",
        appModules: { base: { schemaName: "id_idmx" }, login: {}, group: {}, std: {}, geo: { schemaName: "id_geo" }, },
        nodemailerMessageDefaults: { from: 'spadkins@gmail.com', },
        groupSystemType: "PERS"
      },
      "*.webcollectr.com": { primaryDomain: "webcollectr.com" },

      "rdfuniverse.com": {
        schemaName: "id_rdfu",
        appModules: { base: { schemaName: "id_idmx" }, login: {}, group: {}, std: {}, geo: { schemaName: "id_geo" }, rdfu: {}, },
        nodemailerMessageDefaults: { from: 'spadkins@gmail.com', },
        groupSystemType: "PERS",
      },
      "*.rdfuniverse.com": { primaryDomain: "rdfuniverse.com" },

      "onthecurb.io": {
        schemaName: "id_sonar",
        appModules: { base: { schemaName: "id_idmx" }, login: {}, group: {}, std: {}, geo: { schemaName: "id_geo" }, sonar: {}, },
        nodemailerMessageDefaults: { from: 'spadkins@gmail.com', },
        groupSystemType: "PERS",
      },
      "*.onthecurb.io": { primaryDomain: "onthecurb.io" },

      "otega.io": {
        schemaName: "id_sonar",
        appModules: { base: { schemaName: "id_idmx" }, login: {}, group: {}, std: {}, geo: { schemaName: "id_geo" }, sonar: {}, },
        nodemailerMessageDefaults: { from: 'spadkins@gmail.com', },
        groupSystemType: "PERS",
      },
      "*.otega.io": { primaryDomain: "otega.io" },

      "clergydb.com": {
        schemaName: "id_cdb",
        // schemaName: "clergy_db",
        appModules: { base: { schemaName: "id_idmx" }, login: {}, group: {}, std: {}, cdb: {}, },
        nodemailerMessageDefaults: { from: 'spadkins@gmail.com', },
        groupSystemType: "PERS",
      },
      "*.clergydb.com": { primaryDomain: "clergydb.com" },

      "insight360.online": {
        schemaName: "id_insight",
        appModules: { base: { schemaName: "id_idmx" }, login: {}, group: {}, std: {}, },
        nodemailerMessageDefaults: { from: 'spadkins@gmail.com', },
        groupSystemType: "PERS",
      },
      "*.insight360.online": { primaryDomain: "insight360.online" },
    }
    // TestUtils: {
    //   op: {
    //     BaseDatabase: {
    //       getTableDef: "new",
    //     },
    //     SqlDatabase: {
    //       makeSelectSql: "new",
    //       makeInsertSql: "new",
    //       makeUpdateSql: "new",
    //       makeDeleteSql: "new",
    //     }
    //   }
    // },
  };