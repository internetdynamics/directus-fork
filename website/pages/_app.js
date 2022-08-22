import "../styles/globals.css";
import "tailwindcss/tailwind.css";
import "simple-notify/dist/simple-notify.min.css";
import { SessionProvider } from "next-auth/react";
import { QueryClientProvider, QueryClient } from "react-query";
import WebsiteNavbar from "../components/WebsiteNavbar";
import WebsiteFooter from "../components/WebsiteFooter";

const queryClient = new QueryClient();

export default function VcApp({
  Component,
  pageProps: { session, ...pageProps }
}) {
  // console.log("pages/_app.js session", session);
  // console.log("pages/_app.js pageProps", pageProps);
  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout || ((page) => page);
  const pagejsx = getLayout(<Component {...pageProps} />);

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <SessionProvider session={session}>
          <WebsiteNavbar website={pageProps.website} page={pageProps.page} />
          {pagejsx}
          <WebsiteFooter website={pageProps.website} page={pageProps.page} />
        </SessionProvider>
      </QueryClientProvider>
    </>
  );
}
