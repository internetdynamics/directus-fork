import { Directus } from "@directus/sdk";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";
import getUserData from "../helpers/getUserData";
import { toast } from "../utils/toast";
import vcWebsite from "../lib/VCWebsite";

const RequestPassReset = () => {
  const directus = new Directus(process.env.NEXT_PUBLIC_API_BASE_URL);
  const [email, setEmail] = useState("");

  const { data: session, status } = useSession({
    required: false
  });

  useEffect(() => {
    async function initialFetch() {
      const user = await getUserData(session.user.accessToken);
      setEmail(user.email);
    }
    if (status === "authenticated") {
      initialFetch();
    }
  }, [status]); // When status changes to authenticated code will execute, going from loading... to authenticated

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await directus.auth.password.request(
        e.target.email.value,
        process.env.NEXT_PUBLIC_NEXT_URL + "/reset-password"
      );
      toast(
        "success",
        "Request Password Reset Successful",
        "Please check your email for further instructions"
      );
    } catch (err) {
      toast(
        "error",
        "Request Password Reset Failed",
        "An error occurred, please try again"
      );
    }
  };

  return (
    <div className="ml-5 mr-5">
      <Head>
        <title>Request Password Reset</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex m-10 w-full max-w-md mx-auto overflow-hidden bg-white rounded-lg shadow-lg dark:bg-gray-800 lg:max-w-4xl">
        <div
          className="hidden bg-cover lg:block lg:w-1/2"
          style={{
            backgroundImage: "url('/images/walking-1045x790.png')",
            boxShadow: "0 0 8px 8px #F3F4F6 inset"
          }}
        ></div>

        <div className="w-full px-6 py-8 md:px-8 lg:w-1/2">
          <h2 className="text-2xl font-semibold text-center text-primary dark:text-white">
            Virtual Christianity
          </h2>

          <p className="text-xl text-center text-gray-800 dark:text-gray-200">
            Reset Password
          </p>

          <form className="max-w-4xl p-6 mx-auto" onSubmit={handleSubmit}>
            <div className="mt-4">
              <label
                className="mb-2 text-md text-primary dark:text-gray-200"
                htmlFor="emailAddress"
              >
                Email Address
              </label>
              {status === "authenticated" ? (
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email || ""}
                  required
                  readOnly
                  className="block mb-6 w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40 dark:focus:border-blue-300 focus:outline-none focus:ring"
                />
              ) : (
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block mb-6 w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40 dark:focus:border-blue-300 focus:outline-none focus:ring"
                />
              )}
            </div>

            <div className="mt-8">
              <button className="w-full px-4 py-2 tracking-wide text-white transition-colors duration-200 transform bg-gray-700 rounded hover:bg-gray-500 focus:outline-none focus:bg-gray-600">
                Request Password Reset
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export async function getServerSideProps(context) {
  let props = {};
  let req = context.req;
  vcWebsite.getWebPageDataFromRequest(props, req);
  await vcWebsite.getWebPageDataFromDB("prisma", props, props.pageHostPath);
  return { props: props };
}

export default RequestPassReset;
