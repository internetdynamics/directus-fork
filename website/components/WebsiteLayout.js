import Head from "next/head";
import WebsiteNavbar from "./WebsiteNavbar";
import WebsiteFooter from "./WebsiteFooter";

export default function Layout({ children }) {
  let props = children.props || {};
  let website = props.website;
  let page = props.page;

  return (
    <>
      <Head>
        <title>
          {page?.htmlTitle} {website?.htmlTitleSuffix}
        </title>
        <link
          rel="shortcut icon"
          href={
            website?.baseApiUrl + "/assets/" + website?.favicon.filename_disk
          }
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&amp;display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
        />
        <meta name="robots" content="index,follow" />
        <meta name="googlebot" content="index,follow" />
        <meta name="description" content={page?.pageMetaDescription} />
        <meta name="twitter:card" content={website?.twitterCardType} />
        <meta name="twitter:creator" content={website?.twitterUsername} />
        <meta property="og:title" content={page?.pageMetaTitle} />
        <meta property="og:description" content={page?.pageMetaDescription} />
        <meta
          property="og:image"
          content={
            website?.baseApiUrl +
            "/assets/" +
            page?.pageMetaImage?.filename_disk
          }
        />
        <meta property="og:image:width" content={page?.pageMetaImage?.width} />
        <meta
          property="og:image:height"
          content={page?.pageMetaImage?.height}
        />
      </Head>

      {/* <WebsiteNavbar website={props.website} page={props.page} /> */}
      <main>{children}</main>
      {/* <WebsiteFooter website={props.website} page={props.page} /> */}
    </>
  );
}
