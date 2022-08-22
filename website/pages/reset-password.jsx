import Head from "next/head";
import { useState } from "react";
import { Directus } from "@directus/sdk";
import { useRouter } from "next/router";
import { toast } from "../utils/toast";
import vcWebsite from "../lib/VCWebsite";

const ResetPassword = () => {
  const directus = new Directus(process.env.NEXT_PUBLIC_API_BASE_URL);
  const { query } = useRouter();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  if (!query.token) {
    return;
  }

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
        await directus.auth.password.reset(
          query.token,
          e.target.password.value
        );
        toast(
          "success",
          "Password Reset Successful",
          "Your new password is ready to use"
        );
        router.push("/");
      } catch (err) {
        toast(
          "error",
          "Password Reset Failed",
          "An error occurred, please try again. You may have to request another password reset"
        );
        router.push("/");
      }
    } else {
      toast("error", "Reset Password Failed", "Passwords do not match ");
    }
  };

  return (
    <div className="ml-5 mr-5">
      <Head>
        <title>Reset Password</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex m-10 w-full max-w-md mx-auto overflow-hidden rounded-lg shadow-lg bg-gray-100 dark:bg-gray-800 lg:max-w-4xl">
        <div
          className="hidden bg-cover lg:block lg:w-1/2"
          style={{
            backgroundImage: "url('/images/walking-1047x1003.png')",
            boxShadow: "0 0 8px 8px #F3F4F6 inset"
          }}
        ></div>

        <div className="w-full px-6 py-8 md:px-8 lg:w-1/2">
          <h2 className="text-2xl font-semibold text-center text-black dark:text-white">
            Virtual Christianity
          </h2>

          <p className="text-xl text-center text-gray-800 dark:text-gray-200">
            Reset Password
          </p>

          <form
            className="max-w-4xl p-6 mx-auto"
            noValidate
            onSubmit={(e) => handleSubmit(e)}
          >
            <div className="mt-4 relative">
              <label
                className="mb-2 text-md text-black dark:text-gray-200"
                htmlFor="password"
              >
                New Password
                <span className="text-black ml-2">
                  (six or more characters)
                </span>
              </label>
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
              <label
                className="mb-2 text-md text-black dark:text-gray-200"
                htmlFor="password"
              >
                Confirm New Password
              </label>
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
                Reset Password
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

export default ResetPassword;
