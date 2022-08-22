import WebsitePage from "../components/WebsitePage";
import WebsiteLayout from "../components/WebsiteLayout";
import vcWebsite from "../lib/VCWebsite";

export default function RootPage(props) {
  return (
    <WebsitePage
      website={props.website}
      page={props.page}
      sections={props.sections}
    />
  );
}

RootPage.getLayout = function getLayout(page) {
  return <WebsiteLayout>{page}</WebsiteLayout>;
};

export async function getServerSideProps(context) {
  let props = {};
  let req = context.req;
  vcWebsite.getWebPageDataFromRequest(props, req);
  await vcWebsite.getWebPageDataFromDatabase(props, props.pageHostPath);

  if (JSON.stringify(props.page) === "{}") {
    return { notFound: true };
  } else {
    return { props: props };
  }
}
