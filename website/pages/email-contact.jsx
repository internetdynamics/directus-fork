import { useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { useSession } from "next-auth/react";
import vcWebsite from "../lib/VCWebsite";
import { toast } from "../utils/toast";

// https://github.com/ryntab/Directus-Mailer?ref=codetea.com
// EMAIL_ALLOW_GUEST_SEND=false
// Guest sending is intended for more convenient debugging with API clients, you should always set
// this to false when not debugging

const EmailContact = () => {
  const router = useRouter();

  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      toast(
        "warning",
        "Authentication Required",
        "Please sign in or request an invitation to contact Us"
      );
      router.push("/sign-in");
    }
  });

  const [userData, setUserData] = useState({
    from: "",
    text: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const url = apiBaseUrl + "/Mailer";

    userData.from = userData.from.trim();
    userData.to = "info@virtualchristianity.org";
    userData.subject = "Message to Virtual Christianity";
    userData.template = {
      name: "email-contact",
      data: {
        body: userData.text
      }
    };

    if (!userData.from) {
      toast(
        "warning",
        "Email-Address Required",
        "Please provide your email-address"
      );
      return true;
    }

    if (!userData.text) {
      toast("warning", "Message Required", "Please provide a message");
      return true;
    }

    let data = JSON.stringify(userData);

    let config = {
      method: "post",
      url: url,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.user.accessToken}`
      },
      data: data
    };

    await axios(config)
      .then((response) => {
        if (response.data === "sent") {
          toast(
            "success",
            "Email Sent Successfully",
            "We will get back to you as soon as possible"
          );
        }
        const inputs = document.querySelectorAll("#text, #from");
        inputs.forEach((input) => {
          input.value = "";
        });
      })
      .catch((error) => {
        toast(
          "error",
          "Email Sent Unsuccessfully",
          "You can try sending an email to info@virtualchristianity.org"
        );
      });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  return (
    <>
      {status === "authenticated" && status !== "loading" && (
        <div className="ml-5 mr-5">
          <div className="flex m-10 w-full max-w-md mx-auto overflow-hidden rounded-lg shadow-lg bg-gray-100 dark:bg-gray-800 lg:max-w-4xl">
            <div
              className="hidden bg-cover lg:block lg:w-1/2"
              style={{
                backgroundImage: "url('/images/hands-1046x1295.png')",
                boxShadow: "0 0 8px 8px #F3F4F6 inset"
              }}
            ></div>

            <div className="w-full px-6 py-8 md:px-8 lg:w-1/2">
              <h2 className="text-2xl font-semibold text-center text-primary dark:text-white">
                Virtual Christianity
              </h2>

              <p className="text-xl text-center text-gray-800 dark:text-gray-200">
                Contact Us
              </p>

              <form className="max-w-4xl p-6 mx-auto" onSubmit={handleSubmit}>
                <div className="mt-4">
                  <label
                    className="mb-2 text-md text-primary dark:text-gray-200"
                    htmlFor="from"
                  >
                    Your Email Address
                  </label>
                  <input
                    id="from"
                    type="text"
                    name="from"
                    onChange={(e) => handleChange(e)}
                    className="block mb-6 w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40 dark:focus:border-blue-300 focus:outline-none focus:ring"
                  />
                </div>

                <div className="mt-4">
                  <label
                    className="mb-2 text-md text-primary dark:text-gray-200"
                    htmlFor="text"
                  >
                    Message
                  </label>
                  <textarea
                    maxLength="400"
                    placeholder="max of 400 characters"
                    id="text"
                    name="text"
                    onChange={(e) => handleChange(e)}
                    className="block mt-2 w-full h-40 px-4 py-2 text-gray-700 bg-white border rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-40"
                  ></textarea>
                </div>

                <div className="mt-8">
                  <button className="w-full px-4 py-2 tracking-wide text-white transition-colors duration-200 transform bg-gray-700 rounded hover:bg-gray-600 focus:outline-none focus:bg-gray-600">
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export async function getServerSideProps(context) {
  let props = {};
  let req = context.req;
  vcWebsite.getWebPageDataFromRequest(props, req);
  await vcWebsite.getWebPageDataFromDatabase(props, props.pageHostPath);
  return { props: props };
}

export default EmailContact;
