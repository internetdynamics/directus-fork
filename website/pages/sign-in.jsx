import { getCsrfToken, signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { toast } from "../utils/toast";
import vcWebsite from "../lib/VCWebsite";

function SignIn({ csrfToken }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: e.target.email.value,
        password: e.target.password.value,
        callbackUrl: `/user-area`
      });

      if (res.error) {
        toast("error", "Sign In Failed", res.error);
      } else {
        router.push("/");
      }
    } catch (err) {
      let message = "An error occurred, please try again";
      if (err.message) {
        message = err.message.replace("email", "Email Address");
      }
      toast("error", "Sign In Failed", message);
    }
  };

  return (
    <div className="ml-5 mr-5">
      <Head>
        <title>Sign In</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex m-10 w-full max-w-md mx-auto overflow-hidden bg-white rounded-lg shadow-lg dark:bg-gray-800 lg:max-w-4xl">
        <div
          className="hidden bg-cover lg:block lg:w-1/2"
          style={{
            backgroundImage: "url('/images/walking-1060x1169.png')",
            boxShadow: "0 0 8px 8px #F3F4F6 inset"
          }}
        ></div>

        <div className="w-full px-6 py-8 md:px-8 lg:w-1/2">
          <h2 className="text-2xl font-semibold text-center text-primary dark:text-white">
            Virtual Christianity
          </h2>

          <p className="text-xl text-center text-gray-800 dark:text-gray-200">
            Welcome back!
          </p>

          <form
            className="max-w-4xl p-6 mx-auto"
            noValidate
            onSubmit={(e) => handleSubmit(e)}
          >
            <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
            <div className="mt-4">
              <label
                className="mb-2 text-md text-primary dark:text-gray-200"
                htmlFor="emailAddress"
              >
                Email Address
              </label>
              <input
                type="text"
                name="email"
                className="block mb-6 w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40 dark:focus:border-blue-300 focus:outline-none focus:ring"
              />
            </div>

            <div className="mt-4 relative">
              <div className="flex justify-between">
                <label
                  className="block text-md text-primary dark:text-gray-200"
                  htmlFor="password"
                >
                  Password
                </label>
                <Link href="/request-pass-reset">
                  <span className="cursor-pointer mt-1 text-sm text-secondary-800 dark:text-gray-300">
                    Forgot Password?
                  </span>
                </Link>
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

            <div className="mt-8">
              <button className="w-full px-4 py-2 tracking-wide text-white transition-colors duration-200 transform bg-gray-700 rounded hover:bg-gray-600 focus:outline-none focus:bg-gray-600">
                Sign In
              </button>
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="w-1/5 border-b dark:border-gray-600 md:w-1/4"></span>

              <Link href="/request-sign-up">
                <span className="cursor-pointer text-sm text-secondary-800 dark:text-gray-300">
                  Or Request Invitation
                </span>
              </Link>

              <span className="w-1/5 border-b dark:border-gray-600 md:w-1/4"></span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  let props = {};
  let req = context.req;
  props["csrfToken"] = await getCsrfToken(context);
  vcWebsite.getWebPageDataFromRequest(props, req);
  await vcWebsite.getWebPageDataFromDatabase(props, props.pageHostPath);
  return { props: props };
}

export default SignIn;
