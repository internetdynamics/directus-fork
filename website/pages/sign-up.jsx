import Head from "next/head";
import { useState } from "react";
import { Directus } from "@directus/sdk";
import { useRouter } from "next/router";
import { toast } from "../utils/toast";
import vcWebsite from "../lib/VCWebsite";

const SignUp = () => {
  const directus = new Directus(process.env.NEXT_PUBLIC_API_BASE_URL);
  const { query } = useRouter();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (e.target.password.value) {
      e.target.password.value.trim();
    }
    if (e.target.passwordConfirmation.value) {
      e.target.password.value.trim();
    }

    if (e.target.password.value === e.target.passwordConfirmation.value) {
      try {
        await directus.users.invites.accept(
          query.token,
          e.target.password.value
        );
        toast("success", "Sign Up Successful", "Please sign in");
        router.push("sign-in");
      } catch (err) {
        let message = "An error occurred, please try again";
        if (err.message) {
          message = err.message.replace("email", "Email Address");
        }
        toast("error", "Sign Up Failed", message);
      }
    } else {
      toast("error", "Sign Up Failed", "Passwords do not match ");
    }
  };

  return (
    <div className="ml-5 mr-5">
      <Head>
        <title>Sign Up</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex m-10 w-full max-w-md mx-auto overflow-hidden bg-white rounded-lg shadow-lg dark:bg-gray-800 lg:max-w-4xl">
        <div
          className="hidden bg-cover lg:block lg:w-1/2"
          style={{
            backgroundImage: "url('/images/hands-1053x1424.png')",
            boxShadow: "0 0 8px 8px #F3F4F6 inset"
          }}
        ></div>

        <div className="w-full px-6 py-8 md:px-8 lg:w-1/2">
          <h2 className="text-2xl font-semibold text-center text-black dark:text-white">
            Virtual Christianity
          </h2>

          <p className="text-xl text-center text-gray-800 dark:text-gray-200">
            Welcome!
          </p>

          <form
            className="max-w-4xl p-6 mx-auto"
            noValidate
            onSubmit={(e) => handleSubmit(e)}
          >
            <div className="mt-4 relative">
              <div className="flex justify-between">
                <label
                  className="block text-md text-black dark:text-gray-200"
                  htmlFor="password"
                >
                  Password
                  <span className="text-black ml-2">
                    (six or more characters)
                  </span>
                </label>
              </div>

              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40 dark:focus:border-blue-300 focus:outline-none focus:ring"
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{ top: "2.8em", right: "0.4em" }}
                className="absolute bg-gray-300 hover:bg-gray-400 rounded px-2 py-1 text-sm text-gray-600 font-mono cursor-pointer"
                htmlFor="toggle"
              >
                {showPassword ? "hide" : "show"}
              </span>
            </div>

            <div className="mt-4 relative">
              <div className="flex justify-between">
                <label
                  className="block text-md text-black dark:text-gray-200"
                  htmlFor="passwordConfirmation"
                >
                  Confirm Password
                </label>
              </div>

              <input
                type={showRepeatPassword ? "text" : "password"}
                name="passwordConfirmation"
                className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40 dark:focus:border-blue-300 focus:outline-none focus:ring"
              />
              <span
                onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                style={{ top: "2.8em", right: "0.4em" }}
                className="absolute bg-gray-300 hover:bg-gray-400 rounded px-2 py-1 text-sm text-gray-600 font-mono cursor-pointer"
                htmlFor="toggle"
              >
                {showRepeatPassword ? "hide" : "show"}
              </span>
            </div>

            <div className="mt-8">
              <button className="w-full px-4 py-2 tracking-wide text-white transition-colors duration-200 transform bg-gray-700 rounded hover:bg-gray-500 focus:outline-none focus:bg-gray-600">
                Sign Up
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
  await vcWebsite.getWebPageDataFromDatabase(props, props.pageHostPath);
  return { props: props };
}

export default SignUp;
