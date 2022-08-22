
--
-- Table structure for table `group`
--

DROP TABLE IF EXISTS `group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `group` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `status` varchar(255) NOT NULL DEFAULT 'draft',
  `sort` int(11) DEFAULT NULL,
  `user_created` char(36) DEFAULT NULL,
  `date_created` timestamp NULL DEFAULT NULL,
  `user_updated` char(36) DEFAULT NULL,
  `date_updated` timestamp NULL DEFAULT NULL,
  `groupname` varchar(255) DEFAULT NULL,
  `groupType` varchar(255) DEFAULT NULL,
  `groupDisplayName` varchar(255) DEFAULT NULL,
  `groupDescription` text DEFAULT NULL,
  `groupDefaultRole` varchar(255) DEFAULT 'member',
  `groupPrefs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`groupPrefs`)),
  PRIMARY KEY (`id`),
  UNIQUE KEY `group_groupname_unique` (`groupname`),
  UNIQUE KEY `group_groupdisplayname_unique` (`groupDisplayName`),
  KEY `group_user_created_foreign` (`user_created`),
  KEY `group_user_updated_foreign` (`user_updated`),
  CONSTRAINT `group_user_created_foreign` FOREIGN KEY (`user_created`) REFERENCES `directus_users` (`id`),
  CONSTRAINT `group_user_updated_foreign` FOREIGN KEY (`user_updated`) REFERENCES `directus_users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `group_memb`
--

DROP TABLE IF EXISTS `group_memb`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `group_memb` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_created` char(36) DEFAULT NULL,
  `date_created` timestamp NULL DEFAULT NULL,
  `user_updated` char(36) DEFAULT NULL,
  `date_updated` timestamp NULL DEFAULT NULL,
  `uid` char(36) DEFAULT NULL,
  `gid` int(10) unsigned DEFAULT NULL,
  `membStatus` varchar(255) DEFAULT NULL,
  `groupMembPrefs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`groupMembPrefs`)),
  PRIMARY KEY (`id`),
  KEY `group_memb_user_created_foreign` (`user_created`),
  KEY `group_memb_user_updated_foreign` (`user_updated`),
  KEY `group_memb_uid_foreign` (`uid`),
  KEY `group_memb_gid_foreign` (`gid`),
  CONSTRAINT `group_memb_gid_foreign` FOREIGN KEY (`gid`) REFERENCES `group` (`id`) ON DELETE NO ACTION,
  CONSTRAINT `group_memb_uid_foreign` FOREIGN KEY (`uid`) REFERENCES `directus_users` (`id`) ON DELETE NO ACTION,
  CONSTRAINT `group_memb_user_created_foreign` FOREIGN KEY (`user_created`) REFERENCES `directus_users` (`id`),
  CONSTRAINT `group_memb_user_updated_foreign` FOREIGN KEY (`user_updated`) REFERENCES `directus_users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

