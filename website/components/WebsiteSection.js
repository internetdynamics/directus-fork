import WebsiteSectionHero from "./WebsiteSectionHero";
import WebsiteSectionMain from "./WebsiteSectionMain";
import WebsiteSectionRichtext from "./WebsiteSectionRichtext";
import WebsiteSection01 from "./WebsiteSection-01";
import WebsiteSection02 from "./WebsiteSection-02";
import WebsiteSection03 from "./WebsiteSection-03";
import WebsiteSection04 from "./WebsiteSection-04";
import WebsiteSection05 from "./WebsiteSection-05";
import WebsiteSection06 from "./WebsiteSection-06";
import WebsiteSection07 from "./WebsiteSection-07";
import WebsiteSection08 from "./WebsiteSection-08";
import WebsiteSection09 from "./WebsiteSection-09";
import WebsiteSection10 from "./WebsiteSection-10";
import WebsiteSection11 from "./WebsiteSection-11";
import WebsiteSection12 from "./WebsiteSection-12";
import WebsiteSection13 from "./WebsiteSection-13";
import WebsiteSection14 from "./WebsiteSection-14";
import WebsiteSection15 from "./WebsiteSection-15";
import WebsiteSection16 from "./WebsiteSection-16";
import WebsiteSection17 from "./WebsiteSection-17";
import WebsiteSection18 from "./WebsiteSection-18";
import WebsiteSection19 from "./WebsiteSection-19";
import WebsiteSection20 from "./WebsiteSection-20";
import WebsiteSection21 from "./WebsiteSection-21";
import WebsiteSection22 from "./WebsiteSection-22";
import WebsiteSection23 from "./WebsiteSection-23";
import WebsiteSection24 from "./WebsiteSection-24";

export default function WebsiteSection({ website, section }) {
  let sectionJsx;
  if (section.sectionType === "section-main")
    sectionJsx = <WebsiteSectionMain website={website} section={section} />;
  else if (section.sectionType === "section-hero")
    sectionJsx = <WebsiteSectionHero website={website} section={section} />;
  else if (section.sectionType === "section-richtext")
    sectionJsx = <WebsiteSectionRichtext website={website} section={section} />;
  else if (section.sectionType === "section-01")
    sectionJsx = <WebsiteSection01 website={website} section={section} />;
  else if (section.sectionType === "section-02")
    sectionJsx = <WebsiteSection02 website={website} section={section} />;
  else if (section.sectionType === "section-03")
    sectionJsx = <WebsiteSection03 website={website} section={section} />;
  else if (section.sectionType === "section-04")
    sectionJsx = <WebsiteSection04 website={website} section={section} />;
  else if (section.sectionType === "section-05")
    sectionJsx = <WebsiteSection05 website={website} section={section} />;
  else if (section.sectionType === "section-06")
    sectionJsx = <WebsiteSection06 website={website} section={section} />;
  else if (section.sectionType === "section-07")
    sectionJsx = <WebsiteSection07 website={website} section={section} />;
  else if (section.sectionType === "section-08")
    sectionJsx = <WebsiteSection08 website={website} section={section} />;
  else if (section.sectionType === "section-09")
    sectionJsx = <WebsiteSection09 website={website} section={section} />;
  else if (section.sectionType === "section-10")
    sectionJsx = <WebsiteSection10 website={website} section={section} />;
  else if (section.sectionType === "section-11")
    sectionJsx = <WebsiteSection11 website={website} section={section} />;
  else if (section.sectionType === "section-12")
    sectionJsx = <WebsiteSection12 website={website} section={section} />;
  else if (section.sectionType === "section-13")
    sectionJsx = <WebsiteSection13 website={website} section={section} />;
  else if (section.sectionType === "section-14")
    sectionJsx = <WebsiteSection14 website={website} section={section} />;
  else if (section.sectionType === "section-15")
    sectionJsx = <WebsiteSection15 website={website} section={section} />;
  else if (section.sectionType === "section-16")
    sectionJsx = <WebsiteSection16 website={website} section={section} />;
  else if (section.sectionType === "section-17")
    sectionJsx = <WebsiteSection17 website={website} section={section} />;
  else if (section.sectionType === "section-18")
    sectionJsx = <WebsiteSection18 website={website} section={section} />;
  else if (section.sectionType === "section-19")
    sectionJsx = <WebsiteSection19 website={website} section={section} />;
  else if (section.sectionType === "section-20")
    sectionJsx = <WebsiteSection20 website={website} section={section} />;
  else if (section.sectionType === "section-21")
    sectionJsx = <WebsiteSection21 website={website} section={section} />;
  else if (section.sectionType === "section-22")
    sectionJsx = <WebsiteSection22 website={website} section={section} />;
  else if (section.sectionType === "section-23")
    sectionJsx = <WebsiteSection23 website={website} section={section} />;
  else if (section.sectionType === "section-24")
    sectionJsx = <WebsiteSection24 website={website} section={section} />;
  else sectionJsx = <WebsiteSectionMain website={website} section={section} />;
  return sectionJsx;
}
