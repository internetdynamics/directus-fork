import getItem from "../queries/getItemPublic";

export const globals = async () => {
  const assetsUrl = process.env.NEXT_PUBLIC_ASSETS_URL;
  const heroData = await getItem("hero");
  const headerData = await getItem("header");
  const footerData = await getItem("footer");
  return {
    props: {
      heroImageUrl: assetsUrl + "/" + heroData.image,
      title: heroData.title,
      subtitle: heroData.subtitle,
      headerImageUrl: assetsUrl + "/" + headerData.image,
      headerLinks: headerData.links,
      footerImageUrl: assetsUrl + "/" + footerData.image,
      footerSocialLinks: footerData.socialLinks,
      footerLegalLinks: footerData.legalLinks,
      footerText: footerData.text
    }
  };
};

export default globals;
