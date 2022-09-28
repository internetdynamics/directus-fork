export var config = {
  sysadmin: {
    "spadkins@gmail.com": 1,
    "sbobal@gmail.com": 1
  },
  port: 80,
  // port: 8100,
  apiBaseUrl: "http://localhost",
  mysql: {
    connectionLimit : 2,
    // debug: true,
    host     : 'localhost',
    // user     : 'root',
    // password : '',
    user     : 'root',
    password : 'dbadmin7',
    // user     : 'dbuser',
    // password : 'dbuser7',
    database : 'instance_db'
  },
  logtype: "dev",
  // https://codeburst.io/sending-an-email-using-nodemailer-gmail-7cfa0712a799
  // https://myaccount.google.com/lesssecureapps
  // nodemailer: {  // transport options
  //   service: 'gmail',
  //   auth: {
  //     user: 'spadkins@gmail.com',
  //     pass: 'unknown'
  //   }
  // },
  nodemailer: {  // transport options
    host: "email-smtp.us-east-1.amazonaws.com",
    port: 465,
    secure: true,
    // port: 587,
    // secure: false,
    auth: {
      // user: "AKIARSPXQRD6LLMTSZ7Q",   // spadkins@gmail.com AWS account
      // pass: "BG4VaUfwT2xQnpfLf1YSCaNCLhXelSr3eeleki4Hztix",
      // AWS IAM User: ses-smtp-user.20210119-150241
      user: "AKIAR7CII72O6WZETP4K",   // hosting@internetdynamics.com AWS account
      pass: "BMmyCS5HUG2/3YB3qQGfTpDd0FODYEQgp5PJvZvqElw8",
    },
    logger: true,
    // debug: true,
  },
  cmd: {
    bold: {
      apikey: "435ff6f1-12bc-4723-a8a1-0c21c649b1cb",
      sftp_host: '161.35.135.212',
      sftp_username: 'thanksagain',
      sftp_password: 'DBB5`"U8zpam4@+D',
    },
    upserve: {
      apikey: "d8585f56522711f3f029e42432885fb0",
      username: "upserve_famous-famiglia",
      password: "zDC5cX9v5yPR",
      airport: "ATL",
      store_name: "Famous Famiglia (D-5)",
      stores: [
        {
          apikey: "d8585f56522711f3f029e42432885fb0",
          username: "upserve_famous-famiglia",
          password: "zDC5cX9v5yPR",
          airport: "ATL",
          store_name: "Famous Famiglia (D-5)"    
        }
      ]
    },
    // Owner: spadkins@internetdynamics.com
    // insight360-adkins-24-99-50-0
    // Adkins Jan 5 2022
    // 24.99.50.0/24
    // 61d5d21da57c20017742cb1e-HIhtAQxnNOIQRWKI8sKpRIh20wr3shPV
    // 61d5fc98897f2001ea58058d-zo6f9d3tEOsxnulsfqcgkXmTx3UkLz0b   (to Cordial prod from spadkins, full IP)
    // insight360-prod-3-90-211-107
    // Prod Jan 5 2022
    // 3.90.211.107
    // 61d5d45fa57c20019600c26b-QNxwljVzSZxdjQfp2vz3RVHyncWfFKcK
    cordial: {
      apikey: "61d5fc98897f2001ea58058d-zo6f9d3tEOsxnulsfqcgkXmTx3UkLz0b",
      sftp_server: "sftp.insight360.online",
      sftp_port: 22,
      sftp_username: "cordial",
      sftp_password: "owfy9732i2jkjse8pwoxc279sdfKD",
      sftp_path: "/uploads",
      // file_dir: "/home/cordial/uploads",
    },
    surveymonkey: {
      apikey: "spRLhLkwFifBdV21Lp3XtcZ3PoqLg85ja.opvJe41-FwLd8dbHLeiZOPPM6jhI6gbMoStuIZDqg7wpUzMAkvZAyFvwVcQOPTMrI8YTgGMe7Edj5IUn-Sj83Bf-1IIGdk",
    },
  },
  // rootDir: "../root",   // "../root" is the default
  appModule: {
    base:           { tables: [ "Session", "Visitor", "HttpLog", ], },
    login:          { tables: [ "User", ], },
    group:          { tables: [ "Group", "GroupMemb", ], },
    std:            { tables: [ "GCache", "FileVersion", "GroupReport", ], },
    geo:            { tables: [ "GeoCountry", "GeoCountyUs", "GeoPostalArea", "GeoPostalAreaUs", "GeoState", "GeoStateUs", ], },
    bi:             { tables: [ "DCode", "DCodeType", "DDate", "DMonth", "DSeq", ], },
    message:        { tables: [ "Message", "MessageThread", "MessageUserThread", ], },
    ov:             { tables: [ "Company", "CompanyOffice", "Location", "Person", "PersonEmail", "PersonEvent", "PersonMessage", "PersonMessageControl",
                                "Project", "ProjectExpense", "ProjectMember", "ProjectTask", "WebDomain", ], },
    vc:             { tables: [ "BibleBook", "BibleChapter", "BibleTranslation", "BibleTranslationChapter", "BibleUserGroupSummary",
                                "BibleUserTopic", "BibleUserTopicVerse", "BibleUserVerse", "BibleVerseRef", ], },
    sonar:          { tables: [ "Agent", "DataQuerySpec", "DataQuerySpecOntology", "DataQuerySpecClass", "DataQuerySpecProperty", "DataQuerySpecMaterial",
                                "EntityLabel", "IriVersion", "Material", "SourceAgency", "SdDataset", "Sdv", "MaterialAssociation", "SdvRelationship",
                                "Representation", "Resource", "ResourceUtilization",
                                "Stage", "StageInvocation", "StageInvocationMaterial", "StagePred",
                                "Turbine", "TurbineInvocation", "TurbineStageUsage", "TurbineStagePred",
                                "OwlOntology", "OwlClass", "OwlProperty", "OwlIndividual", "OwlValues", "OwlClassMembership", 
                              ], },
    cdb:            { tables: [ "Address", "AddressH", "CdbCountry", "CdbFile", "CdbPerson", "CdbPersonH", "CdbStateProvince", "ChangeLog", "ChangeOp",
                                "Child", "ChildH", "Citizenship", "CitizenshipH", "Committee", "CommitteeH", "ContactEmail", "ContactEmailH",
                                "ContactPhoneNumber", "ContactPhoneNumberH", "DeaconStatus", "DeaconStatusH", "DeaconType", "DeaconTypeH",
                                "Deanery", "DeaneryH", "DiaconalCourse", "DiaconalCourseH", "DiaconalEducation", "DiaconalEducationH",
                                "Education", "EducationH", "EmergencyContact","EmergencyContactH", "Ethnicity", "EthnicityH",
                                "Faculty", "FacultyH", "Honorific", "HonorificH", "Language", "LanguageH", "MarriageAnnulment", "MarriageAnnulmentH",
                                "Organization", "OrganizationH", "PersonChangeLog", "PersonCommittees", "PersonCommitteesH", 
                                "PersonDeaconStatus", "PersonDeaconStatusH", "PersonLanguage", "PersonLanguageH", 
                                "PersonLeave", "PersonLeaveH", "PersonOrder", "PersonOrderH", "PersonPersonStatus", "PersonPersonStatusH",
                                "PersonPosition", "PersonPositionH", "PersonRite", "PersonRiteH", "PersonSafeEnvironment", "PersonSafeEnvironmentH",
                                "PersonStatus", "PersonStatusH", "Position", "PositionH", "PriestlyOrder", "PriestlyOrderH",
                                "PriestType", "PriestTypeH", "ReportSpec", "Retreat", "RetreatH", "Rite", "RiteH",
                                "Sacrament", "SacramentH", "SacramentType", "SacramentTypeH", "SafeEnvironment", "SafeEnvironmentH",
                                "Suffix", "SuffixH", "Title", "TitleH", "VisaType", "VisaTypeH", ], },
    insight:        { tables: [ "AirCarrier", "AirportCarrierMonth", "AirportStoreMonth", "AirportYear", "LPMember", "TADCard", "TADRewardProgram", "TAFRedemption", "DDate",
                                "AirCarrierBts", "AirportDate", "AirportSurvey", "CarRentalCompany", "LPPCN", "TADEarnRule", "TADSubgroup", "TAFReferral",
                                "AirCarrierDot", "AirportDateUplift", "AirportSurveyQuestion", "GroupDashboard", "LPPCNID", "TADMarketingAction", "TAFAccrual", "TAFSurvey",
                                "AirFlightLeg", "AirportHour", "AirportSurveyQuestionAnswer", "LPAirportMember", "LPPurchaseTransaction", "TADMarketingCampaign", "TAFAirportMember", "TAFSurveyAnswer",
                                "AirFlightLegHist", "AirportMonth", "AirportSurveyQuestionResponse", "LPArea", "LPState", "TADMarketingPromotion", "TAFAirportMerchantMember", "TALoadControl",
                                "AirScheduledFlight", "AirportPostalRegion", "AirportSurveyQuestionUsage", "LPAreaMemb", "LPStore", "TADMember", "TAFEnrollment",
                                "Airport", "AirportStore", "AirportSurveyResponse", "LPBrand", "LPStoreAssign", "TADMerchant", "TAFMemberMonthStats",
                                "AirportCarRental", "AirportStoreAfb", "AirportSurveySummaryResponse", "LPCard", "LPSubArea", "TADMerchantEarnRule", "TAFMemberStats",
                                "AirportCarRentalMonth", "AirportStoreDate", "AirportSurveyUsage", "LPCity", "LPSubSubArea", "TADMerchantId", "TAFMerchantHistory",
                                "AirportCarrierDate", "AirportStoreH", "AirportTerminal", "LPCountry", "LPTrait", "TADQuestion", "TAFMerchantSubgroup",
                                "AirportCarrierLegMonth", "AirportStoreLease", "AirportTerminalDate", "LPFranchise", "RegionDate", "TADResponse", "TAFMessage",
                                "AirportCarrierMarketMonth", "AirportStoreMerchant", "AirportTerminalMonth", "LPLatLong", "TADAirport", "TADReward", "TAFPurchaseTransaction", "AircraftType",
                                "AirportCarrierFc", "AirportCarrierLeg", "AirportCarrierLegMonthFc", "AirportCarrierLegSeas", "AirportCarrierMonthSeas", "AirportFc", "AirportMonthSeas",
                                "BoldAirportMember", "BoldMember", "BoldPartner", "BoldPurchaseTransaction", "BoldTransaction",
                                "Company", "DCode"], },
  },

  domain: {
    // "localhost": { primaryDomain: "sonar.otega.io" },
    // "localhost": { primaryDomain: "onthecurb.io" },
    // "localhost": { primaryDomain: "dbfoundry.com" },
    // "localhost": { primaryDomain: "virtualchristianity.org" },
    // "localhost": { primaryDomain: "officevision.com" },
    // "localhost": { primaryDomain: "clergydb.com" },
    "localhost": { primaryDomain: "insight360.online" },

    "default": {
      schemaName: "instance_db",
      appModules: { base: { schemaName: "id_idmx" }, },
      apiModules: { static: { disabled: true }, },
    },

    "idmx.co": {
      schemaName: "id_idmx",
      appModules: { base: { schemaName: "id_idmx" }, login: {}, group: {}, std: {}, geo: { schemaName: "id_geo" }, },
      apiModules: { static: { extensions: ["html", "index.html"] }, },
      nodemailerMessageDefaults: { from: 'spadkins@gmail.com', },
      groupSystemType: "PERS",
    },
    "*.idmx.co": { primaryDomain: "idmx.co" },

    "dbfoundry.com": {
      schemaName: "id_dbf",
      appModules: { base: { schemaName: "id_idmx" }, login: {}, group: {}, std: {}, geo: { schemaName: "id_geo" }, },
      apiModules: { static: { extensions: ["html", "index.html"] }, },
      nodemailerMessageDefaults: { from: 'spadkins@gmail.com', },
      groupSystemType: "PERS",
    },
    "*.dbfoundry.com": { primaryDomain: "dbfoundry.com" },

    "officevision.com": {
      schemaName: "id_ov",
      appModules: { base: { schemaName: "id_idmx" }, login: {}, group: {}, std: {}, geo: { schemaName: "id_geo" }, ov: {}, bi: {}, message: {}, },
      apiModules: { static: { extensions: ["html", "index.html"] }, },
      nodemailerMessageDefaults: { from: 'spadkins@gmail.com', },
      groupSystemType: "PERS",
    },
    "*.officevision.com": { primaryDomain: "officevision.com" },

    "virtualchristianity.org": {
      schemaName: "id_vc",
      appModules: { base: { schemaName: "id_idmx" }, login: {}, group: {}, std: {}, geo: { schemaName: "id_geo" }, ov: {}, vc: {}, message: {}, },
      apiModules: { static: { extensions: ["html", "index.html"] }, },
      nodemailerMessageDefaults: { from: 'spadkins@gmail.com', },
      groupSystemType: "PERS",
      // baseUrl: "http://localhost:8100",
      // logoSquareUrl: "http://localhost:8100/assets/images/logo-transp-160x160.png",
      // logoSquarePathname: "clergydb.com/www/assets/images/logo-transp-160x160.png",
      appName: "Virtual Christianity",
      copyright: "© 2021 Internet Dynamics. All rights reserved.",
    },
    "*.virtualchristianity.org": { primaryDomain: "virtualchristianity.org" },

    "webcollectr.com": {
      schemaName: "id_webc",
      appModules: { base: { schemaName: "id_idmx" }, login: {}, group: {}, std: {}, geo: { schemaName: "id_geo" }, },
      apiModules: { static: { extensions: ["html", "index.html"] }, },
      nodemailerMessageDefaults: { from: 'spadkins@gmail.com', },
      groupSystemType: "PERS",
    },
    "*.webcollectr.com": { primaryDomain: "webcollectr.com" },

    "rdfuniverse.com": {
      schemaName: "id_rdfu",
      appModules: { base: { schemaName: "id_idmx" }, login: {}, group: {}, std: {}, geo: { schemaName: "id_geo" }, },
      apiModules: { static: { extensions: ["html", "index.html"] }, },
      nodemailerMessageDefaults: { from: 'spadkins@gmail.com', },
      groupSystemType: "PERS",
    },
    "*.rdfuniverse.com": { primaryDomain: "rdfuniverse.com" },

    "onthecurb.io": {
      schemaName: "id_sonar",
      appModules: { base: { schemaName: "id_idmx" }, login: {}, group: {}, std: {}, geo: { schemaName: "id_geo" }, sonar: {}, },
      apiModules: { static: {}, },
      nodemailerMessageDefaults: { from: 'spadkins@gmail.com', },
      // groupSystemType: "PERS",
      // baseUrl: "http://localhost:8100",
      // logoSquareUrl: "http://localhost:8100/assets/images/logo-transp-160x160.png",
      // logoSquarePathname: "clergydb.com/www/assets/images/logo-transp-160x160.png",
      // appName: "Sonar",
      // copyright: "© 2021 On the Curb. All rights reserved.",
    },
    "*.onthecurb.io": { primaryDomain: "onthecurb.io" },

    "sonar.otega.io": {
      schemaName: "id_sonar",
      appModules: { base: { schemaName: "id_idmx" }, login: {}, group: {}, std: {}, geo: { schemaName: "id_geo" }, sonar: {}, },
      apiModules: { static: { extensions: ["html", "index.html"] }, sonar: {}, },
      nodemailerMessageDefaults: { from: 'spadkins@gmail.com', },
      // groupSystemType: "PERS",
      // baseUrl: "http://localhost:8100",
      // logoSquareUrl: "http://localhost:8100/assets/images/logo-transp-160x160.png",
      // logoSquarePathname: "clergydb.com/www/assets/images/logo-transp-160x160.png",
      appName: "Sonar",
      copyright: "© 2021 On the Curb. All rights reserved.",
    },
    "otega.io": {
      schemaName: "id_sonar",
      appModules: { base: { schemaName: "id_idmx" }, login: {}, group: {}, std: {}, geo: { schemaName: "id_geo" }, sonar: {}, },
      nodemailerMessageDefaults: { from: 'spadkins@gmail.com', },
      // groupSystemType: "PERS",
      // baseUrl: "http://localhost:8100",
      // logoSquareUrl: "http://localhost:8100/assets/images/logo-transp-160x160.png",
      // logoSquarePathname: "clergydb.com/www/assets/images/logo-transp-160x160.png",
      appName: "Sonar",
      copyright: "© 2021 On the Curb. All rights reserved.",
    },
    "*.otega.io": { primaryDomain: "otega.io" },

    "clergydb.com": {
      // schemaName: "id_cdb",
      schemaName: "clergy_db",
      appModules: { base: { schemaName: "id_idmx" }, login: {}, group: {}, std: {}, cdb: {}, page: {}, },
      apiModules: { static: { extensions: ["html", "index.html"] }, },
      nodemailerMessageDefaults: { from: 'no-reply@clergydb.com', },
      // groupSystemType: "PERS",
      baseUrl: "http://localhost:8100",
      apiBaseUrl: "http://localhost",
      logoSquareUrl: "http://localhost:8100/assets/images/logo-transp-160x160.png",
      logoSquarePathname: "clergydb.com/www/assets/images/logo-transp-160x160.png",
      appName: "Clergy DB",
      copyright: "© 2022 DBFoundry. All rights reserved.",
    },
    "*.clergydb.com": { primaryDomain: "clergydb.com" },

    "insight360.online": {
      schemaName: "insight360",
      appModules: { base: { schemaName: "id_idmx" }, login: { schemaName: "insight360" }, group: { schemaName: "insight360" }, std: {}, insight: {}, bi: {} },
      apiModules: { static: { extensions: ["html", "index.html"] }, },
      nodemailerMessageDefaults: { from: 'spadkins@gmail.com', },
      groupSystemType: "PERS",
    },
    "*.insight360.online": { primaryDomain: "insight360.online" },
  },
  TestUtils: {
    op: {
      // BaseDatabase: {
      //   getTableDef: "new",
      // },
      SqlDatabase: {
        getTableDef: "new",
        makeSelectSql: "new",
        makeInsertSql: "new",
        makeUpdateSql: "new",
        makeDeleteSql: "new",
      }
    }
  },
};
