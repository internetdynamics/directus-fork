import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import WebsiteSection from "./WebsiteSection";

export default function WebsitePage({ website, page, sections }) {
  const router = useRouter();

  const { status } = useSession({
    required: page.isLoginRequired ? true : false,
    onUnauthenticated() {
      if (page.isLoginRequired) {
        router.push("/sign-in");
      }
    }
  });

  let sectionsJsx = [];
  if (
    ((page.isLoginRequired && status === "authenticated") ||
      !page.isLoginRequired) &&
    status !== "loading"
  ) {
    sections?.forEach((section, index) => {
      sectionsJsx.push(
        <div key={index}>
          <WebsiteSection website={website} section={section} />
        </div>
      );
    });
  }

  return <>{sectionsJsx}</>;
}
