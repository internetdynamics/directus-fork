DROP TABLE IF EXISTS `ws_link`;


CREATE TABLE `ws_link` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `status` varchar(255) NOT NULL DEFAULT 'draft',
  `sort` int(11) DEFAULT NULL,
  `user_created` char(36) DEFAULT NULL,
  `date_created` timestamp NULL DEFAULT NULL,
  `user_updated` char(36) DEFAULT NULL,
  `date_updated` timestamp NULL DEFAULT NULL,
  `groupId` int(10) unsigned DEFAULT NULL,
  `websiteId` int(10) unsigned DEFAULT NULL,
  `linkType` varchar(255) DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  `text` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ws_link_user_created_foreign` (`user_created`),
  KEY `ws_link_user_updated_foreign` (`user_updated`),
  KEY `ws_link_groupid_foreign` (`groupId`),
  KEY `ws_link_websiteid_foreign` (`websiteId`),
  CONSTRAINT `ws_link_groupid_foreign` FOREIGN KEY (`groupId`) REFERENCES `group` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ws_link_user_created_foreign` FOREIGN KEY (`user_created`) REFERENCES `directus_users` (`id`),
  CONSTRAINT `ws_link_user_updated_foreign` FOREIGN KEY (`user_updated`) REFERENCES `directus_users` (`id`),
  CONSTRAINT `ws_link_websiteid_foreign` FOREIGN KEY (`websiteId`) REFERENCES `ws_website` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;






LOCK TABLES `ws_link` WRITE;

INSERT INTO `ws_link` VALUES
(1,'published',NULL,'2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-06-22 03:24:35',NULL,NULL,NULL,1,'Social','https://www.instagram.com/virtual_christianity/','Instagram'),
(2,'published',NULL,'2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-06-22 03:24:35',NULL,NULL,NULL,1,'Social','https://facebook.com/virtualchristianity','Facebook'),
(3,'published',NULL,'2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-06-22 03:24:35',NULL,NULL,NULL,1,'Social','https://twitter.com/V_Christianity/','Twitter'),
(4,'published',NULL,'2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-06-22 03:24:35',NULL,NULL,NULL,1,'Legal','https://www.virtualchristianity.org/terms','Terms of Use'),
(5,'published',NULL,'2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-06-22 03:24:35',NULL,NULL,NULL,1,'Legal','https://www.virtualchristianity.org/privacy','Privacy Policy');

UNLOCK TABLES;





DROP TABLE IF EXISTS `ws_page`;


CREATE TABLE `ws_page` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `status` varchar(255) NOT NULL DEFAULT 'draft',
  `sort` int(11) DEFAULT NULL,
  `user_created` char(36) DEFAULT NULL,
  `date_created` timestamp NULL DEFAULT NULL,
  `user_updated` char(36) DEFAULT NULL,
  `date_updated` timestamp NULL DEFAULT NULL,
  `pageShortName` varchar(255) DEFAULT NULL,
  `pageMetaTitle` varchar(255) DEFAULT NULL,
  `pageMetaDescription` text DEFAULT NULL,
  `pageMetaImage` char(36) DEFAULT NULL,
  `htmlTitle` varchar(255) DEFAULT NULL,
  `websiteId` int(10) unsigned DEFAULT NULL,
  `pagePath` varchar(255) DEFAULT NULL,
  `pageHostPath` varchar(255) DEFAULT NULL,
  `isPrimaryNav` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `ws_page_user_created_foreign` (`user_created`),
  KEY `ws_page_user_updated_foreign` (`user_updated`),
  KEY `ws_page_pagemetaimage_foreign` (`pageMetaImage`),
  KEY `ws_page_websiteid_foreign` (`websiteId`),
  CONSTRAINT `ws_page_pagemetaimage_foreign` FOREIGN KEY (`pageMetaImage`) REFERENCES `directus_files` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ws_page_user_created_foreign` FOREIGN KEY (`user_created`) REFERENCES `directus_users` (`id`),
  CONSTRAINT `ws_page_user_updated_foreign` FOREIGN KEY (`user_updated`) REFERENCES `directus_users` (`id`),
  CONSTRAINT `ws_page_websiteid_foreign` FOREIGN KEY (`websiteId`) REFERENCES `ws_website` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8;






LOCK TABLES `ws_page` WRITE;

INSERT INTO `ws_page` VALUES
(1,'published',0,'2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-06-21 22:39:47','2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-07-02 03:26:24','Home','Virtual Christianity','Grow in Christ with people online you can trust','6f0a2acf-23f6-463a-a19d-314bc4f0306d','Home',1,'/','localhost:3000/',0),
(2,'published',1,'2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-06-21 22:51:30','2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-07-02 05:45:51','Christians','Christians','Christians','6f0a2acf-23f6-463a-a19d-314bc4f0306d','Christians',1,'/christians','localhost:3000/christians',1),
(3,'published',2,'2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-07-02 01:49:34','2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-07-02 05:45:57','Seekers','Seekers','Seeker is a role in Quidditch.','91394352-27cd-48d2-bfad-f228b9f49ad6','Seekers',1,'/seekers','localhost:3000/seekers',1),
(4,'published',3,'2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-07-02 03:26:24','2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-07-02 05:46:04','Teachers','Teachers','Teachers are great',NULL,'Teachers',1,'/teachers','localhost:3000/teachers',1),
(5,'published',NULL,'2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-07-02 03:26:24','2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-07-02 05:46:10','Groups, Churches, Institutions','Groups, Churches, Institutions',NULL,NULL,'Groups, Churches, Institutions',1,'/groups','localhost:3000/groups',1),
(6,'published',NULL,'2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-07-02 03:26:24','2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-07-02 05:46:15','About Us','About Us',NULL,NULL,NULL,1,'/about-us','localhost:3000/about-us',1),
(7,'published',NULL,'2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-07-02 03:26:24','2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-07-02 05:46:31','Contact',NULL,NULL,NULL,NULL,1,'/contact','localhost:3000/contact',1),
(8,'published',NULL,'2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-07-02 03:26:24','2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-07-02 05:46:36','Donate',NULL,NULL,NULL,NULL,1,'/donation','localhost:3000/donation',1);

UNLOCK TABLES;





DROP TABLE IF EXISTS `ws_section`;


CREATE TABLE `ws_section` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `status` varchar(255) NOT NULL DEFAULT 'draft',
  `sort` int(11) DEFAULT NULL,
  `user_created` char(36) DEFAULT NULL,
  `date_created` timestamp NULL DEFAULT NULL,
  `user_updated` char(36) DEFAULT NULL,
  `date_updated` timestamp NULL DEFAULT NULL,
  `sectionType` varchar(255) DEFAULT NULL,
  `sectionTitle` varchar(255) DEFAULT NULL,
  `sectionSubtitle` varchar(255) DEFAULT NULL,
  `sectionImage` char(36) DEFAULT NULL,
  `sectionText` text DEFAULT NULL,
  `pageId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ws_section_user_created_foreign` (`user_created`),
  KEY `ws_section_user_updated_foreign` (`user_updated`),
  KEY `ws_section_sectionimage_foreign` (`sectionImage`),
  KEY `ws_section_pageid_foreign` (`pageId`),
  CONSTRAINT `ws_section_pageid_foreign` FOREIGN KEY (`pageId`) REFERENCES `ws_page` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ws_section_sectionimage_foreign` FOREIGN KEY (`sectionImage`) REFERENCES `directus_files` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ws_section_user_created_foreign` FOREIGN KEY (`user_created`) REFERENCES `directus_users` (`id`),
  CONSTRAINT `ws_section_user_updated_foreign` FOREIGN KEY (`user_updated`) REFERENCES `directus_users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;






LOCK TABLES `ws_section` WRITE;

INSERT INTO `ws_section` VALUES
(1,'published',NULL,'2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-06-29 02:20:14','2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-06-29 04:46:19','section-hero','Virtual Christianity','Grow in Christ with people online you can trust','a3a4dcad-1f6e-42b5-a582-ab7197d97ec3',NULL,1),
(2,'published',NULL,'2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-06-29 02:20:14','2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-07-02 03:18:15','section-main','Christian Online Learning is our Focus',NULL,'41f3d3f8-4136-4e02-912f-c46ec4e546bf',NULL,1),
(3,'published',NULL,'2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-07-02 01:49:34',NULL,NULL,'section-main','Seekers are Great',NULL,'a1510383-0a3d-406f-ab13-84cf24c84df6',NULL,3);

UNLOCK TABLES;





DROP TABLE IF EXISTS `ws_section_item`;


CREATE TABLE `ws_section_item` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `status` varchar(255) NOT NULL DEFAULT 'draft',
  `sort` int(11) DEFAULT NULL,
  `user_created` char(36) DEFAULT NULL,
  `date_created` timestamp NULL DEFAULT NULL,
  `user_updated` char(36) DEFAULT NULL,
  `date_updated` timestamp NULL DEFAULT NULL,
  `sectionId` int(10) unsigned DEFAULT NULL,
  `itemTitle` varchar(255) DEFAULT NULL,
  `itemSubtitle` varchar(255) DEFAULT NULL,
  `itemText` text DEFAULT NULL,
  `itemImage` char(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ws_section_item_user_created_foreign` (`user_created`),
  KEY `ws_section_item_user_updated_foreign` (`user_updated`),
  KEY `ws_section_item_sectionid_foreign` (`sectionId`),
  KEY `ws_section_item_itemimage_foreign` (`itemImage`),
  CONSTRAINT `ws_section_item_itemimage_foreign` FOREIGN KEY (`itemImage`) REFERENCES `directus_files` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ws_section_item_sectionid_foreign` FOREIGN KEY (`sectionId`) REFERENCES `ws_section` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ws_section_item_user_created_foreign` FOREIGN KEY (`user_created`) REFERENCES `directus_users` (`id`),
  CONSTRAINT `ws_section_item_user_updated_foreign` FOREIGN KEY (`user_updated`) REFERENCES `directus_users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;






LOCK TABLES `ws_section_item` WRITE;

INSERT INTO `ws_section_item` VALUES
(1,'published',NULL,'2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-06-29 02:24:24','2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-07-02 03:18:15',2,'For Christians Who Want To Grow',NULL,'If you want to grow as a Christian, you can use our website to find teachers you can trust and some online courses you can take.\n\n[more ...](/christians)\n\nOr if you want help with a referral to someone near you who can help you in-person to grow in Christ, contact us.','2c1970ce-2c27-4b79-8e7b-35be44c4a2e5'),
(2,'published',NULL,'2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-06-29 02:26:22',NULL,NULL,2,'For Seekers Who Want To Learn About Christianity',NULL,'If you are a seeker or someone who is not a Christian but you want to learn more about Christianity and the Bible, you can use our website to find teachers you can trust who are focused on those particular questions you have.\n\nmore ...\n\nOr if you want help with a referral to someone near you who can help you in-person to learn the Bible, contact us.','bd73801c-1d29-4470-ad94-12133e0f21a4'),
(3,'published',NULL,'2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-07-02 01:49:34',NULL,NULL,3,'Item 1','Item 1 subtitle','This is some cool stuff','3bb82d10-3aa0-4e34-9ac5-7022aecf1b8f'),
(4,'published',NULL,'2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-07-02 01:49:34',NULL,NULL,3,'Item 2',NULL,'Items are totally cool, especially 2.','613b3335-1b42-41f6-bc3b-d6111f1b277b');

UNLOCK TABLES;





DROP TABLE IF EXISTS `ws_website`;


CREATE TABLE `ws_website` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `status` varchar(255) NOT NULL DEFAULT 'draft',
  `sort` int(11) DEFAULT NULL,
  `user_created` char(36) DEFAULT NULL,
  `date_created` timestamp NULL DEFAULT NULL,
  `user_updated` char(36) DEFAULT NULL,
  `date_updated` timestamp NULL DEFAULT NULL,
  `groupId` int(10) unsigned DEFAULT NULL,
  `domain` varchar(255) DEFAULT NULL,
  `baseUrl` varchar(255) DEFAULT NULL,
  `baseApiUrl` varchar(255) DEFAULT NULL,
  `htmlTitleSuffix` varchar(255) DEFAULT NULL,
  `twitterCardType` varchar(255) DEFAULT NULL,
  `twitterUsername` varchar(255) DEFAULT NULL,
  `favicon` char(36) DEFAULT NULL,
  `landscapeLogo` char(36) DEFAULT NULL,
  `hostPath` varchar(255) DEFAULT NULL,
  `copyrightName` varchar(255) DEFAULT NULL,
  `footerLandscapeLogo` char(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ws_website_user_created_foreign` (`user_created`),
  KEY `ws_website_user_updated_foreign` (`user_updated`),
  KEY `ws_website_groupid_foreign` (`groupId`),
  KEY `ws_website_favicon_foreign` (`favicon`),
  KEY `ws_website_landscapelogo_foreign` (`landscapeLogo`),
  KEY `ws_website_footerlandscapelogo_foreign` (`footerLandscapeLogo`),
  CONSTRAINT `ws_website_favicon_foreign` FOREIGN KEY (`favicon`) REFERENCES `directus_files` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ws_website_footerlandscapelogo_foreign` FOREIGN KEY (`footerLandscapeLogo`) REFERENCES `directus_files` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ws_website_groupid_foreign` FOREIGN KEY (`groupId`) REFERENCES `groups` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ws_website_landscapelogo_foreign` FOREIGN KEY (`landscapeLogo`) REFERENCES `directus_files` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ws_website_user_created_foreign` FOREIGN KEY (`user_created`) REFERENCES `directus_users` (`id`),
  CONSTRAINT `ws_website_user_updated_foreign` FOREIGN KEY (`user_updated`) REFERENCES `directus_users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;






LOCK TABLES `ws_website` WRITE;

INSERT INTO `ws_website` VALUES
(1,'published',NULL,'2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-06-20 20:03:19','2d89507a-8fdd-43d9-b34b-b9e537e05adf','2022-07-06 19:23:59',3,'localhost','http://localhost:3000','http://localhost:8055','| Virtual Christianity','summary','Virtual_Christianity','c7dc14f7-b979-4f93-b564-245fa329a579','d03b5fea-449e-4c34-a711-87e035b36f8a','localhost:3000','Virtual Christianity, Inc.','b02270ce-5c33-4e62-a56b-fce50d72e849');
